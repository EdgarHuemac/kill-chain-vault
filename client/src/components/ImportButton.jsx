import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { createEngagement } from "../api.js";

export default function ImportButton({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFiles(fileList) {
    setError(null);
    const files = Array.from(fileList).filter((f) => f.name.endsWith(".json"));
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        const text = await file.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error(`"${file.name}" is not valid JSON`);
        }
        await createEngagement(parsed);
      }
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        className="btn btn-primary"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? <Loader2 className="spin" /> : <UploadCloud />}
        {busy ? "Importing…" : "Import engagement"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {error && <div className="import-error">{error}</div>}
    </div>
  );
}
