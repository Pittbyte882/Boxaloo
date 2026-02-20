import { BoxalooWordmark } from "@/components/boxaloo-wordmark"

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground font-mono">Effective Date: August 15, 2025</p>
          </div>

          <div className="prose prose-sm max-w-none" style={{ color: "#888" }}>
            <p className="mb-6 leading-relaxed">
              Boxaloo ("Company," "we," "our," or "us") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your information when you use our website, mobile application, and related services (collectively, the "Services").
            </p>
            <p className="mb-8 leading-relaxed">
              By using our Services, you consent to the practices described in this Privacy Policy. If you do not agree, please discontinue use of the Services.
            </p>

            {[
              {
                title: "1. Information We Collect",
                content: "We collect information to provide and improve our Services, including:",
                bullets: [
                  "Personal Information: Name, email address, phone number, business details, payment information, and other identifiers you provide during registration or transactions.",
                  "Usage Information: IP address, browser type, device information, access times, and pages viewed.",
                  "Transactional Data: Details about loads, shipments, or services you post, view, or arrange on the platform.",
                  "Cookies and Tracking Technologies: We use cookies, web beacons, and similar tools to enhance your experience and analyze site performance.",
                ],
              },
              {
                title: "2. How We Use Your Information",
                content: "We may use your information for:",
                bullets: [
                  "Providing, operating, and improving our Services.",
                  "Processing transactions and facilitating communication between shippers, brokers, and carriers.",
                  "Personalizing user experience and delivering relevant content.",
                  "Sending administrative updates, marketing communications, and important notices.",
                  "Detecting, preventing, and addressing fraud or unauthorized activity.",
                  "Complying with legal obligations and enforcing our Terms and Conditions.",
                ],
              },
              {
                title: "3. How We Share Your Information",
                content: "We do not sell your personal information. However, we may share it with:",
                bullets: [
                  "Service Providers: Third-party vendors assisting with payment processing, analytics, hosting, or customer support.",
                  "Business Partners: Shippers, brokers, or carriers you choose to connect with on the platform.",
                  "Legal and Regulatory Authorities: When required by law, court order, or to protect our rights.",
                  "Business Transfers: In the event of a merger, acquisition, or sale of assets.",
                ],
              },
              {
                title: "4. Your Privacy Choices",
                content: "Depending on your location, you may have certain rights regarding your personal information, including:",
                bullets: [
                  "Accessing, updating, or deleting your information.",
                  "Opting out of marketing communications by clicking \"unsubscribe\" in our emails.",
                  "Managing cookie preferences through your browser settings.",
                ],
                footer: "If you wish to exercise your rights, contact us at the information below.",
              },
            ].map((section) => (
              <Section key={section.title} {...section} />
            ))}

            <SimpleSection title="5. Data Security">
              We implement industry-standard technical and organizational measures to protect your information against unauthorized access, use, or disclosure. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </SimpleSection>

            <SimpleSection title="6. Data Retention">
              We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law.
            </SimpleSection>

            <SimpleSection title="7. Third-Party Services">
              Our Services may link to or integrate with third-party services. We are not responsible for their privacy practices, and we encourage you to review their policies.
            </SimpleSection>

            <SimpleSection title="8. Children's Privacy">
              Our Services are not directed toward individuals under 18. We do not knowingly collect personal information from children. If we become aware that we have collected such information, we will delete it.
            </SimpleSection>

            <SimpleSection title="9. International Users">
              If you access our Services from outside the United States, please note that your information may be processed and stored in countries where data protection laws may differ from those in your jurisdiction.
            </SimpleSection>

            <SimpleSection title="10. Changes to This Policy">
              We may update this Privacy Policy periodically. We will post the updated version with a revised "Effective Date." Continued use of the Services indicates your acceptance of the changes.
            </SimpleSection>

            <div
              className="rounded-lg p-6 mt-8"
              style={{ background: "rgba(57,255,20,0.03)", border: "1px solid rgba(57,255,20,0.1)" }}
            >
              <h3 className="font-bold text-white mb-2">11. Contact Us</h3>
              <p className="text-sm leading-relaxed">
                For questions or concerns about this Privacy Policy, please contact us:
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
          <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</a>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, content, bullets, footer }: {
  title: string
  content: string
  bullets: string[]
  footer?: string
}) {
  return (
    <div className="mb-8">
      <h3 className="font-bold text-white mb-3">{title}</h3>
      <p className="mb-3 leading-relaxed">{content}</p>
      <ul className="flex flex-col gap-2 mb-3">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm leading-relaxed">
            <span style={{ color: "#39ff14", marginTop: 2 }}>▸</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="text-sm leading-relaxed">{footer}</p>}
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