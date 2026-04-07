export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <a href="/" className="font-mono text-xl font-bold tracking-widest text-foreground">
          BOX<span className="text-primary">ALOO</span>
        </a>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Home
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: October 5, 2025 &middot; Last Updated: April 7, 2026
          </p>
        </div>

        <div className="flex flex-col gap-10 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Billing & Trial Terms</h2>
            <p className="mb-4">
              By creating an account and subscribing to Boxaloo, you agree to the following billing and cancellation terms:
            </p>

            <h3 className="text-base font-bold text-foreground mb-2">Trial Offer</h3>
            <p className="mb-4">
              Boxaloo provides a 3-day trial for a one-time setup fee of <span className="text-primary font-mono">$5.00</span>. The trial period begins immediately upon signup and gives you full access to your dashboard for 3 days.
            </p>

            <h3 className="text-base font-bold text-foreground mb-2">Subscription Fees</h3>
            <p className="mb-2">Upon expiration of the trial period, continued access requires a manual payment:</p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ Carrier accounts: <span className="text-primary font-mono">$49.00</span> per 30 days</li>
              <li>→ Dispatcher accounts: <span className="text-primary font-mono">$55.00</span> per 30 days</li>
            </ul>
            <p className="mb-4">
              <strong className="text-foreground">Boxaloo does not automatically charge your card.</strong> Access must be renewed manually every 30 days by logging in and submitting payment. If payment is not made, access to the platform will be suspended until payment is received.
            </p>

            <h3 className="text-base font-bold text-foreground mb-2">Cancellation During Trial</h3>
            <p className="mb-4">
              If you choose not to continue after the trial period, simply do not make a payment when your access expires. Your account will be suspended automatically and you will not be charged anything beyond the initial $5.00 setup fee.
            </p>

            <h3 className="text-base font-bold text-foreground mb-2">Cancellation After Billing</h3>
            <p className="mb-4">
              If you have made a monthly payment and choose not to continue:
            </p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ All payments are non-refundable</li>
              <li>→ Your account will remain active until your current 30-day period expires</li>
              <li>→ No partial refunds or prorated credits will be issued</li>
              <li>→ Simply do not log in and pay when the next period is due — your access will expire automatically</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. No Refund Policy</h2>
            <p className="mb-4">
              All payments — including the $5.00 setup fee and monthly access fees — are final. Boxaloo does not provide refunds or credits for:
            </p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ Partial billing periods</li>
              <li>→ Unused time within a paid period</li>
              <li>→ Failure to use the platform after payment</li>
              <li>→ Failure to cancel before a new payment period begins</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. Payment & Dispute Policy</h2>
            <p className="mb-4">By purchasing a Boxaloo subscription, you agree to the following:</p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ You understand that your subscription includes a 3-day trial for $5, after which access requires a manual monthly payment</li>
              <li>→ You are responsible for logging in and submitting payment before your access period expires</li>
              <li>→ Boxaloo will never automatically charge your payment method — all charges are initiated by you</li>
            </ul>

            <h3 className="text-base font-bold text-foreground mb-2">No Chargeback Agreement</h3>
            <p className="mb-4">You agree not to initiate chargebacks or payment disputes for:</p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ Valid subscription charges after the trial period</li>
              <li>→ Payments you submitted manually through the Boxaloo platform</li>
              <li>→ Lack of usage of the platform during a paid period</li>
            </ul>
            <p className="mb-4">If a chargeback is initiated:</p>
            <ul className="list-none flex flex-col gap-1 mb-4 pl-4">
              <li>→ Your Boxaloo account may be immediately suspended or terminated</li>
              <li>→ You remain responsible for any outstanding balances</li>
              <li>→ Boxaloo reserves the right to dispute the chargeback with evidence of your agreement to these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Dispute Resolution</h2>
            <p className="mb-4">
              If you believe you were billed in error, you agree to contact Boxaloo's billing department first at{" "}
              <a href="mailto:billing@boxaloo.com" className="text-primary hover:underline">
                billing@boxaloo.com
              </a>{" "}
              to resolve the issue before contacting your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. Changes to Fees</h2>
            <p>
              Boxaloo reserves the right to modify subscription pricing with reasonable notice. Continued use of the service after a pricing change constitutes acceptance of the updated pricing.
            </p>
          </section>

        </div>

        <div
          className="mt-16 p-6 rounded-xl border text-sm text-muted-foreground"
          style={{ borderColor: "rgba(57,255,20,0.1)", background: "rgba(57,255,20,0.02)" }}
        >
          <p>
            Questions about billing? Contact us at{" "}
            <a href="mailto:billing@boxaloo.com" className="text-primary hover:underline">
              billing@boxaloo.com
            </a>
          </p>
        </div>
      </main>

      <footer
        className="border-t px-6 py-8 mt-16"
        style={{ borderColor: "rgba(57,255,20,0.08)", background: "#070709" }}
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground text-center">
            © 2026 Boxaloo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}