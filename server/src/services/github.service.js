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
    console.error("Error posting comment:", error.message);
    throw error;
  }
};

module.exports = {
  getOctokitInstance,
  getUserOctokitInstance,
  fetchUserRepositories,
  fetchRepositoryPullRequests,
  fetchDiff,
  postComment,
};
