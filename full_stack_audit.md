# Boxify – Full-Stack Comprehensive Audit Report

> Audit conducted: May 25, 2026 · Branch: `main` · 85 backend tests passing

---

## 🟢 Fully Connected (Frontend ↔ Backend Working)

| Feature | Frontend | Backend Endpoint | Status |
|---|---|---|---|
| Login | `AuthContext.login()` | `POST /api/auth/login` | ✅ |
| Register | `AuthContext.register()` | `POST /api/auth/register` | ✅ |
| Get current user | `AuthContext.refreshUser()` | `GET /api/auth/me` | ✅ |
| Update profile name/addresses | `ProfilePage` | `PUT /api/auth/profile` | ✅ |
| Change password | `ProfilePage → DashboardLayout` | `PUT /api/auth/change-password` | ✅ |
| Browse boxes | `BoxesPage` | `GET /api/boxes` | ✅ |
| Box detail | `BoxDetailPage` | `GET /api/boxes/:id` | ✅ |
| Compare boxes | `BoxComparePage` | `GET /api/boxes/:id` | ✅ |
| Browse meals / Build custom box | `BuildBoxPage` | `GET /api/meals` | ✅ |
| Live price preview | `BuildBoxPage` | `POST /api/boxes/custom/calculate` | ✅ |
| Create custom box | `BuildBoxPage` | `POST /api/boxes/custom` | ✅ |
| View cart | `CartContext` | `GET /api/cart` | ✅ |
| Add to cart | `CartContext` | `POST /api/cart/items` | ✅ |
| Update cart item | `CartContext` | `PUT /api/cart/items/:itemId` | ✅ |
| Remove cart item | `CartContext` | `DELETE /api/cart/items/:itemId` | ✅ |
| Clear cart | `CartContext` | `DELETE /api/cart` | ✅ |
| Checkout → Place order | `CheckoutPage` | `POST /api/cart/checkout` | ✅ |
| View my orders | `OrdersPage` | `GET /api/orders/my` | ✅ |
| Subscribe to a box | `SubscribePage` | `POST /api/subscriptions` | ✅ |
| View my subscriptions | `SubscriptionsPage` | `GET /api/subscriptions/my` | ✅ |
| Pause/Resume subscription | `SubscriptionsPage` | `PUT /api/subscriptions/:id/pause` | ✅ |
| Cancel subscription | `SubscriptionsPage` | `PUT /api/subscriptions/:id/cancel` | ✅ |
| Admin dashboard stats | `AdminLayout/AdminStats` | `GET /api/admin/stats` | ✅ |
| Admin subscription stats | `AdminLayout` | `GET /api/admin/subscriptions/stats` | ✅ |
| Admin upcoming deliveries | `AdminLayout` | `GET /api/admin/subscriptions/upcoming` | ✅ |
| Admin manually generate order | `AdminLayout` | `POST /api/admin/subscriptions/generate` | ✅ |
| Admin view all orders | `AdminLayout/AdminOrders` | `GET /api/orders` | ✅ |
| Admin update order status | `AdminLayout` | `PUT /api/orders/:id/status` | ✅ |
| Admin view all users | `AdminLayout/AdminUsers` | `GET /api/admin/users` | ✅ |
| Admin inventory view | `AdminLayout/AdminInventory` | `GET /api/meals`, `PUT /api/meals/:id` | ✅ |

---

## 🔴 CRITICAL – Frontend Calls Missing Backend Endpoint

### 1. `DELETE /api/auth/me` — Delete Account
**Where:** [AuthContext.jsx#L138](file:///d:/frontend-project/frontend/src/context/AuthContext.jsx#L138), [ProfilePage.jsx#L131](file:///d:/frontend-project/frontend/src/pages/dashboard/ProfilePage.jsx#L131)

The frontend calls `api.delete('/auth/me')` to permanently delete a user account. **No such route exists** in `authRoutes.js`. The `authController.js` also has no `deleteAccount` handler. The frontend silently ignores the error (`catch { /* allow even if API fails */ }`), so the user session is cleared locally but the account remains in MongoDB forever.

**Missing Backend:** `DELETE /api/auth/me` → delete user + cascade clear their cart/subscriptions.

---

### 2. `PATCH /api/subscriptions/:id` — Edit Subscription
**Where:** [EditSubscriptionPage.jsx#L34](file:///d:/frontend-project/frontend/src/pages/dashboard/EditSubscriptionPage.jsx#L34)

The `EditSubscriptionPage` calls `api.patch('/subscriptions/:id', { frequency, deliveryDay, servingsPerMeal })` to update a subscription. **No PATCH route exists** in `subscriptionRoutes.js`. It only has `PUT /:id/pause` and `PUT /:id/cancel`. The page falls back to writing to `localStorage` on failure — so changes are never persisted to the database.

**Missing Backend:** `PATCH /api/subscriptions/:id` → allow user to update `frequency`, `deliveryDay`, `servingSize`.

---

### 3. `POST /api/auth/forgot-password` — Forgot Password
**Where:** [ForgotPasswordPage.jsx#L14-L21](file:///d:/frontend-project/frontend/src/pages/auth/ForgotPasswordPage.jsx#L14)

The forgot-password form uses a **`setTimeout` mock** instead of any real API call. No `POST /api/auth/forgot-password` endpoint exists. No email-sending infrastructure (SMTP/SendGrid/etc.) is set up anywhere in the backend. Users cannot actually receive a password reset link.

**Missing Backend:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` with token verification.

---

### 4. `POST /api/auth/reset-password` — Reset Password
**Where:** [ResetPasswordPage.jsx#L47-L58](file:///d:/frontend-project/frontend/src/pages/auth/ResetPasswordPage.jsx#L47)

Same as above — uses a `setTimeout` mock. No backend endpoint, no token validation, no password update from a reset flow. The page also **does not read a reset token from the URL** (no `useSearchParams` to get `?token=...`), so even if the endpoint existed, it couldn't work.

**Missing Backend:** `POST /api/auth/reset-password` accepting `{ token, newPassword }`.

---

### 5. Email Verification — Entirely Mocked
**Where:** [VerifyEmailPage.jsx#L23-L30](file:///d:/frontend-project/frontend/src/pages/auth/VerifyEmailPage.jsx#L23)

The `VerifyEmailPage` has a "Verify Email" button that just runs a `setTimeout` and navigates to `/login`. There is no actual email verification system — no backend endpoint, no token in User model, no email sending on registration. The page even has a `// Test Note` comment.

**Missing Backend:** Email verification token field on User model, `GET /api/auth/verify-email?token=...` route, email dispatch on register.

---

## 🟡 PARTIAL – Frontend Feature Exists but Backend is Incomplete

### 6. Checkout: `deliveryDate`, `timeSlot`, `phone` — Silently Dropped
**Where:** [CheckoutPage.jsx#L70-L77](file:///d:/frontend-project/frontend/src/pages/CheckoutPage.jsx#L70)

The checkout form collects `phone`, `deliveryDate`, and `timeSlot`. However, the POST body only sends `deliveryAddress: { street, city, country, postalCode }`. The `phone`, `deliveryDate`, and `timeSlot` fields are passed to `OrderConfirmationPage` via React Router `state` only — they are **never saved to the Order** in MongoDB.

**Missing Backend:** Add `phone`, `deliveryDate`, `timeSlot` fields to `Order` model and `cartController.checkout()`.

---

### 7. Checkout: Promo Codes Are Hardcoded Mock
**Where:** [CheckoutPage.jsx#L5](file:///d:/frontend-project/frontend/src/pages/CheckoutPage.jsx#L5)

Promo code validation uses `promoCodes` imported from `mockData.js` — a hardcoded local object. Discounts are applied only in the UI and **never communicated to the backend**. The final order is created with the full unmodified `cart.cartTotal`, so discounts are not applied server-side or stored on the order.

**Missing Backend:** `PromoCode` model + `POST /api/promo/validate` endpoint; `discountedTotal` field on Order.

---

### 8. Subscriptions: Missing `deliveryDay` Field
**Where:** [SubscribePage.jsx#L20](file:///d:/frontend-project/frontend/src/pages/SubscribePage.jsx#L20), [Subscription model](file:///d:/frontend-project/backend/models/Subscription.js)

The `SubscribePage` collects a `deliveryDay` (e.g., "saturday"). It is stored in local `form` state but **never sent** in the subscription POST request (`api.post('/subscriptions', { boxId, servingSize, frequency })` — `deliveryDay` is excluded). Furthermore, the `Subscription` model has no `deliveryDay` field, so even if sent it would be silently ignored.

**Missing Backend:** Add `deliveryDay` field to `Subscription` model; frontend must include it in the POST body.

---

### 9. Admin Panel: No Meal/Box CRUD Management
**Where:** [AdminLayout.jsx](file:///d:/frontend-project/frontend/src/pages/admin/AdminLayout.jsx)

The admin panel has sections for **Orders, Subscriptions, Users, and Inventory**, but there is no admin UI for:
- Creating, editing, or deleting **Meals** (admin uses `/api/meals` via inventory, but cannot create new meals from the admin panel)
- Creating, editing, or deleting **Boxes** (no admin box management page exists)
- Managing **Ingredients** (no UI at all for the full ingredients CRUD)

The backend has full CRUD routes for all of these (`POST /api/meals`, `POST /api/boxes`, `POST/PUT/DELETE /api/ingredients`) but the admin panel doesn't expose them.

**Missing Frontend:** Admin Meals Management page, Admin Box Management page.

---

### 10. `FavoritesContext` — Entirely localStorage-based (No Backend)
**Where:** [FavoritesContext.jsx](file:///d:/frontend-project/frontend/src/context/FavoritesContext.jsx)

The favorites feature exists on the `feature/BOX-40-favorites-system` branch, and `FavoritesContext` is already created but stored **entirely in `localStorage`**. There is no backend favorites endpoint, no favorites field on the User model. The context also isn't plugged into `App.jsx` via `<FavoritesProvider>`, so it's effectively inaccessible to any page.

**Missing Backend:** `favorites: [ObjectId]` field on User, `POST /api/auth/favorites/:boxId` toggle endpoint.
**Missing Frontend:** `<FavoritesProvider>` wrapping in `App.jsx`.

---

### 11. `SettingsPage` — Entirely localStorage-based (No Backend)
**Where:** [SettingsPage.jsx](file:///d:/frontend-project/frontend/src/pages/dashboard/SettingsPage.jsx)

User settings (notifications toggle, language, preferred servings) are saved only to `localStorage`. There is no backend settings persistence. Additionally, the **`SettingsPage` is not registered in any route** in `App.jsx` or `DashboardLayout` — it is completely unreachable by users.

**Missing Backend:** Settings persistence in User model or a separate UserSettings collection.
**Missing Frontend:** Add `settings` route inside `DashboardLayout`.

---

### 12. OAuth (Google / Facebook) — Mock Only
**Where:** [AuthContext.jsx#L109-L133](file:///d:/frontend-project/frontend/src/context/AuthContext.jsx#L109)

`loginWithGoogle()` and `loginWithFacebook()` create fake users via `setTimeout` and store a mock token. No real OAuth flow (Passport.js, Google OAuth2, etc.) exists in the backend. The mock users also have no real `_id` from MongoDB, which would break any subsequent authenticated API calls.

**Missing Backend:** Passport.js OAuth strategy, `GET /api/auth/google`, `GET /api/auth/google/callback`.

---

## 🟠 DATA MISMATCHES – Frontend/Backend Schema Gaps

### 13. User Model: Missing `phone` Field
**Where:** [CheckoutPage.jsx#L25](file:///d:/frontend-project/frontend/src/pages/CheckoutPage.jsx#L25), [ProfilePage.jsx](file:///d:/frontend-project/frontend/src/pages/dashboard/ProfilePage.jsx)

The frontend collects `phone` numbers in both checkout and profile address forms, but the `addressSchema` in `User.js` only has `{ street, city, country, postalCode }` — **no `phone` field**. Submitted phone numbers are lost.

---

### 14. `updateProfile` Response Mismatch
**Where:** [AuthContext.jsx#L81](file:///d:/frontend-project/frontend/src/context/AuthContext.jsx#L81)

`AuthContext.updateProfile()` calls `persistUser(data, token)` where `data` is the full response body `{ message, user: {...} }`. It should be `persistUser(data.user, token)`. This means after updating profile, `user` in context is set to the whole response object (with `message` key), breaking any `user.name` or `user.email` access.

> **Note:** `ProfilePage.saveProfile()` correctly uses `api.put` directly and then calls `refreshUser()`, which works correctly. Only `AuthContext.updateProfile()` has this bug.

---

### 15. `servingSize` vs `servingsPerMeal` Naming Inconsistency
**Where:** [EditSubscriptionPage.jsx#L25](file:///d:/frontend-project/frontend/src/pages/dashboard/EditSubscriptionPage.jsx#L25)

`EditSubscriptionPage` uses `servingsPerMeal` in its form state, but the `Subscription` model uses `servingSize`. The PATCH call would send `{ servingsPerMeal: 2 }` which doesn't map to any model field.

---

### 16. Box `dietType: 'mixed'` Not in Enum
**Where:** [boxController.js#L98](file:///d:/frontend-project/backend/controllers/boxController.js#L98)

When creating a custom box, the controller sets `dietType: 'mixed'`. The `Box` model's `dietType` enum (presumably `['vegan', 'vegetarian', 'keto', 'paleo', 'standard']`) does not include `'mixed'`, which would cause a Mongoose validation error on custom box creation.

---

## 🔵 MISSING FRONTEND PAGES/ROUTES

| Page | Status |
|---|---|
| `VerifyEmailPage` | Built but **no route** in `App.jsx` — unreachable |
| `EditSubscriptionPage` | Built but **no route** in `App.jsx` or `DashboardLayout` — unreachable |
| `SettingsPage` | Built but **no route** in `DashboardLayout` — unreachable |
| Admin — Meals CRUD | Not built — backend routes exist |
| Admin — Boxes CRUD | Not built — backend routes exist |
| Admin — Ingredients CRUD | Not built — backend routes exist |

---

## 📋 Priority Action List

| Priority | Issue | Effort |
|---|---|---|
| 🔴 Critical | Add `DELETE /api/auth/me` (account deletion) | Low |
| 🔴 Critical | Add `PATCH /api/subscriptions/:id` (edit subscription) | Low |
| 🔴 Critical | Fix `updateProfile` response bug in `AuthContext` | Trivial |
| 🔴 Critical | Register `VerifyEmailPage`, `EditSubscriptionPage`, `SettingsPage` routes | Low |
| 🟡 High | Add `deliveryDate`, `timeSlot`, `phone` to Order model + checkout endpoint | Medium |
| 🟡 High | Add `deliveryDay` to Subscription model + subscribe form POST | Low |
| 🟡 High | Fix `'mixed'` dietType not in Box enum | Trivial |
| 🟡 High | Fix `servingsPerMeal` → `servingSize` naming in `EditSubscriptionPage` | Trivial |
| 🟠 Medium | Add forgot/reset password backend (requires email infra) | High |
| 🟠 Medium | Add email verification backend | High |
| 🟠 Medium | Real-time promo code validation backend | Medium |
| 🟠 Medium | Plug `<FavoritesProvider>` into `App.jsx` + backend favorites endpoint | Medium |
| 🔵 Low | Admin Meals CRUD UI | Medium |
| 🔵 Low | Admin Boxes CRUD UI | Medium |
| 🔵 Low | OAuth backend integration (Passport.js) | High |
