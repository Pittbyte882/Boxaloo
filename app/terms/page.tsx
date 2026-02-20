import { BoxalooWordmark } from "@/components/boxaloo-wordmark"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070709" }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <a href="/"><BoxalooWordmark size="md" /></a>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
      </header>

      <main className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div
          className="rounded-xl p-8 lg:p-12"
          style={{ background: "#0c0c0f", border: "1px solid rgba(57,255,20,0.08)" }}
        >
          <div className="mb-8 pb-8" style={{ borderBottom: "1px solid rgba(57,255,20,0.08)" }}>
            <div
              className="inline-block text-xs font-mono px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)", color: "#39ff14", letterSpacing: "3px" }}
            >
              &gt; LEGAL
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground font-mono">Effective Date: August 15, 2025</p>
          </div>

          <div style={{ color: "#888" }}>
            <p className="mb-8 leading-relaxed text-sm">
              Welcome to Boxaloo ("Company," "we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Boxaloo platform, website, mobile application, and related services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use the Services.
            </p>

            <SimpleSection title="1. Eligibility">
              You must be at least 18 years old to use our Services. By using the Services, you represent and warrant that you have the authority to enter into these Terms on behalf of yourself or your business. You are responsible for ensuring that your use of the Services complies with all applicable laws and regulations.
            </SimpleSection>

            <SimpleSection title="2. Services Provided">
              Boxaloo is a load board platform designed to connect shippers, brokers, and carriers for box trucks and cargo vans. We do not own or operate any vehicles, nor do we act as a broker, carrier, or shipper. All arrangements made between users are independent of Boxaloo.
            </SimpleSection>

            <SimpleSection title="3. User Accounts">
              To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update your information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, unlawful, or abusive activities.
            </SimpleSection>

            <SimpleSection title="4. Fees and Payments">
              Some Services may require payment of fees. All fees will be disclosed prior to purchase or subscription. Payments are non-refundable unless otherwise stated in our refund policy. You agree to provide accurate billing information and authorize us to charge the specified payment method.
            </SimpleSection>

            <div className="mb-8">
              <h3 className="font-bold text-white mb-3">5. User Responsibilities</h3>
              <p className="text-sm mb-3 leading-relaxed">When using Boxaloo, you agree:</p>
              <ul className="flex flex-col gap-2">
                {[
                  "Not to use the platform for unlawful, fraudulent, or deceptive purposes.",
                  "Not to post or transmit harmful, defamatory, obscene, or infringing content.",
                  "To comply with all industry, safety, and transportation regulations when arranging shipments.",
                  "To independently verify the legitimacy, licensing, and insurance of any carrier, broker, or shipper you engage with.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span style={{ color: "#39ff14", marginTop: 2 }}>▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <SimpleSection title="6. Intellectual Property">
              All content, trademarks, logos, and materials available on Boxaloo are the property of Boxaloo or its licensors and are protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </SimpleSection>

            <SimpleSection title="7. Third-Party Links and Services">
              Our platform may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of third parties and provide such links only for convenience.
            </SimpleSection>

            <SimpleSection title="8. Limitation of Liability">
              Boxaloo provides the Services "as is" and "as available." We make no warranties or representations regarding the reliability, availability, or accuracy of the Services. To the fullest extent permitted by law, we are not liable for any indirect, incidental, consequential, or punitive damages. Our total liability for any claim related to the Services shall not exceed the amount you paid us in the past 12 months.
            </SimpleSection>

            <SimpleSection title="9. Indemnification">
              You agree to indemnify and hold Boxaloo, its affiliates, officers, employees, and partners harmless from any claims, damages, losses, liabilities, and expenses arising out of your use of the Services, your violation of these Terms, or any agreement or dispute between you and another user.
            </SimpleSection>

            <SimpleSection title="10. Termination">
              We reserve the right to suspend or terminate your account and access to the Services at any time, with or without cause or notice, including if you violate these Terms.
            </SimpleSection>

            <SimpleSection title="11. Changes to These Terms">
              We may update these Terms from time to time. Any changes will be effective upon posting the revised Terms on our website, with the "Effective Date" updated accordingly. Continued use of the Services after changes means you accept the updated Terms.
            </SimpleSection>

            <SimpleSection title="12. Governing Law">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.
            </SimpleSection>

            <div
              className="rounded-lg p-6 mt-8"
              style={{ background: "rgba(57,255,20,0.03)", border: "1px solid rgba(57,255,20,0.1)" }}
            >
              <h3 className="font-bold text-white mb-2">13. Contact Us</h3>
              <p className="text-sm leading-relaxed">
                For questions about these Terms, please contact us:
              </p>
              <p className="text-sm mt-2">
                <span className="text-white font-bold">Boxaloo</span><br />
                Email:{" "}
                <a href="mailto:support@boxaloo.com" style={{ color: "#39ff14" }}>
                  support@boxaloo.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer
        className="border-t px-6 py-6"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 Boxaloo. All rights reserved.</p>
          <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  )
}

function SimpleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-bold text-white mb-3">{title}</h3>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  )
}