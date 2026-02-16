// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - TradeFlow UK",
};

export default function PrivacyPage() {
  return (
    <section className="legal-page-container">
      <div className="legal-content-wrapper">
        <h1>Privacy Policy</h1>
        <p className="legal-meta">Last updated: October 28, 2025</p>
        <p>
          This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service. This is a boilerplate template. 
          <strong> It is strongly recommended that you consult with a legal professional to customize this for your specific business needs, especially regarding GDPR.</strong>
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information, such as your name, email address, and phone number, when you book a consultation or contact us.</li>
          <li><strong>Usage Data:</strong> Usage Data is collected automatically when using the Service. This may include information such as your device's IP address, browser type, browser version, and the pages of our Service that you visit.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
          <li>To manage your account and your requests.</li>
          <li>To contact you by email, telephone calls, or other equivalent forms of electronic communication regarding updates or informative communications related to the functionalities, products or contracted services.</li>
        </ul>

        <h2>3. Data Sharing and Disclosure</h2>
        <ul>
          <li>We use third-party services such as Calendly for appointment scheduling. When you use these services, your data is subject to their respective privacy policies. We do not sell or rent your personal data to third parties.</li>
        </ul>

        <h2>4. Data Security</h2>
        <ul>
          <li>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.</li>
        </ul>

        <h2>5. Your Data Protection Rights (GDPR)</h2>
        <ul>
          <li>You have the right to access, update, or delete the information we have on you. You also have other rights such as the right to rectification, objection, and data portability.</li>
        </ul>

        <h2>6. Contact Us</h2>
        <ul>
          <li>If you have any questions about this Privacy Policy, you can contact us at [Your Email Address].</li>
        </ul>
      </div>
    </section>
  );
}