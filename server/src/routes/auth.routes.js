const express = require("express");
const passport = require("passport");
const router = express.Router();

const frontendBaseUrl = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).trim();

// @desc    Auth with GitHub
// @route   GET /auth/github
router.get(
  "/github",
  passport.authenticate("github", { scope: ["read:user", "repo"] }),
);

// @desc    GitHub auth callback
// @route   GET /auth/github/callback
router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", (err, user, info) => {
    if (err) {
      console.error("GitHub OAuth callback error:", err.message);
      return res.status(500).json({
        error: "GitHub authentication failed",
        details: err.message,
      });
    }

    if (!user) {
      const reason = info?.message || "Authentication was denied or failed";
      return res.redirect(
        `${frontendBaseUrl}/login?error=${encodeURIComponent(reason)}`,
      );
    }

    req.logIn(user, (loginError) => {
      if (loginError) {
        console.error("Session login error:", loginError.message);
        return res.status(500).json({
          error: "Login session could not be created",
          details: loginError.message,
        });
      }

      return res.redirect(`${frontendBaseUrl}/dashboard`);
    });
  })(req, res, next);
});

// @desc    Get current user
// @route   GET /auth/me
router.get("/me", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// @desc    Logout user
// @route   GET /auth/logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
