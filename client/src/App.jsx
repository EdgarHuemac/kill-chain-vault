import { useCallback, useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import EngagementView from "./components/EngagementView.jsx";
import { fetchEngagements } from "./api.js";
import "./App.css";

export default function App() {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEngagements();
      setEngagements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = engagements.find((e) => e.id === activeId) || null;

  if (active) {
    return (
      <EngagementView
        engagement={active}
        onBack={() => setActiveId(null)}
      />
    );
  }

  return (
    <Dashboard
      engagements={engagements}
      loading={loading}
      error={error}
      onOpen={(id) => setActiveId(id)}
      onRefresh={load}
    />
  );
}
