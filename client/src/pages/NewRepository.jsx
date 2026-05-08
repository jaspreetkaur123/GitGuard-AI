import React, { useEffect, useState } from "react";
import axios from "axios";

export const NewRepository = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState(null);

  // 🔥 Fetch GitHub repos
  const fetchRepos = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/repositories/github",
        { withCredentials: true }
      );

      setRepos(res.data);
    } catch (err) {
      console.error("Error fetching repos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // 🔥 Import repo into MongoDB
  const importRepo = async (repo) => {
    try {
      setImportingId(repo.id);

      await axios.post(
        "http://localhost:5000/api/repositories/import",
        {
          githubRepoId: repo.id,
          name: repo.name,
          fullName: repo.fullName,
        },
        { withCredentials: true }
      );

      alert(`✅ Imported: ${repo.fullName}`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to import repository");
    } finally {
      setImportingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "var(--text-muted)" }}>
        Loading your GitHub repositories...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      {/* Header */}
      <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>
        Import GitHub Repository
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
        Select a repository to enable GitGuard AI analysis.
      </p>

      {/* Repo list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="glass-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
            }}
          >
            {/* Repo Info */}
            <div>
              <h3 style={{ marginBottom: "4px" }}>{repo.fullName}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {repo.private ? "Private Repo" : "Public Repo"}
              </p>
            </div>

            {/* Import Button */}
            <button
              className="btn-primary"
              onClick={() => importRepo(repo)}
              disabled={importingId === repo.id}
            >
              {importingId === repo.id ? "Importing..." : "Import"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewRepository;