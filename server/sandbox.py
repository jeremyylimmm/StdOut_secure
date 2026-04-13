"""
Sandboxed Python execution environment.

Reads user code from stdin and executes it with restricted imports and builtins.

Defense layers:
  1. Pre-import all allowed modules so their internal deps are cached
  2. Poison sys.modules for dangerous modules (import os -> ImportError)
  3. meta_path blocker as a backup for anything not yet cached
  4. Restricted __import__ and builtins passed into exec() namespace

NOTE: This raises the bar significantly but is not a substitute for OS-level
isolation (Docker/seccomp). Python's object model (__subclasses__ escapes)
can still be exploited by a determined attacker. For production, add Docker.
"""
import sys
import builtins as _builtins

# ---------------------------------------------------------------------------
# 1. Pre-import everything we want to allow (caches their internal deps)
# ---------------------------------------------------------------------------
import json
import math, cmath
import collections, collections.abc
import heapq, bisect
import functools, itertools, operator
import re, string
import decimal, fractions, numbers
import random
import copy
import typing, types
import enum, dataclasses
import abc
import struct, array
import pprint, textwrap
import statistics
import traceback

# ---------------------------------------------------------------------------
# 2. Poison dangerous modules in sys.modules
#    Setting a key to None makes `import <name>` raise ImportError.
# ---------------------------------------------------------------------------
_BLOCKED_MODULES = {
    # OS / process
    'os', 'os.path', 'nt', 'posix',
    'subprocess', 'signal', 'resource',
    'pty', 'tty', 'termios', 'fcntl',
    # File system
    'io', 'pathlib', 'shutil', 'tempfile',
    'glob', 'fnmatch', 'fileinput',
    # System / platform
    'sys', 'sysconfig', 'site', 'platform',
    # Networking
    'socket', 'ssl', 'select', 'selectors',
    'http', 'http.client', 'http.server',
    'urllib', 'urllib.request', 'urllib.parse',
    'ftplib', 'smtplib', 'imaplib', 'poplib',
    'xmlrpc', 'socketserver', 'asyncio',
    # Concurrency
    'threading', 'multiprocessing', 'concurrent',
    'concurrent.futures', '_thread', 'queue',
    # Introspection / code execution (sandbox escape tools)
    'ast', 'dis', 'inspect', 'code', 'codeop',
    'py_compile', 'compileall', 'tokenize', 'token',
    # Dynamic import
    'importlib', 'importlib.util', 'importlib.machinery',
    'pkgutil', 'zipimport',
    # Low-level / dangerous serialisation
    'ctypes', 'mmap', 'gc',
    'pickle', 'pickletools', 'shelve', 'marshal',
    # Windows-specific
    'winreg', 'winsound', 'msvcrt',
    # Misc
    'atexit', 'faulthandler', 'tracemalloc',
}

for _mod in _BLOCKED_MODULES:
    sys.modules[_mod] = None  # type: ignore[assignment]

# ---------------------------------------------------------------------------
# 3. meta_path blocker (catches anything not yet in sys.modules)
# ---------------------------------------------------------------------------
_ALLOWED_BASE_MODULES = {
    'json', 'math', 'cmath', 'collections', 'heapq', 'bisect',
    'functools', 'itertools', 'operator', 're', 'string',
    'decimal', 'fractions', 'numbers', 'random', 'copy',
    'typing', 'types', 'enum', 'dataclasses', 'abc',
    'struct', 'array', 'pprint', 'textwrap', 'statistics',
    'traceback',
    # Internal C extensions used by the above (already cached, but list
    # them so the blocker doesn't interfere if something re-imports them)
    '_json', '_collections_abc', '_functools', '_decimal', '_operator',
    '_heapq', '_bisect', '_random', '_struct', '_statistics',
    'copyreg', '_copyreg', 'reprlib', 'keyword', 'weakref',
    '_weakref', '_weakrefset', 'warnings', '_warnings',
    'genericpath', 'linecache', 'sre_compile', 'sre_parse',
    'sre_constants', '_sre',
}


class _ImportBlocker:
    def find_module(self, name, path=None):
        base = name.split('.')[0]
        if name not in _ALLOWED_BASE_MODULES and base not in _ALLOWED_BASE_MODULES:
            return self
        return None

    def load_module(self, name):
        raise ImportError(
            f"import of '{name}' is not allowed in this environment"
        )


sys.meta_path.insert(0, _ImportBlocker())

# ---------------------------------------------------------------------------
# 4. Restricted builtins for exec() namespace
# ---------------------------------------------------------------------------
_BLOCKED_BUILTINS = {
    'open',        # file access
    'eval',        # dynamic code execution
    'exec',        # dynamic code execution
    'compile',     # bytecode compilation
    'breakpoint',  # debugger hook
    '__loader__',
    '__spec__',
    'memoryview',  # low-level buffer access
    'input',       # stdin reads (would block execution)
}

_restricted_builtins = {
    k: getattr(_builtins, k)
    for k in dir(_builtins)
    if k not in _BLOCKED_BUILTINS
}

_real_import = _builtins.__import__


def _safe_import(name, *args, **kwargs):
    base = name.split('.')[0]
    if name not in _ALLOWED_BASE_MODULES and base not in _ALLOWED_BASE_MODULES:
        raise ImportError(
            f"import of '{name}' is not allowed in this environment"
        )
    return _real_import(name, *args, **kwargs)


_restricted_builtins['__import__'] = _safe_import

# ---------------------------------------------------------------------------
# 5. Read and execute user code
# ---------------------------------------------------------------------------
_user_code = sys.stdin.read()

_user_globals = {
    '__builtins__': _restricted_builtins,
    '__name__': '__main__',
    '__doc__': None,
    '__package__': None,
    '__spec__': None,
}

try:
    exec(compile(_user_code, '<sandbox>', 'exec'), _user_globals)
except SystemExit:
    pass
