// app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - TradeFlow UK",
};

export default function TermsPage() {
  return (
    // The main section now has the clean white background
    <section className="legal-page-container">
      {/* This wrapper constrains the text to a readable width */}
      <div className="legal-content-wrapper">
        <h1>Terms and Conditions</h1>
        <p className="legal-meta">Last updated: October 28, 2025</p>
        <p>
          Please read these terms and conditions carefully before using Our Service. This is a boilerplate template. 
          <strong> It is strongly recommended that you consult with a legal professional to customize this for your specific business needs.</strong>
        </p>

        <h2>1. Agreement to Terms</h2>
        <ul>
          <li>By accessing and using our website and services (the "Service"), you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the Service.</li>
        </ul>

        <h2>2. Our Services</h2>
        <ul>
          <li>TradeFlow UK provides lead capture and business automation systems for trade businesses. Our services are provided on a setup fee plus monthly retainer basis, as detailed in our service agreements.</li>
        </ul>

        <h2>3. Intellectual Property</h2>
        <ul>
          <li>The Service and its original content, features, and functionality are and will remain the exclusive property of TradeFlow UK and its licensors. Our trademarks may not be used in connection with any product or service without our prior written consent.</li>
        </ul>

        <h2>4. Limitation of Liability</h2>
        <ul>
          <li>In no event shall TradeFlow UK, nor its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</li>
        </ul>

        <h2>5. Governing Law</h2>
        <ul>
          <li>These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.</li>
        </ul>

        <h2>6. Changes to Terms</h2>
        <ul>
          <li>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect.</li>
        </ul>

        <h2>7. Contact Us</h2>
        <ul>
          <li>If you have any questions about these Terms, please contact us at [Your Email Address].</li>
        </ul>
      </div>
    </section>
  );
}