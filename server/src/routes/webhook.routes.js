const express = require('express');
const router = express.Router();
const { handleGitHubWebhook } = require('../controllers/webhook.controller');
const { validateGitHubSignature } = require('../middleware/webhookAuth');

// Protected route for GitHub Webhooks
router.post('/github', validateGitHubSignature, handleGitHubWebhook);

module.exports = router;
