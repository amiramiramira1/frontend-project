'use strict';

/**
 * emailService.js
 *
 * Unified Nodemailer email service for Boxify.
 *
 * ── Development (default) ─────────────────────────────────────────────────────
 *   If no SMTP_HOST is set in .env, a temporary Ethereal.email test account is
 *   auto-created on first use. Every email prints a clickable preview URL to the
 *   terminal — zero configuration required.
 *
 * ── Production ────────────────────────────────────────────────────────────────
 *   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optionally SMTP_FROM
 *   in .env. Works with Resend, Postmark, SendGrid, Gmail, etc.
 */

const nodemailer = require('nodemailer');

// ── Cached transporter — created once, reused for all emails ──────────────────
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // Production: use the configured SMTP provider
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: auto-create a free Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal test account created:', testAccount.user);
  }

  return _transporter;
};

const FROM_ADDRESS = process.env.SMTP_FROM || 'Boxify <noreply@boxify.com>';
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:5173';
const BRAND_COLOR   = '#f79408';

// ── Shared responsive HTML wrapper ────────────────────────────────────────────
const buildBaseTemplate = ({ title, preheader, body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">📦 Boxify</span>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;color:#9ca3af;font-size:13px;line-height:1.6;">
              © 2026 Boxify. Cairo, Egypt.<br/>
              <a href="${FRONTEND_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Visit Boxify</a>
              &nbsp;·&nbsp;
              <a href="${FRONTEND_URL}/dashboard/settings" style="color:#9ca3af;text-decoration:none;">Manage notifications</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── Reusable HTML components ──────────────────────────────────────────────────
const h1 = (text) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">${text}</h1>`;

const p = (text) =>
  `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;

const ctaButton = (label, href) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:${BRAND_COLOR};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;

const badge = (label, color = BRAND_COLOR) =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${color}20;color:${color};font-size:13px;font-weight:600;">${label}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${value}</td>
  </tr>`;

// ── Low-level send ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });

  // Print Ethereal preview URL in development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Email preview: ${previewUrl}`);
  }

  return info;
};

// ── Guard: check if the user has email notifications enabled ──────────────────
const isEmailEnabled = (user) => user?.settings?.emailNotifications !== false;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC EMAIL FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Welcome Email ─────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  if (!isEmailEnabled(user)) return;

  const html = buildBaseTemplate({
    title:     'Welcome to Boxify!',
    preheader: `Hi ${user.name}, your Boxify account is ready. Start cooking amazing meals today!`,
    body: `
      ${h1(`Welcome aboard, ${user.name}! 🎉`)}
      ${p('Your Boxify account has been created successfully. We\'re so excited to have you join our community of home cooks.')}
      ${p('Browse our curated meal boxes or build your own custom box from fresh, pre-portioned ingredients delivered straight to your door.')}
      ${ctaButton('Explore Meal Boxes', `${FRONTEND_URL}/boxes`)}
      ${divider()}
      ${p('If you have any questions, just reply to this email — we\'re always happy to help.')}
    `,
  });

  await sendEmail({ to: user.email, subject: 'Welcome to Boxify! 🍱', html });
};

// ── 2. Order Placed ───────────────────────────────────────────────────────────
const sendOrderPlacedEmail = async (order, user) => {
  if (!isEmailEnabled(user)) return;

  const itemRows = (order.items || []).map((item) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#111827;">${item.box?.name || 'Custom Box'}</td>
      <td style="padding:8px 0;font-size:14px;color:#6b7280;text-align:center;">${item.servingSize} ${item.servingSize === 1 ? 'person' : 'people'}</td>
      <td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;font-weight:600;">EGP ${(item.priceAtPurchase || 0).toFixed(2)}</td>
    </tr>`).join('');

  const html = buildBaseTemplate({
    title:     `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`,
    preheader: `Your Boxify order has been received and is being processed.`,
    body: `
      ${h1('Order Placed Successfully! ✅')}
      ${p('Thank you for your order, ' + user.name + '! We\'ve received your request and our team will confirm it shortly.')}
      ${badge('Pending')}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align:left;font-size:13px;color:#6b7280;font-weight:600;padding-bottom:8px;">Box</th>
            <th style="text-align:center;font-size:13px;color:#6b7280;font-weight:600;padding-bottom:8px;">Serves</th>
            <th style="text-align:right;font-size:13px;color:#6b7280;font-weight:600;padding-bottom:8px;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:12px;font-size:15px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;">Total</td>
            <td style="padding-top:12px;font-size:15px;font-weight:700;color:${BRAND_COLOR};text-align:right;border-top:1px solid #e5e7eb;">EGP ${(order.totalPrice || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      ${divider()}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${infoRow('Order ID', '#' + order._id.toString().slice(-8).toUpperCase())}
        ${infoRow('Payment', 'Cash on Delivery')}
        ${infoRow('Est. Delivery', '3–5 business days')}
      </table>
      ${ctaButton('Track My Order', `${FRONTEND_URL}/dashboard/orders`)}
    `,
  });

  await sendEmail({ to: user.email, subject: `Your Boxify Order Has Been Placed 🍱`, html });
};

// ── 3. Order Status Change ────────────────────────────────────────────────────
const ORDER_STATUS_CONTENT = {
  confirmed: {
    subject:  'Your Order Has Been Confirmed ✅',
    icon:     '✅',
    headline: 'Order Confirmed!',
    preheader:'Great news — your Boxify order has been confirmed and is being prepared.',
    body:     'Great news! Your order has been confirmed and our kitchen team is now getting your fresh ingredients ready.',
    badge:    { label: 'Confirmed', color: '#10b981' },
    cta:      { label: 'View Order', href: '/dashboard/orders' },
  },
  preparing: {
    subject:  'Your Order Is Being Prepared 👩‍🍳',
    icon:     '👩‍🍳',
    headline: 'Your Box Is Being Packed!',
    preheader:'Our team is currently preparing your fresh Boxify order.',
    body:     'Our team is currently hand-picking and packing your fresh, pre-portioned ingredients. Your box will be heading your way soon!',
    badge:    { label: 'Preparing', color: '#f59e0b' },
    cta:      { label: 'View Order', href: '/dashboard/orders' },
  },
  shipped: {
    subject:  'Your Order Is On Its Way! 🚚',
    icon:     '🚚',
    headline: 'Your Box Has Shipped!',
    preheader:'Your Boxify order is on its way. Estimated delivery: 1–2 days.',
    body:     'Your fresh meal box has left our facility and is now in transit. You can expect delivery within 1–2 business days.',
    badge:    { label: 'Shipped', color: '#3b82f6' },
    cta:      { label: 'Track Order', href: '/dashboard/orders' },
  },
  out_for_delivery: {
    subject:  'Out for Delivery — Today! 📍',
    icon:     '📍',
    headline: 'Your Order Is Out for Delivery!',
    preheader:'Your Boxify box is on the delivery truck and heading to you today!',
    body:     'Exciting news! Your fresh meal box is currently out for delivery and will arrive at your door today. Please make sure someone is available to receive it.',
    badge:    { label: 'Out for Delivery', color: '#8b5cf6' },
    cta:      { label: 'View Order', href: '/dashboard/orders' },
  },
  delivered: {
    subject:  'Your Order Has Been Delivered! 🎉',
    icon:     '🎉',
    headline: 'Delivery Complete!',
    preheader:'Your Boxify order has been delivered. Enjoy cooking!',
    body:     'Your fresh meal box has been delivered! We hope you enjoy cooking and dining with Boxify. Don\'t forget to leave a review — your feedback helps other customers discover great meals.',
    badge:    { label: 'Delivered', color: '#10b981' },
    cta:      { label: 'Leave a Review', href: '/boxes' },
  },
  cancelled: {
    subject:  'Your Order Has Been Cancelled',
    icon:     '❌',
    headline: 'Order Cancelled',
    preheader:'Your Boxify order has been cancelled.',
    body:     'We\'re sorry to inform you that your order has been cancelled. If you believe this is a mistake, please contact our support team immediately. We\'d love to help you reorder.',
    badge:    { label: 'Cancelled', color: '#ef4444' },
    cta:      { label: 'Browse Boxes', href: '/boxes' },
  },
};

const sendOrderStatusEmail = async (order, user) => {
  if (!isEmailEnabled(user)) return;

  const content = ORDER_STATUS_CONTENT[order.status];
  if (!content) return; // unknown status — skip

  const html = buildBaseTemplate({
    title:     content.subject,
    preheader: content.preheader,
    body: `
      ${h1(`${content.icon} ${content.headline}`)}
      ${badge(content.badge.label, content.badge.color)}
      <br/><br/>
      ${p(content.body)}
      ${divider()}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${infoRow('Order ID', '#' + order._id.toString().slice(-8).toUpperCase())}
        ${infoRow('Status', content.badge.label)}
        ${infoRow('Total', 'EGP ' + (order.totalPrice || 0).toFixed(2))}
      </table>
      ${ctaButton(content.cta.label, `${FRONTEND_URL}${content.cta.href}`)}
    `,
  });

  await sendEmail({ to: user.email, subject: content.subject, html });
};

// ── 4. Subscription Emails ────────────────────────────────────────────────────
const SUBSCRIPTION_ACTION_CONTENT = {
  created: {
    subject:   'Subscription Confirmed! 🔁',
    icon:      '🔁',
    headline:  'Your Subscription Is Active!',
    preheader: 'Your Boxify meal subscription has been confirmed. Fresh food is coming your way!',
    body:      'Your subscription has been created successfully. You\'ll now receive fresh meal deliveries on your chosen schedule — sit back and let Boxify handle the rest!',
  },
  paused: {
    subject:   'Subscription Paused ⏸️',
    icon:      '⏸️',
    headline:  'Subscription Paused',
    preheader: 'Your Boxify subscription has been paused. You can resume anytime.',
    body:      'Your subscription has been paused. No further deliveries or charges will be made until you resume. You can reactivate it at any time from your dashboard.',
  },
  resumed: {
    subject:   'Subscription Resumed ▶️',
    icon:      '▶️',
    headline:  'Subscription Resumed!',
    preheader: 'Your Boxify subscription is active again. Fresh food is back on the way!',
    body:      'Great to have you back! Your subscription has been resumed and fresh deliveries will continue on your regular schedule.',
  },
  cancelled: {
    subject:   'Subscription Cancelled',
    icon:      '🛑',
    headline:  'Subscription Cancelled',
    preheader: 'Your Boxify subscription has been cancelled.',
    body:      'Your subscription has been cancelled. We\'re sad to see you go! If you change your mind, you can always start a new subscription from your dashboard. We\'ll be here.',
  },
};

const sendSubscriptionEmail = async (subscription, user, action) => {
  if (!isEmailEnabled(user)) return;

  const content = SUBSCRIPTION_ACTION_CONTENT[action];
  if (!content) return;

  const boxName = subscription.box?.name || 'your meal box';

  const html = buildBaseTemplate({
    title:     content.subject,
    preheader: content.preheader,
    body: `
      ${h1(`${content.icon} ${content.headline}`)}
      ${p(content.body)}
      ${divider()}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${infoRow('Box', boxName)}
        ${subscription.frequency ? infoRow('Frequency', subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1)) : ''}
        ${subscription.servingSize ? infoRow('Serving Size', subscription.servingSize + (subscription.servingSize === 1 ? ' person' : ' people')) : ''}
        ${subscription.nextDeliveryDate && action !== 'cancelled' ? infoRow('Next Delivery', new Date(subscription.nextDeliveryDate).toDateString()) : ''}
      </table>
      ${ctaButton('Manage Subscriptions', `${FRONTEND_URL}/dashboard/subscriptions`)}
    `,
  });

  await sendEmail({ to: user.email, subject: content.subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// ── 5. Welcome + Verify Email (combined — sent on registration) ───────────────
// ─────────────────────────────────────────────────────────────────────────────
const sendWelcomeVerificationEmail = async (user, verifyUrl) => {
  // Verification emails are always sent regardless of the notification setting
  // (the user just signed up and needs to verify — this is transactional, not marketing)

  const html = buildBaseTemplate({
    title:     'Welcome to Boxify — Please Verify Your Email',
    preheader: `Hi ${user.name}! One quick step: verify your email to activate your Boxify account.`,
    body: `
      ${h1(`Welcome, ${user.name}! 🎉`)}
      ${p("We're thrilled to have you join the Boxify family. Before you start exploring our delicious meal boxes, please verify your email address so we know it's really you.")}
      ${ctaButton('Verify My Email Address', verifyUrl)}
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
        This verification link expires in <strong>24 hours</strong>.
        If you didn't create a Boxify account, you can safely ignore this email.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Button not working? Copy and paste this link into your browser:<br/>
        <a href="${verifyUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${verifyUrl}</a>
      </p>
    `,
  });

  await sendEmail({
    to:      user.email,
    subject: 'Welcome to Boxify — Verify Your Email 📧',
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ── 6. Password Reset Email ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, resetUrl) => {
  // Password reset is always sent — it's a security action, not marketing

  const html = buildBaseTemplate({
    title:     'Reset Your Boxify Password',
    preheader: 'You requested a password reset for your Boxify account. Click below to set a new password.',
    body: `
      ${h1('Reset Your Password 🔐')}
      ${p(`Hi ${user.name}, we received a request to reset the password for your Boxify account.`)}
      ${p('Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.')}
      ${ctaButton('Reset My Password', resetUrl)}
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
        🔒 <strong>Didn't request this?</strong> You can safely ignore this email.
        Your password will not change unless you click the link above.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Button not working? Copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${resetUrl}</a>
      </p>
    `,
  });

  await sendEmail({
    to:      user.email,
    subject: 'Reset Your Boxify Password 🔐',
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  sendWelcomeEmail,
  sendWelcomeVerificationEmail,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
  sendSubscriptionEmail,
  sendPasswordResetEmail,
};
