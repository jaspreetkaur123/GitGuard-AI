const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  githubRepoId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  isAutoReviewEnabled: {
    type: Boolean,
    default: true,
  },
  settings: {
    checkSecurity: { type: Boolean, default: true },
    checkPerformance: { type: Boolean, default: true },
    checkBestPractices: { type: Boolean, default: true },
  },
  webhookId: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Repository', repositorySchema);
