const ReviewLog = require('../models/ReviewLog');
const User = require('../models/User');

const FREE_TIER_LIMIT = 5;

/**
 * Middleware to check if a user has exceeded their free tier PR review limit.
 */
const checkUsageLimit = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    // Pro users have unlimited access
    if (user && user.subscriptionLevel === 'pro') {
      return { allowed: true };
    }

    // Get current month date range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const reviewCount = await ReviewLog.countDocuments({
      // We'd need to link the repository owner to the User in the DB
      // For this check, we assume the repository's owner is the user passed here
      repository: { $in: await getOwnedRepos(userId) },
      createdAt: { $gte: startOfMonth },
      status: 'success'
    });

    if (reviewCount >= FREE_TIER_LIMIT) {
      return { 
        allowed: false, 
        message: `Free tier limit of ${FREE_TIER_LIMIT} PR reviews/month reached. Upgrade to Pro for unlimited reviews.` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking usage limit:', error.message);
    return { allowed: true }; // Fail-safe: allow if check fails
  }
};

// Helper to get repos owned by a user
const getOwnedRepos = async (userId) => {
  const Repository = require('../models/Repository');
  const repos = await Repository.find({ owner: userId }).select('_id');
  return repos.map(r => r._id);
};

module.exports = {
  checkUsageLimit,
};
