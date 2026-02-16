export interface TemplateConfig {
  sms: string;
  emailSubject: string;
  emailBody: string;
  attachPdf: boolean; // <--- The Toggle
}

export interface CommunicationConfig {
  quote: TemplateConfig;
  invoice: TemplateConfig;
  booking: TemplateConfig; // PDF toggle usually false here
  review: TemplateConfig;  // PDF toggle usually false here
  subcontractor: TemplateConfig;
}

export const DEFAULT_COMMUNICATION_CONFIG: CommunicationConfig = {
  quote: {
    sms: "Hi {{firstName}}, please find your {{type}} quote of £{{amount}} attached. Secure deposit: {{link}}",
    emailSubject: "Your Quote: £{{amount}}",
    emailBody: "Hi {{firstName}},<br><br>Please find your {{type}} quote of £{{amount}} attached.<br><br>To proceed, please pay the secure deposit here: <a href=\"{{link}}\">Pay Deposit</a><br><br>Kind regards,<br>{{myCompany}}",
    attachPdf: true
  },
  invoice: {
    sms: "Hi {{firstName}}, please find your invoice for £{{amount}} attached. Pay securely: {{link}}",
    emailSubject: "Invoice: £{{amount}}",
    emailBody: "Hi {{firstName}},<br><br>Please find your invoice for £{{amount}} attached.<br><br>You can pay securely online here: <a href=\"{{link}}\">Pay Invoice</a><br><br>Thank you,<br>{{myCompany}}",
    attachPdf: true
  },
  booking: {
    sms: "Hi {{firstName}}, your job is confirmed for {{date}}. See you then!",
    emailSubject: "Booking Confirmation",
    emailBody: "Hi {{firstName}},<br><br>This is a confirmation that your job is booked for <strong>{{date}}</strong>.<br><br>We look forward to seeing you.<br><br>Best,<br>{{myCompany}}",
    attachPdf: false // Usually no PDF for just a booking confirmation
  },
  review: {
    sms: "Hi {{firstName}}, it was a pleasure working on your {{service}}. If you have a moment, we'd value your feedback: {{link}}",
    emailSubject: "Your project with {{myCompany}}",
    emailBody: "Dear {{firstName}},<br><br>Thank you for choosing {{myCompany}}. It was a privilege to assist you with your {{service}}.<br><br>If you were satisfied with the service, would you mind sharing your experience?<br><br><a href=\"{{link}}\">Leave a Review</a><br><br>Kind regards,<br>The {{myCompany}} Team",
    attachPdf: false
  },
  // --- NEW SECTION ---
  subcontractor: {
    sms: "Hi {{subName}}, please review and sign the subcontractor agreement for the {{service}} job: {{link}}",
    emailSubject: "Subcontractor Agreement: {{service}}",
    emailBody: "Hi {{subName}},<br><br>Please find attached the subcontractor agreement for the upcoming <strong>{{service}}</strong> job.<br><br>Agreed Rate: £{{amount}}<br><br>Please review and sign at your earliest convenience: <a href=\"{{link}}\">View Agreement</a><br><br>Thanks,<br>{{myCompany}}",
    attachPdf: true
  }
};