import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { useAppState } from "../lib/AppStateContext";

function CodeViewer({ code }) {
  const { theme } = useAppState();

  return (
    <div className="code-viewer">
    <CodeMirror
      value={code}
      extensions={[python(), indentUnit.of("    ")]}
      basicSetup={{ lineNumbers: true }}
      theme={theme === "dark" ? "dark" : "light"}
      editable={false}
      height="auto"
    />
    </div>
  );
}

export default CodeViewer;
