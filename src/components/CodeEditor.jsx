import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vim } from "@replit/codemirror-vim";
import { indentUnit } from "@codemirror/language";
import { useAppState } from "../lib/AppStateContext";

function CodeEditor({ value, onChange, onRun, onSubmit }) {
  const [vimEnabled, setVimEnabled] = useState(false);
  const { theme } = useAppState();

  return (
    <div className="card code-editor-card">
      <div className="code-editor-header">
        <div className="code-editor-header-left">
          <h3>Code Editor</h3>
        </div>
        <div className="code-editor-actions">
          <label className="vim-toggle">
            <input
              type="checkbox"
              checked={vimEnabled}
              onChange={(e) => setVimEnabled(e.target.checked)}
            />
            <span>Vim</span>
          </label>
          {onRun && (
            <button type="button" className="run-btn" onClick={onRun}>
              Run
            </button>
          )}
          {onSubmit && (
            <button type="button" className="submit-btn" onClick={onSubmit}>
              Submit
            </button>
          )}
        </div>
      </div>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[
          vimEnabled ? vim() : [],
          python(),
          indentUnit.of("    "), // 4 spaces
        ].filter(Boolean)}
        basicSetup={{ lineNumbers: true }}
        theme={theme === "dark" ? "dark" : "light"}
        height="100%"
      />
    </div>
  );
}

export default CodeEditor;
