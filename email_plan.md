# Implementation Plan: Transactional Email Notification System

Implement a production-grade transactional email service to send responsive HTML email notifications to customers for core lifecycle events (registration, purchase, subscription actions).

## User Review Required

> [!TIP]
> **Zero-Config Development:**
> In development mode, the system will automatically create a temporary test account using **Ethereal Email** (a Nodemailer testing service). Any email sent in dev mode will output a clickable preview link in the backend server console, allowing us to inspect the styled templates instantly in our browser without configuring anything.
>
> **Production Configuration:**
> In production, the system will seamlessly switch to using credentials defined in your `.env` file (supporting SMTP configurations like Resend, Postmark, SendGrid, Gmail, etc.).

## Where Emails are Sent

| Trigger | Recipient | Email Type |
|---|---|---|
| User registers | Customer | Welcome Email |
| Checkout completes | Customer | Order Confirmation |
| Subscription created | Customer | Subscription Confirmation |
| Subscription paused | Customer | Subscription Paused Alert |
| Subscription cancelled | Customer | Subscription Cancelled Alert |
| Ingredient stock goes low | Admin | Low Stock Warning *(future)* |

## Proposed Changes

---

### Backend

#### [NEW] Install `nodemailer`
```bash
npm install nodemailer
```

#### [NEW] [emailService.js](file:///d:/frontend-project/backend/services/emailService.js)
- Build a unified `EmailService` module using `nodemailer`.
- **Development:** Auto-creates an Ethereal test account. Every sent email prints a clickable preview URL in the terminal — zero config required.
- **Production:** Uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` from `.env` to send via any real provider (Resend, Postmark, SendGrid, Gmail).
- Implement styled responsive HTML template builder functions:
  - `sendWelcomeEmail(user)` — Branded welcome, links to build first box.
  - `sendOrderConfirmationEmail(order, user)` — Receipt with box name, meal list, price breakdown, and estimated delivery date.
  - `sendSubscriptionEmail(subscription, user, action)` — Handles `created`, `paused`, and `cancelled` subscription states with relevant messaging.

#### [MODIFY] [.env](file:///d:/frontend-project/backend/.env)
Add optional production SMTP variables (not required for local dev):
```ini
# Email (optional — auto-uses Ethereal in development if not set)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key
SMTP_FROM=Boxify <noreply@yourdomain.com>
```

#### [MODIFY] [authController.js](file:///d:/frontend-project/backend/controllers/authController.js)
- After successful `User.create(...)` in `register`, call `emailService.sendWelcomeEmail(user)` **asynchronously** (fire-and-forget so it never slows down the registration response).

#### [MODIFY] [orderController.js](file:///d:/frontend-project/backend/controllers/orderController.js)
- After a successful order creation in checkout, call `emailService.sendOrderConfirmationEmail(order, user)` asynchronously.

#### [MODIFY] [subscriptionController.js](file:///d:/frontend-project/backend/controllers/subscriptionController.js)
- After subscription creation: call `sendSubscriptionEmail(..., 'created')`.
- After pause toggle: call `sendSubscriptionEmail(..., 'paused')` or `sendSubscriptionEmail(..., 'resumed')`.
- After cancellation: call `sendSubscriptionEmail(..., 'cancelled')`.

---

## Verification Plan

### Automated
- Run `npm test` to confirm no regressions.

### Manual (Zero-Config Dev Preview)
1. Start the backend server (`npm run dev`).
2. Register a new user on the frontend.
3. Watch the **backend terminal** — a line like this will appear:
   ```
   📧 Email preview: https://ethereal.email/message/abc123
   ```
4. Click the URL to open the styled HTML email in your browser.
5. Repeat for checkout (Order Confirmation) and subscription creation.
