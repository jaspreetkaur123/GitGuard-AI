const mongoose = require('mongoose');

const reviewLogSchema = new mongoose.Schema({
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
  },
  pullRequestNumber: {
    type: Number,
    required: true,
  },
  pullRequestUrl: {
    type: String,
    required: true,
  },
  diffAnalyzed: {
    type: String, // Store a snippet or reference to the diff
  },
  aiResponse: {
    type: String, // The structured markdown response from the LLM
  },
  status: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'pending',
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ReviewLog', reviewLogSchema);
