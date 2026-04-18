const {
  getOctokitInstance,
  createReviewCommentMessage,
  fetchDiff,
  postComment,
} = require("../services/github.service");
const { analyzeDiff } = require("../services/ai.service");
const ReviewLog = require("../models/ReviewLog");
const Repository = require("../models/Repository");
const { checkUsageLimit } = require("../middleware/usageLimit");

const handleGitHubWebhook = async (req, res) => {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    if (event === "pull_request") {
      const { action, pull_request, repository, installation } = payload;

      if (action === "opened" || action === "synchronize") {
        const owner = repository.owner.login;
        const repoName = repository.name;
        const pullNumber = pull_request.number;

        // 0. Check Usage Limit (Find repo and owner first)
        const repoDoc = await Repository.findOne({
          githubRepoId: repository.id.toString(),
        });
        if (repoDoc) {
          const limitCheck = await checkUsageLimit(repoDoc.owner);
          if (!limitCheck.allowed) {
            console.warn(
              `Limit reached for repo owner ${repoDoc.owner}: ${limitCheck.message}`,
            );
            // Optionally: Post a comment to PR saying limit is reached
            const octokit = await getOctokitInstance(installation.id);
            await postComment(
              octokit,
              owner,
              repoName,
              pullNumber,
              `🚫 **Limit Reached**: ${limitCheck.message}`,
            );
            return res
              .status(200)
              .json({ received: true, message: "Limit reached" });
          }
        }

        console.log(`Processing PR #${pullNumber} in ${repository.full_name}`);

        // 1. Get Octokit Instance
        const octokit = await getOctokitInstance(installation.id);

        // 2. Fetch Diff
        const diffData = await fetchDiff(octokit, owner, repoName, pullNumber);

        // 3. AI Analysis
        // We might want to limit the size of the diff to avoid token overflows
        const analysisResult = await analyzeDiff(diffData);
        const reviewComment = createReviewCommentMessage({
          repoFullName: repository.full_name,
          pullNumber,
          diffContent: diffData,
          analysis: analysisResult,
        });

        // 4. Post Comment back to PR
        await postComment(octokit, owner, repoName, pullNumber, reviewComment);

        // 5. Log the activity (Optional: Find the repo in our DB first)
        const repo_Doc = await Repository.findOne({
          githubRepoId: repository.id.toString(),
        });
        if (repo_Doc) {
          await ReviewLog.create({
            repository: repo_Doc._id,
            pullRequestNumber: pullNumber,
            pullRequestUrl: pull_request.html_url,
            diffAnalyzed: diffData,
            aiResponse: analysisResult,
            status: "success",
          });
        }

        console.log(`Successfully reviewed PR #${pullNumber}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    // Even on error, we log it if we can
    try {
      // Logic to log error in ReviewLog could go here
    } catch (logError) {
      console.error("Failed to log error:", logError.message);
    }
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

module.exports = {
  handleGitHubWebhook,
};
