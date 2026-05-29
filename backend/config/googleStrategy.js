const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email     = profile.emails?.[0]?.value;
        const name      = profile.displayName;
        const googleId  = profile.id;

        // 1. Already linked to this Google account?
        let user = await User.findOne({ googleId });
        if (user) return done(null, user);

        // 2. Same email registered the normal way? Link the accounts.
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = googleId;
            await user.save();
            return done(null, user);
          }
        }

        // 3. Brand new user — create without a password.
        // isEmailVerified is true because Google already validated the email address.
        user = await User.create({ name, email, googleId, isEmailVerified: true });
        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Passport requires serialize/deserialize even if we don't use sessions.
// We use JWT so these are minimal stubs.
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
