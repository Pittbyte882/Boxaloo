import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || "noreply@boxaloo.com"

// ── Base template ──
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#070709;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070709;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="padding:32px 40px 24px;background:#0c0c0f;border:1px solid rgba(57,255,20,0.1);border-bottom:none;border-radius:12px 12px 0 0;">
              <div style="border-bottom:1px solid rgba(57,255,20,0.08);padding-bottom:20px;margin-bottom:4px;">
                <span style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:3px;">
                  BOX<span style="color:#39ff14;">ALOO</span>
                </span>
                <div style="font-size:8px;color:rgba(57,255,20,0.3);letter-spacing:4px;text-transform:uppercase;margin-top:4px;">&gt; System Message</div>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;background:#0c0c0f;border-left:1px solid rgba(57,255,20,0.1);border-right:1px solid rgba(57,255,20,0.1);">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px;background:#080809;border:1px solid rgba(57,255,20,0.1);border-top:1px solid rgba(57,255,20,0.06);border-radius:0 0 12px 12px;">
              <p style="margin:0;font-size:10px;color:#333;letter-spacing:2px;text-transform:uppercase;">
                © 2026 Boxaloo · All-In-One Load Board
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:#222;">
                loads.boxaloo.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">${text}</h1>`
}

function para(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#888;line-height:1.7;">${text}</p>`
}

function greenBox(content: string) {
  return `
  <div style="background:rgba(57,255,20,0.04);border:1px solid rgba(57,255,20,0.15);border-radius:8px;padding:20px;margin:20px 0;">
    ${content}
  </div>`
}

function pill(label: string, value: string) {
  return `
  <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
    <span style="font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">${label}</span>
    <span style="font-size:12px;color:#39ff14;font-family:'Courier New',monospace;">${value}</span>
  </div>`
}

function ctaButton(text: string, url: string) {
  return `
  <div style="margin:24px 0 8px;">
    <a href="${url}" style="display:inline-block;background:#39ff14;color:#070709;font-family:'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:12px 28px;text-decoration:none;border-radius:4px;">
      ${text} →
    </a>
  </div>`
}

// ═══════════════════════════════════════
// 1. WELCOME EMAIL
// ═══════════════════════════════════════
export async function sendWelcomeEmail({
  to, name, role, trialDays,
}: {
  to: string
  name: string
  role: string
  trialDays: number
}) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const content = `
    ${heading(`Welcome to Boxaloo, ${name}.`)}
    ${para(trialDays > 0
  ? `Your <strong style="color:#fff;">${roleLabel}</strong> account is active. You have a <strong style="color:#39ff14;">${trialDays}-day free trial</strong> starting today.`
  : `Your <strong style="color:#fff;">${roleLabel}</strong> account is active and <strong style="color:#39ff14;">free </strong>. Welcome aboard!`
    )}
    ${greenBox(`
  ${pill("Account Type", roleLabel)}
  ${pill("Status", "Active")}
  ${pill(trialDays > 0 ? "Trial Period" : "Billing", trialDays > 0 ? `${trialDays} days free` : "Free forever")}
  ${pill("Price", role === "dispatcher" ? "$55/mo after trial" : role === "carrier" ? "$49/mo after trial" : "Free")}
`)}
    ${para("Get started by logging into your dashboard and exploring the load board.")}
    ${ctaButton("Go To Dashboard", "https://loads.boxaloo.com")}
    ${para(`Questions? Reply to this email anytime.`)}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: role === "broker"
      ? `Welcome to Boxaloo — Your Free Account is Active`
      : `Welcome to Boxaloo — Your ${trialDays}-Day Free Trial Has Started`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 2. NEW LOAD REQUEST → BROKER
// ═══════════════════════════════════════
export async function sendLoadRequestEmail({
  to, brokerName, requesterName, requesterCompany,
  requesterType, loadId, route, payRate,
}: {
  to: string
  brokerName: string
  requesterName: string
  requesterCompany: string
  requesterType: string
  loadId: string
  route: string
  payRate: number
  trialDays?: number
}) {
  const content = `
    ${heading("New Load Request")}
    ${para(`Hi ${brokerName}, you have a new booking request on one of your loads.`)}
    ${greenBox(`
      ${pill("Load ID", loadId)}
      ${pill("Route", route)}
      ${pill("Pay Rate", `$${payRate.toLocaleString()}`)}
      ${pill("Requested By", requesterName)}
      ${pill("Company", requesterCompany)}
      ${pill("Type", requesterType.charAt(0).toUpperCase() + requesterType.slice(1))}
    `)}
    ${para("Log in to accept or decline this request.")}
    ${ctaButton("Review Request", "https://loads.boxaloo.com/broker")}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New Request on ${loadId} — ${route}`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 3. REQUEST ACCEPTED → CARRIER/DISPATCHER
// ═══════════════════════════════════════
export async function sendRequestAcceptedEmail({
  to, name, loadId, route, payRate, pickupDate, dropoffDate, brokerName, brokerMc,
}: {
  to: string
  name: string
  loadId: string
  route: string
  payRate: number
  pickupDate?: string | null
  dropoffDate?: string | null
  brokerName: string
  brokerMc: string
}) {
  const content = `
    ${heading("Your Request Was Accepted")}
    ${para(`Good news ${name} — your booking request has been <strong style="color:#39ff14;">accepted</strong>.`)}
    ${greenBox(`
      ${pill("Load ID", loadId)}
      ${pill("Route", route)}
      ${pill("Pay Rate", `$${payRate.toLocaleString()}`)}
      ${pickupDate ? pill("Pickup Date", new Date(pickupDate).toLocaleDateString()) : ""}
      ${dropoffDate ? pill("Dropoff Date", new Date(dropoffDate).toLocaleDateString()) : ""}
      ${pill("Broker", brokerName)}
      ${pill("MC#", brokerMc)}
    `)}
    ${para("Log in to view your load details and check for any messages from the broker.")}
    ${ctaButton("View My Loads", "https://loads.boxaloo.com")}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Load ${loadId} Confirmed — ${route}`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 4. REQUEST DECLINED → CARRIER/DISPATCHER
// ═══════════════════════════════════════
export async function sendRequestDeclinedEmail({
  to, name, loadId, route,
}: {
  to: string
  name: string
  loadId: string
  route: string
}) {
  const content = `
    ${heading("Request Update")}
    ${para(`Hi ${name}, your booking request for the following load was not accepted this time.`)}
    ${greenBox(`
      ${pill("Load ID", loadId)}
      ${pill("Route", route)}
      ${pill("Status", "Declined")}
    `)}
    ${para("There are plenty more loads on the board — log in and find your next one.")}
    ${ctaButton("Browse Load Board", "https://loads.boxaloo.com/loadboard")}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Load Request Update — ${loadId}`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 5. LOAD CANCELED → CARRIER/DISPATCHER
// ═══════════════════════════════════════
export async function sendLoadCanceledEmail({
  to, name, loadId, route,
}: {
  to: string
  name: string
  loadId: string
  route: string
}) {
  const content = `
    ${heading("Load Canceled")}
    ${para(`Hi ${name}, we're sorry to let you know that the following load has been canceled by the broker.`)}
    ${greenBox(`
      ${pill("Load ID", loadId)}
      ${pill("Route", route)}
      ${pill("Status", "Canceled")}
    `)}
    ${para("Head back to the load board to find a replacement load.")}
    ${ctaButton("Find Another Load", "https://loads.boxaloo.com/loadboard")}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Load ${loadId} Has Been Canceled`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 6. DRIVER INVITE → DRIVER
// ═══════════════════════════════════════
export async function sendDriverInviteEmail({
  to, driverName, dispatcherName, dispatcherCompany, token,
}: {
  to: string
  driverName: string
  dispatcherName: string
  dispatcherCompany: string
  token: string
}) {
  const onboardingUrl = `https://loads.boxaloo.com/onboarding?token=${token}`
  const content = `
    ${heading("You've Been Invited to Boxaloo")}
    ${para(`Hi ${driverName}, <strong style="color:#fff;">${dispatcherName}</strong> from <strong style="color:#fff;">${dispatcherCompany}</strong> has invited you to complete your driver onboarding on Boxaloo.`)}
    ${greenBox(`
      ${pill("Invited By", dispatcherName)}
      ${pill("Company", dispatcherCompany)}
      ${pill("Action Required", "Complete Onboarding")}
    `)}
    ${para("Click below to upload your documents and complete your profile. This link is unique to you.")}
    ${ctaButton("Complete Onboarding", onboardingUrl)}
    ${para(`If you weren't expecting this, you can safely ignore this email.`)}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${dispatcherCompany} Invited You to Boxaloo`,
    html: baseTemplate(content),
  })
}

// ═══════════════════════════════════════
// 7. PAYMENT DUE REMINDER → CARRIER/DISPATCHER
// ═══════════════════════════════════════
export async function sendPaymentReminderEmail({
  to, name, role, trialEndsAt,
}: {
  to: string
  name: string
  role: string
  trialEndsAt: string
}) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const price = role === "dispatcher" ? "$55/mo" : role === "carrier" ? "$49/mo" : "Free"
  const dueDate = new Date(trialEndsAt).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  const content = `
    ${heading("Your Trial Ends in 5 Days")}
    ${para(`Hi ${name}, your Boxaloo ${roleLabel} trial is ending soon. Add a payment method to keep uninterrupted access to the load board.`)}
    ${greenBox(`
      ${pill("Plan", `${roleLabel} — ${price}`)}
      ${pill("Trial Ends", dueDate)}
      ${pill("Action Required", "Add Payment Method")}
    `)}
    ${para("If you don't add a payment method before your trial ends your account will be paused and you won't be able to access the load board.")}
    ${ctaButton("Add Payment Method", "https://loads.boxaloo.com")}
    ${para(`Questions about billing? Reply to this email and we'll help you out.`)}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Boxaloo Trial Ends in 5 Days — ${dueDate}`,
    html: baseTemplate(content),
  })
}
//═══════════════════════════════════════
// 8. OTP VERIFICATION EMAIL
// ═══════════════════════════════════════
export async function sendOtpEmail({
  to, name, code,
}: {
  to: string
  name: string
  code: string
}) {
  const content = `
    ${heading(`Verify Your Email`)}
    ${para(`Hi ${name}, enter the code below to verify your Boxaloo account. This code expires in 10 minutes.`)}
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#0a0a0a;border:1px solid rgba(57,255,20,0.3);border-radius:8px;padding:24px 40px;">
        <div style="font-family:'Courier New',monospace;font-size:42px;font-weight:700;color:#39ff14;letter-spacing:12px;text-shadow:0 0 20px rgba(57,255,20,0.5);">
          ${code}
        </div>
        <div style="font-size:10px;color:#333;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Verification Code</div>
      </div>
    </div>
    ${para(`If you didn't request this code you can safely ignore this email.`)}
  `
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${code} — Your Boxaloo Verification Code`,
    html: baseTemplate(content),
  })
}
// ═══════════════════════════════════════
// 9. NEW SIGNUP NOTIFICATION → INTERNAL
// ═══════════════════════════════════════
export async function sendNewSignupNotification({
  name, company, email, role, phone,
}: {
  name: string
  company: string
  email: string
  role: string
  phone?: string
}) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const signupTime = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  })
  const content = `
    ${heading("New Signup on Boxaloo")}
    ${para(`A new <strong style="color:#39ff14;">${roleLabel}</strong> just created an account.`)}
    ${greenBox(`
      ${pill("Name", name)}
      ${pill("Company", company || "—")}
      ${pill("Email", email)}
      ${pill("Phone", phone || "—")}
      ${pill("Role", roleLabel)}
      ${pill("Signed Up", signupTime)}
    `)}
    ${ctaButton("View Dashboard", "https://loads.boxaloo.com/admin")}
  `
  await resend.emails.send({
    from: FROM,
    to: "signups@boxaloo.com",
    subject: `New ${roleLabel} Signup — ${name} · ${company || email}`,
    html: baseTemplate(content),
  })
}