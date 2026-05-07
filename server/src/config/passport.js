const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

const backendUrl = (
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, "");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${backendUrl}/auth/github/callback`,
      scope: ["read:user", "repo"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;
        const username =
          profile.username || profile.displayName || `github-${githubId}`;
        const email =
          profile.emails?.[0]?.value || profile._json?.email || undefined;
        const avatarUrl = profile.photos?.[0]?.value;

        const user = await User.findOneAndUpdate(
          { githubId },
          {
            $set: {
              githubId,
              username,
              email,
              avatarUrl,
              githubAccessToken: accessToken,
            },
            $setOnInsert: {
              subscriptionLevel: "free",
              isActive: true,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          },
        );

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
