const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure the Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback', // The endpoint Google redirects back to
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if the user already exists in our DB using their Google ID
        console.log(`[GOOGLE OAUTH] Starting authentication pipeline for: ${profile.emails[0].value}`);
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // If user exists, log them in
          console.log(`[GOOGLE OAUTH SUCCESS] Existing Google ID match found for: ${profile.emails[0].value}`);
          return done(null, user);
        }

        // 2. Alternatively, check if a standard user registered with this email already
        console.log(`[GOOGLE OAUTH] Google ID not found. Checking if a standard account exists with email: ${profile.emails[0].value}`);
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          console.log(`[GOOGLE OAUTH MERGE] Standard account found. Upgrading account to include Google Login for: ${profile.emails[0].value}`);
          // Update the standard user document to inject their Google ID for future logins
          user.googleId = profile.id;
          // Optionally grab their avatar if they didn't have one
          if (!user.avatar) {
             user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Grab our custom state (role) we injected in the initial route call
        const passedRole = req.query.state || 'jobseeker';

        // 3. Otherwise, create a brand new user using their Google data
        console.log(`[GOOGLE OAUTH NEW RECORD] Creating brand new user entry for: ${profile.emails[0].value} as role: ${passedRole}`);
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          role: passedRole,
          authProvider: 'google',
        });

        done(null, newUser);
      } catch (error) {
        console.error('Passport Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

// We don't necessarily need serialize/deserialize if we are ONLY using JWTs, 
// but passport sometimes expects these placeholders for its internal session flows 
// (which we will disable in the routes).
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});
