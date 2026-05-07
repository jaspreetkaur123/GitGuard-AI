const express = require("express");
const Repository = require("../models/Repository");
const User = require("../models/User");
const ReviewLog = require("../models/ReviewLog");
const {
  getUserOctokitInstance,
  createReviewCommentMessage,
  fetchUserRepositories,
  fetchRepositoryPullRequests,
  fetchDiff,
  postComment,
} = require("../services/github.service");
const { analyzeDiff } = require("../services/ai.service");

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.user?._id) {
    return res.status(401).json({ error: "Please login first" });
  }

  return next();
};

router.use(requireAuth);

// @desc    Fetch raw diff for a single pull request
// @route   GET /api/repositories/:id/pulls/:number/diff
router.get("/:id/pulls/:number/diff", async (req, res) => {
  try {
    const repo = await Repository.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const user = await User.findById(req.user._id).select("+githubAccessToken");

    if (!user?.githubAccessToken) {
      return res
        .status(400)
        .json({ error: "GitHub access token not found. Please login again." });
    }

    const [owner, repoName] = repo.fullName.split("/");

    if (!owner || !repoName) {
      return res.status(400).json({ error: "Invalid repository name" });
    }

    const pullNumber = Number(req.params.number);
    const octokit = await getUserOctokitInstance(user.githubAccessToken);
    const rawDiff = await fetchDiff(octokit, owner, repoName, pullNumber);

    res.json({
      repository: repo.fullName,
      pullRequestNumber: pullNumber,
      diff: rawDiff,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Review a single pull request using only its raw diff
// @route   POST /api/repositories/:id/pulls/:number/review
router.post("/:id/pulls/:number/review", async (req, res) => {
  try {
    const repo = await Repository.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const user = await User.findById(req.user._id).select("+githubAccessToken");

    if (!user?.githubAccessToken) {
      return res
        .status(400)
        .json({ error: "GitHub access token not found. Please login again." });
    }

    const [owner, repoName] = repo.fullName.split("/");

    if (!owner || !repoName) {
      return res.status(400).json({ error: "Invalid repository name" });
    }

    const pullNumber = Number(req.params.number);
    const octokit = await getUserOctokitInstance(user.githubAccessToken);
    const rawDiff = await fetchDiff(octokit, owner, repoName, pullNumber);
    const analysis = await analyzeDiff(rawDiff);
    const reviewComment = createReviewCommentMessage({
      repoFullName: repo.fullName,
      pullNumber,
      diffContent: rawDiff,
      analysis,
    });

    await postComment(octokit, owner, repoName, pullNumber, reviewComment);

    const reviewLog = await ReviewLog.create({
      repository: repo._id,
      pullRequestNumber: pullNumber,
      pullRequestUrl: `https://github.com/${repo.fullName}/pull/${pullNumber}`,
      diffAnalyzed: rawDiff,
      aiResponse: analysis,
      status: "success",
    });

    res.json({
      reviewLog: {
        id: reviewLog._id,
        repository: repo.fullName,
        pullRequestNumber: pullNumber,
        pullRequestUrl: reviewLog.pullRequestUrl,
        diffAnalyzed: rawDiff,
        aiResponse: analysis,
        status: reviewLog.status,
        createdAt: reviewLog.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Dashboard summary metrics and recent review logs
// @route   GET /api/repositories/dashboard/summary
router.get("/dashboard/summary", async (req, res) => {
  try {
    const repositories = await Repository.find({ owner: req.user._id })
      .select("_id fullName")
      .lean();

    const repositoryIds = repositories.map((repo) => repo._id);

    const [
      totalPRsReviewed,
      securityRisksAverted,
      performanceMentions,
      recentLogs,
    ] = await Promise.all([
      ReviewLog.countDocuments({
        repository: { $in: repositoryIds },
        status: "success",
      }),
      ReviewLog.countDocuments({
        repository: { $in: repositoryIds },
        status: "success",
        aiResponse:
          /security|vulnerab|xss|csrf|injection|hardcoded secret|auth/i,
      }),
      ReviewLog.countDocuments({
        repository: { $in: repositoryIds },
        status: "success",
        aiResponse: /performance|optimi[sz]e|latency|cpu|memory|slow/i,
      }),
      ReviewLog.find({ repository: { $in: repositoryIds } })
        .populate("repository", "fullName")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    let totalOpenPullRequests = 0;
    const user = await User.findById(req.user._id).select("+githubAccessToken");

    if (user?.githubAccessToken && repositories.length > 0) {
      const octokit = await getUserOctokitInstance(user.githubAccessToken);
      const pullRequestCounts = await Promise.allSettled(
        repositories.slice(0, 20).map(async (repo) => {
          const [owner, repoName] = repo.fullName.split("/");
          if (!owner || !repoName) {
            return 0;
          }

          const pulls = await fetchRepositoryPullRequests(
            octokit,
            owner,
            repoName,
          );
          return pulls.length;
        }),
      );

      totalOpenPullRequests = pullRequestCounts.reduce((sum, result) => {
        if (result.status === "fulfilled") {
          return sum + result.value;
        }

        return sum;
      }, 0);
    }

    const performanceGains =
      totalPRsReviewed > 0
        ? Math.round((performanceMentions / totalPRsReviewed) * 100)
        : 0;

    res.json({
      stats: {
        totalPRs: totalOpenPullRequests,
        totalPRsReviewed,
        securityRisksAverted,
        performanceGains,
      },
      recentReviewLogs: recentLogs.map((log) => ({
        id: log._id,
        repoFullName: log.repository?.fullName || "Unknown repository",
        pullRequestNumber: log.pullRequestNumber,
        pullRequestUrl: log.pullRequestUrl,
        aiResponse: log.aiResponse,
        diffAnalyzed: log.diffAnalyzed,
        status: log.status,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    List repositories imported into GitGuard
// @route   GET /api/repositories
router.get("/", async (req, res) => {
  try {
    const repos = await Repository.find({ owner: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    List authenticated user's GitHub repositories
// @route   GET /api/repositories/github
router.get("/github", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+githubAccessToken");

    if (!user?.githubAccessToken) {
      return res
        .status(400)
        .json({ error: "GitHub access token not found. Please login again." });
    }

    const octokit = await getUserOctokitInstance(user.githubAccessToken);
    const repos = await fetchUserRepositories(octokit);

    const payload = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner?.login,
      private: repo.private,
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
      updatedAt: repo.updated_at,
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Import a repository from GitHub into GitGuard
// @route   POST /api/repositories/import
router.post("/import", async (req, res) => {
  try {
    const { githubRepoId, name, fullName } = req.body;

    if (!githubRepoId || !name || !fullName) {
      return res
        .status(400)
        .json({ error: "githubRepoId, name and fullName are required" });
    }

    const repo = await Repository.findOneAndUpdate(
      { githubRepoId: githubRepoId.toString() },
      {
        $set: {
          owner: req.user._id,
          githubRepoId: githubRepoId.toString(),
          name,
          fullName,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.json(repo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update GitGuard repository settings
// @route   PATCH /api/repositories/:id
router.patch("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const repo = await Repository.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.json(repo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    List open pull requests for an imported repository
// @route   GET /api/repositories/:id/pulls
router.get("/:id/pulls", async (req, res) => {
  try {
    const repo = await Repository.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const user = await User.findById(req.user._id).select("+githubAccessToken");

    if (!user?.githubAccessToken) {
      return res
        .status(400)
        .json({ error: "GitHub access token not found. Please login again." });
    }

    const [owner, repoName] = repo.fullName.split("/");

    const octokit = await getUserOctokitInstance(user.githubAccessToken);
    const pulls = await fetchRepositoryPullRequests(octokit, owner, repoName);

    const payload = pulls.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user: pr.user?.login,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
