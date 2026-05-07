const crypto = require('crypto');

/**
 * Middleware to validate GitHub Webhook Signatures
 */
const validateGitHubSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature) {
    return res.status(401).json({ error: 'No signature provided' });
  }

  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not defined in env');
    return res.status(500).json({ error: 'Internal server configuration error' });
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
  const checksum = Buffer.from(signature, 'utf8');

  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

module.exports = {
  validateGitHubSignature,
};
