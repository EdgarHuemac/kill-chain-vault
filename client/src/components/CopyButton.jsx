import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text, className = "", label = true }) {
  const [copied, setCopied] = useState(false);

  function copy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className={`copy-btn btn btn-ghost ${className}`} onClick={copy} title="Copy to clipboard">
      {copied ? <Check /> : <Copy />}
      {label && <span>{copied ? "Copied" : "Copy"}</span>}
    </button>
  );
}
