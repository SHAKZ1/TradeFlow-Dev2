export interface ParsedData {
  type: 'Lead' | 'Review';
  provider: 'Checkatrade' | 'TrustATrader' | 'MyBuilder' | 'Trustpilot' | 'Yell' | 'Google' | 'Unknown';
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  postcode: string;
  description: string; // Job Description OR Review Body
  source: string;
  rating?: number; // 1-5
}

export function parseEmail(subject: string, body: string): ParsedData {
  // Normalize inputs
  const text = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); 
  const lowerSub = subject.toLowerCase();
  const lowerBody = text.toLowerCase();

  let data: ParsedData = {
    type: 'Lead', // Default
    provider: 'Unknown',
    firstName: 'New',
    lastName: 'Lead',
    phone: '',
    email: '',
    postcode: '',
    description: '',
    source: 'Manual'
  };

  // =================================================================
  // 1. REVIEW PARSING STRATEGIES
  // =================================================================
  
  // --- TRUSTPILOT ---
  if (lowerSub.includes('you got a new review') || lowerSub.includes('trustpilot')) {
      data.type = 'Review';
      data.provider = 'Trustpilot';
      data.source = 'Trustpilot';

      // Name: "Review by [Name]"
      const nameMatch = text.match(/Review by\s+(.+?)(?=\s+read review|\s+stars)/i);
      if (nameMatch) {
          const names = nameMatch[1].trim().split(' ');
          data.firstName = names[0];
          data.lastName = names.slice(1).join(' ') || 'Reviewer';
      }

      // Rating: "5 stars"
      const ratingMatch = text.match(/(\d)\s+stars/i);
      if (ratingMatch) data.rating = parseInt(ratingMatch[1]);

      // Body
      const bodyMatch = text.match(/stars\s+(.*?)(?=\s+Reply to review)/i);
      if (bodyMatch) data.description = bodyMatch[1].trim();
  }

  // --- YELL.COM ---
  else if (lowerSub.includes('new review') && lowerSub.includes('yell')) {
      data.type = 'Review';
      data.provider = 'Yell';
      data.source = 'Yell';

      // Name
      const nameMatch = text.match(/Review from\s+(.+?)(?=\s+on)/i);
      if (nameMatch) {
          const names = nameMatch[1].trim().split(' ');
          data.firstName = names[0];
          data.lastName = names.slice(1).join(' ') || 'Reviewer';
      }

      // Rating (Yell often sends "Rating: 5/5")
      const ratingMatch = text.match(/Rating:\s*(\d)\/5/i);
      if (ratingMatch) data.rating = parseInt(ratingMatch[1]);

      // Body
      const bodyMatch = text.match(/Comment:\s*(.*?)(?=\s+View review)/i);
      if (bodyMatch) data.description = bodyMatch[1].trim();
  }

  // =================================================================
  // 2. LEAD PARSING STRATEGIES (Existing)
  // =================================================================
  
  else if (lowerSub.includes('checkatrade') || text.includes('Checkatrade')) {
    data.provider = 'Checkatrade';
    data.source = 'Checkatrade';

    const nameMatch = text.match(/Name:\s*([A-Za-z\s]+?)(?=\s*Telephone|\s*Email|\s*Address)/i);
    if (nameMatch) {
        const names = nameMatch[1].trim().split(' ');
        data.firstName = names[0];
        data.lastName = names.slice(1).join(' ') || 'Lead';
    }

    const phoneMatch = text.match(/Telephone:\s*([\d\s\+]+)/i);
    if (phoneMatch) data.phone = phoneMatch[1].trim();

    const emailMatch = text.match(/Email:\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/i);
    if (emailMatch) data.email = emailMatch[1].trim();

    const postMatch = text.match(/Postcode:\s*([A-Z0-9\s]+)/i);
    if (postMatch) data.postcode = postMatch[1].trim();

    const descMatch = text.match(/Job Description:?\s*(.*?)(?=\s*Customer Details)/i);
    if (descMatch) data.description = descMatch[1].trim();
  }

  else if (lowerSub.includes('trustatrader') || text.includes('TrustATrader')) {
    data.provider = 'TrustATrader';
    data.source = 'TrustATrader';

    const nameMatch = text.match(/Customer Name:?\s*([A-Za-z\s]+?)(?=\s*Phone|\s*Email)/i);
    if (nameMatch) {
        const names = nameMatch[1].trim().split(' ');
        data.firstName = names[0];
        data.lastName = names.slice(1).join(' ') || 'Lead';
    }

    const phoneMatch = text.match(/Phone Number:?\s*([\d\s\+]+)/i);
    if (phoneMatch) data.phone = phoneMatch[1].trim();

    const emailMatch = text.match(/Email Address:?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/i);
    if (emailMatch) data.email = emailMatch[1].trim();
    
    const descMatch = text.match(/Work Required:?\s*(.*?)(?=\s*Customer Name)/i);
    if (descMatch) data.description = descMatch[1].trim();
  }

  // --- GENERIC FALLBACK (Only for Leads) ---
  if (data.type === 'Lead') {
      if (!data.phone) {
          const mobileMatch = text.match(/(07\d{9})/);
          if (mobileMatch) data.phone = mobileMatch[1];
      }
      if (!data.email) {
          const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/);
          if (emailMatch) data.email = emailMatch[1];
      }
  }

  // --- CLEANUP ---
  if (data.phone) {
      data.phone = data.phone.replace(/[\s\-\(\)]/g, '');
      if (data.phone.startsWith('07')) data.phone = '+44' + data.phone.substring(1);
  }

  return data;
}