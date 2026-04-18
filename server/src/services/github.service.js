const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

/**
 * Initialize Octokit for a specific installation
 * @param {string} installationId - The GitHub App installation ID
 */
const getOctokitInstance = (installationId) => {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
      installationId: installationId,
    },
  });
};

const getUserOctokitInstance = (accessToken) => {
  return new Octokit({
    auth: accessToken,
  });
};

const parseDiffStats = (diffContent = "") => {
  const lines = diffContent.split("\n");
  const files = new Set();
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git a/")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (match?.[2]) {
        files.add(match[2]);
      }
      continue;
    }

    if (line.startsWith("+++") || line.startsWith("---")) {
      continue;
    }

    if (line.startsWith("+")) {
      additions += 1;
      continue;
    }

    if (line.startsWith("-")) {
      deletions += 1;
    }
  }

  return {
    filesChanged: files.size,
    additions,
    deletions,
    topFiles: Array.from(files).slice(0, 8),
  };
};

const createReviewCommentMessage = ({
  repoFullName,
  pullNumber,
  diffContent,
  analysis,
}) => {
  const stats = parseDiffStats(diffContent);
  const filesSection =
    stats.topFiles.length > 0
      ? stats.topFiles.map((filePath) => `- \`${filePath}\``).join("\n")
      : "- No file paths detected from diff metadata.";

  return [
    "## GitGuard AI Review",
    "",
    `Repository: **${repoFullName}**`,
    `PR: **#${pullNumber}**`,
    "",
    "### Diff Snapshot",
    `- Files changed: **${stats.filesChanged}**`,
    `- Additions: **${stats.additions}**`,
    `- Deletions: **${stats.deletions}**`,
    "",
    "### Changed Files",
    filesSection,
    "",
    "### Analysis",
    analysis,
  ].join("\n");
};

const fetchUserRepositories = async (octokit) => {
  try {
    const repos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      {
        visibility: "all",
        affiliation: "owner,collaborator,organization_member",
        per_page: 100,
        sort: "updated",
      },
    );

    return repos;
  } catch (error) {
    console.error("Error fetching user repositories:", error.message);
    throw error;
  }
};

const fetchRepositoryPullRequests = async (octokit, owner, repo) => {
  try {
    const pulls = await octokit.paginate(octokit.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });

    return pulls;
  } catch (error) {
    console.error("Error fetching repository pull requests:", error.message);
    throw error;
  }
};

/**
 * Fetch the diff for a Pull Request
 */
const fetchDiff = async (octokit, owner, repo, pull_number) => {
  try {
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" },
    });
    return data;
  } catch (error) {
    console.error("Error fetching PR diff:", error.message);
    throw error;
  }
};

/**
 * Post a review comment to a Pull Request
 */
const postComment = async (octokit, owner, repo, pull_number, body) => {
  try {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body,
    });
  } catch (error) {
    const isIntegrationAccessError =
      error?.status === 403 ||
      error?.message?.includes("Resource not accessible by integration");

    if (isIntegrationAccessError) {
      try {
        await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number,
          event: "COMMENT",
          body,
        });
        return;
      } catch (fallbackError) {
        const guidance =
          "GitHub integration cannot comment on this PR. Ensure app/token has Pull requests: write (and Issues: write if using issue comments), and repository access includes this repo. For OAuth tokens, re-login with repo scope.";
        console.error(
          "Error posting PR review fallback comment:",
          fallbackError.message,
        );
        throw new Error(`${guidance} Original error: ${fallbackError.message}`);
      }
    }

    console.error("Error posting comment:", error.message);
    throw error;
  }
};

module.exports = {
  getOctokitInstance,
  getUserOctokitInstance,
  createReviewCommentMessage,
  fetchUserRepositories,
  fetchRepositoryPullRequests,
  fetchDiff,
  postComment,
};
