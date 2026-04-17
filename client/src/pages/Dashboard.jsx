import React, { useEffect, useState } from "react";
import {
  Activity,
  ShieldAlert,
  Cpu,
  CheckCircle,
  GitPullRequest,
} from "lucide-react";
import { repoService } from "../services/api";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div
    className="glass-card"
    style={{ display: "flex", flexDirection: "column", gap: "12px" }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {title}
      </span>
      <div
        style={{
          padding: "8px",
          borderRadius: "8px",
          backgroundColor: `rgba(${color}, 0.1)`,
          color: `rgb(${color})`,
        }}
      >
        <Icon size={20} />
      </div>
    </div>
    <span style={{ fontSize: "1.875rem", fontWeight: 700 }}>{value}</span>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPRs: 0,
    totalPRsReviewed: 0,
    securityRisksAverted: 0,
    performanceGains: 0,
  });
  const [recentReviewLogs, setRecentReviewLogs] = useState([]);
  const [importedRepos, setImportedRepos] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [selectedGithubRepoId, setSelectedGithubRepoId] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [selectedPullRequest, setSelectedPullRequest] = useState(null);
  const [selectedPullRequestDiff, setSelectedPullRequestDiff] = useState("");
  const [isFetchingDiff, setIsFetchingDiff] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const loadInitialData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [summaryResponse, reposResponse, githubResponse] =
        await Promise.all([
          repoService.getDashboardSummary(),
          repoService.getRepos(),
          repoService.getGitHubRepos(),
        ]);

      setStats(
        summaryResponse.data?.stats || {
          totalPRs: 0,
          totalPRsReviewed: 0,
          securityRisksAverted: 0,
          performanceGains: 0,
        },
      );
      setRecentReviewLogs(summaryResponse.data?.recentReviewLogs || []);

      setImportedRepos(reposResponse.data);
      setGithubRepos(githubResponse.data);
      setSelectedGithubRepoId(
        (currentId) =>
          currentId || githubResponse.data[0]?.id?.toString() || "",
      );

      if (reposResponse.data.length > 0) {
        const firstRepoId = reposResponse.data[0]._id;
        setSelectedRepoId(firstRepoId);
        await loadPullRequests(firstRepoId);
      } else {
        setPullRequests([]);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          "Failed to load repositories. Please login again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadPullRequests = async (repoId) => {
    try {
      const response = await repoService.getPullRequests(repoId);
      setPullRequests(response.data);
    } catch (requestError) {
      setPullRequests([]);
      setError(
        requestError?.response?.data?.error ||
          "Failed to fetch pull requests for this repository.",
      );
    }
  };

  const handleImportRepository = async (repo) => {
    setIsImporting(true);
    setError("");

    try {
      const response = await repoService.importRepo({
        githubRepoId: repo.id,
        name: repo.name,
        fullName: repo.fullName,
      });

      const importedRepo = response.data;

      setImportedRepos((prev) => {
        const existing = prev.find((item) => item._id === importedRepo._id);
        if (existing) {
          return prev.map((item) =>
            item._id === importedRepo._id ? importedRepo : item,
          );
        }

        return [importedRepo, ...prev];
      });

      setSelectedRepoId(importedRepo._id);
      await loadPullRequests(importedRepo._id);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          "Unable to import repository right now.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectRepo = async (event) => {
    const repoId = event.target.value;
    setSelectedRepoId(repoId);
    setSelectedPullRequest(null);
    setSelectedPullRequestDiff("");
    setReviewResult(null);
    setError("");

    if (!repoId) {
      setPullRequests([]);
      return;
    }

    await loadPullRequests(repoId);
  };

  const handleSelectGithubRepo = (event) => {
    setSelectedGithubRepoId(event.target.value);
    setError("");
  };

  const handleSelectPullRequest = async (pullRequest) => {
    if (!selectedRepoId) {
      return;
    }

    setIsFetchingDiff(true);
    setSelectedPullRequest(pullRequest);
    setSelectedPullRequestDiff("");
    setReviewResult(null);
    setError("");

    try {
      const response = await repoService.getPullRequestDiff(
        selectedRepoId,
        pullRequest.number,
      );
      setSelectedPullRequestDiff(response.data?.diff || "");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          "Unable to fetch diff for this pull request.",
      );
    } finally {
      setIsFetchingDiff(false);
    }
  };

  const handleReviewPullRequest = async () => {
    if (!selectedRepoId) {
      return;
    }

    if (!selectedPullRequest) {
      setError("Select a pull request first to compare and analyze.");
      return;
    }

    setIsReviewing(true);
    setReviewResult(null);
    setError("");

    try {
      const response = await repoService.reviewPullRequest(
        selectedRepoId,
        selectedPullRequest.number,
      );

      setReviewResult(response.data.reviewLog);
      await loadInitialData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          "Unable to review this pull request right now.",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const selectedGithubRepo = githubRepos.find(
    (repo) => repo.id.toString() === selectedGithubRepoId,
  );
  const selectedRepoName =
    importedRepos.find((repo) => repo._id === selectedRepoId)?.fullName ||
    "the selected repository";

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      <header>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
          Dashboard Overview
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Welcome back! Here's what GitGuard AI has found recently.
        </p>
      </header>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
        }}
      >
        <StatCard
          title="Total Number of PRs"
          value={stats.totalPRs}
          icon={Activity}
          color="129, 140, 248"
        />
        <StatCard
          title="Total PRs Reviewed"
          value={stats.totalPRsReviewed}
          icon={CheckCircle}
          color="74, 222, 128"
        />
        <StatCard
          title="Security Risks Averted"
          value={stats.securityRisksAverted}
          icon={ShieldAlert}
          color="239, 68, 68"
        />
        <StatCard
          title="Performance Gains"
          value={`${stats.performanceGains}%`}
          icon={Cpu}
          color="34, 211, 238"
        />
      </div>

      {/* Recent Activity */}
      <div
        className="glass-card"
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        <h2 style={{ fontSize: "1.25rem" }}>Recent Review Logs</h2>
        {recentReviewLogs.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No review logs yet. Import a repository and trigger PR reviews.
          </p>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {recentReviewLogs.map((log, index) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "16px",
                borderBottom:
                  index !== recentReviewLogs.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <span style={{ fontWeight: 600 }}>
                  PR #{log.pullRequestNumber} review
                </span>
                <span
                  style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
                >
                  Repo: {log.repoFullName}
                </span>
              </div>
              <a
                href={log.pullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="badge-success"
                style={{ textDecoration: "none" }}
              >
                {log.status}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div
        className="glass-card"
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem" }}>Import Repository</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
              Pick a GitHub repository, import it, and then review its pull
              requests.
            </p>
          </div>
          {isLoading ? (
            <span style={{ color: "var(--text-muted)" }}>Loading...</span>
          ) : null}
        </div>

        {error ? (
          <div style={{ color: "#f87171", fontSize: "0.9rem" }}>{error}</div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={selectedGithubRepoId}
            onChange={handleSelectGithubRepo}
            style={{
              flex: 1,
              minWidth: "260px",
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              color: "white",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 12px",
              WebkitAppearance: "none",
              appearance: "none",
              colorScheme: "dark",
            }}
          >
            <option value="">Select a repository to import</option>
            {githubRepos.map((repo) => (
              <option key={repo.id} value={repo.id.toString()}>
                {repo.fullName}
              </option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() =>
              selectedGithubRepo && handleImportRepository(selectedGithubRepo)
            }
            disabled={!selectedGithubRepo || isImporting}
            style={{ minWidth: "140px", justifyContent: "center" }}
          >
            {isImporting ? "Importing..." : "Import Repo"}
          </button>
        </div>
      </div>

      <div
        className="glass-card"
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "1.25rem" }}>
            Pull Requests {selectedRepoId ? `(${pullRequests.length})` : ""}
          </h2>
          <select
            value={selectedRepoId}
            onChange={handleSelectRepo}
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              color: "white",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 10px",
              minWidth: "220px",
              WebkitAppearance: "none",
              appearance: "none",
              colorScheme: "dark",
            }}
          >
            <option value="">Select imported repository</option>
            {importedRepos.map((repo) => (
              <option key={repo._id} value={repo._id}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {selectedRepoId ? (
          <p style={{ color: "var(--text-muted)", marginTop: "-8px" }}>
            Showing pull requests for {selectedRepoName}.
          </p>
        ) : null}

        {selectedRepoId && pullRequests.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No open pull requests found for this repository.
          </p>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pullRequests.map((pr) => (
            <div
              key={pr.id}
              onClick={() => handleSelectPullRequest(pr)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelectPullRequest(pr);
                }
              }}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                color: "inherit",
                textDecoration: "none",
                background:
                  selectedPullRequest?.id === pr.id
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(255, 255, 255, 0.02)",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <GitPullRequest size={18} />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    #{pr.number} {pr.title}
                  </div>
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}
                  >
                    by {pr.user}
                  </div>
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span className="badge-success">{pr.state}</span>
                <a
                  href={pr.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h3 style={{ fontSize: "1rem" }}>Diff Review</h3>

          {selectedPullRequest ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <p style={{ color: "var(--text-muted)", margin: 0 }}>
                Selected PR #{selectedPullRequest.number}: click compare to run
                LLM on this diff.
              </p>
              <button
                className="btn-primary"
                onClick={handleReviewPullRequest}
                disabled={
                  isReviewing || isFetchingDiff || !selectedPullRequestDiff
                }
                style={{ minWidth: "180px", justifyContent: "center" }}
              >
                {isReviewing ? "Analyzing..." : "Compare & Analyze"}
              </button>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Select a pull request to load and compare code differences.
            </p>
          )}

          {isFetchingDiff ? (
            <p style={{ color: "var(--text-muted)" }}>
              Fetching raw diff for the selected pull request...
            </p>
          ) : null}

          {selectedPullRequestDiff ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <strong style={{ fontSize: "0.95rem" }}>Code Difference</strong>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "12px",
                  padding: "14px",
                  margin: 0,
                  color: "var(--text)",
                  maxHeight: "320px",
                  overflow: "auto",
                }}
              >
                {selectedPullRequestDiff}
              </pre>
            </div>
          ) : null}

          {isReviewing ? (
            <p style={{ color: "var(--text-muted)" }}>
              Fetching raw diff and analyzing only the changed lines...
            </p>
          ) : null}

          {reviewResult ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  PR #{reviewResult.pullRequestNumber} reviewed from raw diff
                </strong>
                <span className="badge-success">{reviewResult.status}</span>
              </div>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>
                The AI review used only the PR diff, not the full codebase.
              </p>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "12px",
                  padding: "14px",
                  margin: 0,
                  color: "var(--text)",
                  overflowX: "auto",
                }}
              >
                {reviewResult.aiResponse}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
