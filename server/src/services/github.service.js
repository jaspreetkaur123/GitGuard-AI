const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

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

/**
 * Fetch the diff for a Pull Request
 */
const fetchDiff = async (octokit, owner, repo, pull_number) => {
  try {
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: 'diff' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching PR diff:', error.message);
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
    console.error('Error posting comment:', error.message);
    throw error;
  }
};

module.exports = {
  getOctokitInstance,
  fetchDiff,
  postComment,
};
