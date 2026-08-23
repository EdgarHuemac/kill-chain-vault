import { splitHighlight } from "../search.js";

export default function Highlight({ text, query, className }) {
  if (!text) return null;
  const parts = splitHighlight(text, query);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>
      )}
    </span>
  );
}
