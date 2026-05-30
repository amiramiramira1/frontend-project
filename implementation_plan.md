# Implementation Plan: Google OAuth 2.0 Login & Remove Facebook Login

Replace the current mock OAuth stubs with a real **Google OAuth 2.0** login flow using `passport-google-oauth20`, and remove all Facebook login code from the frontend and backend.

## How the Flow Works (Architecture)

```
User clicks "Sign in with Google"
  → Frontend redirects browser to: GET /api/auth/google
    → Express redirects to Google's login page
      → User selects account and approves
        → Google redirects to: GET /api/auth/google/callback
          → Passport validates the token with Google
            → Backend finds or creates user in MongoDB
              → Backend generates JWT and redirects to:
                  http://localhost:5173/auth/google/success?token=JWT&user=JSON
                    → Frontend catches the token, persists it, and logs in
```

> [!IMPORTANT]
> **No CORS issue**: The browser does a full page redirect to Google (not an Axios request). The JWT is returned via a redirect URL query param — not a JSON body. This is the standard, secure approach.

## Proposed Changes

---

### Backend

#### [NEW] Install `passport` + `passport-google-oauth20`
```bash
npm install passport passport-google-oauth20
```

#### [MODIFY] [User.js](file:///d:/frontend-project/backend/models/User.js)
- Make `password` optional (currently `required: true`) to support OAuth users who never set a password.
- Add optional `googleId` field to link users to their Google account.

#### [NEW] [googleStrategy.js](file:///d:/frontend-project/backend/config/googleStrategy.js)
- Initialize a `PassportGoogleOAuth2Strategy` that uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` from `.env`.
- On successful OAuth callback: find the user in MongoDB by `googleId`. If not found, find by email (user may already exist via password registration). If still not found, create a brand new user.

#### [MODIFY] [authRoutes.js](file:///d:/frontend-project/backend/routes/authRoutes.js)
- Add two new routes:
  - `GET /api/auth/google` → Kicks off the Google OAuth consent screen redirect.
  - `GET /api/auth/google/callback` → Passport handles the callback, generates JWT, redirects to frontend with `?token=...&user=...` query params.

#### [MODIFY] [app.js](file:///d:/frontend-project/backend/app.js)
- Initialize `passport` middleware and import the Google strategy config.

---

### Frontend

#### [MODIFY] [AuthContext.jsx](file:///d:/frontend-project/frontend/src/context/AuthContext.jsx)
- Replace the mock `loginWithGoogle` (which used a fake timeout) with a real implementation that redirects the browser to `http://localhost:5000/api/auth/google`.
- Remove the `loginWithFacebook` function entirely.
- Remove `loginWithFacebook` from the context value object.

#### [NEW] [GoogleCallbackPage.jsx](file:///d:/frontend-project/frontend/src/pages/auth/GoogleCallbackPage.jsx)
- A dedicated lightweight page rendered at `/auth/google/success` that:
  1. Reads `token` and `user` from the URL query params on mount.
  2. Persists them to `localStorage` via `persistUser`.
  3. Redirects the user to `/` (or `/admin` if role is admin).
  4. Shows a brief "Signing you in..." loading spinner while this happens.

#### [MODIFY] [App.jsx](file:///d:/frontend-project/frontend/src/App.jsx)
- Add a `<Route path="/auth/google/success" element={<GoogleCallbackPage />} />` route.

#### [MODIFY] [LoginPage.jsx](file:///d:/frontend-project/frontend/src/pages/auth/LoginPage.jsx)
- Remove the `handleFacebook` handler and the Facebook button entirely.
- Update `handleGoogle` to simply call `loginWithGoogle()`, which will now do a full browser redirect (no try/catch needed since it's a redirect, not a Promise).

#### [MODIFY] [en.json](file:///d:/frontend-project/frontend/public/locales/en.json) & [ar.json](file:///d:/frontend-project/frontend/public/locales/ar.json)
- Remove the three Facebook i18n keys: `facebookLoginFailed`, `loggedInFacebook`, `continueFacebook`.

---

## Verification Plan

### Automated
- Run existing `npm test` suite to confirm no regressions.

### Manual
1. Start both servers.
2. Navigate to `http://localhost:5173/login`.
3. Verify the **Facebook button is gone**.
4. Click **Continue with Google** — a real Google account picker should appear in the browser.
5. Select a Google account and approve.
6. You should be redirected back to the frontend homepage and be logged in (check the navbar for your name).
7. Check `localStorage` in DevTools (`boxify_token` and `boxify_user` should be set with real data).
