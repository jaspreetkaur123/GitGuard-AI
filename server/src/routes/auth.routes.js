const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with GitHub
// @route   GET /auth/github
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// @desc    GitHub auth callback
// @route   GET /auth/github/callback
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard.
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/dashboard');
  }
);

// @desc    Get current user
// @route   GET /auth/me
router.get('/me', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
