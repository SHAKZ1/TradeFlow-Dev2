import { db } from '@/lib/db';
import { calculateFinancials } from '@/lib/analytics/math';
import { getAccessToken } from '@/lib/ghl';
import { GHL_CONFIG } from '@/app/api/ghl/config';
import { startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns';

function parseAddress(address: string) {
    const parts = address.split(',').map(s => s.trim());
    const postcode = parts[parts.length - 1];
    const city = parts[parts.length - 2] || "London";
    const district = parts[parts.length - 3] || city;
    return { postcode, city, district };
}

function getDominantSector(leads: any[]) {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
        const serviceField = l.customFields?.find((f: any) => f.id === GHL_CONFIG.customFields.jobType);
        const val = serviceField?.value || "General Trade";
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "General Trade");
}

// Robust Domain Cleaner
function cleanDomain(url: string) {
    if (!url) return "";
    try {
        const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return hostname.replace(/^www\./, '');
    } catch (e) {
        return url;
    }
}

export async function buildCortexContext(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) throw new Error("User or GHL Connection not found");

  const token = await getAccessToken(user.ghlLocationId);
  if (!token) throw new Error("GHL Token Invalid");

  // 1. TIME RELATIVITY
  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const currentDay = getDate(now);
  const monthProgress = (currentDay / daysInMonth) * 100;

  // 2. FETCH DATA
  const locationRes = await fetch(`https://services.leadconnectorhq.com/locations/${user.ghlLocationId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
  });
  const locationData = await locationRes.json();
  const location = locationData.location || {};

  const oppsRes = await fetch(
      `https://services.leadconnectorhq.com/opportunities/search?location_id=${user.ghlLocationId}&pipeline_id=${GHL_CONFIG.pipelineId}`,
      { headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' } }
  );
  const oppsData = await oppsRes.json();
  const rawLeads = oppsData.opportunities || [];

  const [expenses, quotes, invoices, lastReport] = await Promise.all([
    db.jobExpense.findMany({ where: { userId } }),
    db.quote.findMany({ where: { status: 'paid' } }), 
    db.invoice.findMany({ where: { status: 'paid' } }),
    db.aiAdvisorReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
  ]);

  const mappedLeads = rawLeads.map((o: any) => ({
      id: o.id,
      value: o.monetaryValue || 0,
      status: o.status === 'won' ? 'job-complete' : o.status === 'lost' ? 'lost' : 'open',
      depositStatus: o.customFields?.find((f: any) => f.id === GHL_CONFIG.customFields.depositStatus)?.value || 'unpaid',
      invoiceStatus: o.customFields?.find((f: any) => f.id === GHL_CONFIG.customFields.invoiceStatus)?.value || 'unpaid',
  }));

  const currentStats = calculateFinancials(mappedLeads, expenses, quotes, invoices);
  
  const niche = user.companyNiche || getDominantSector(rawLeads);
  const companyName = user.companyName || location.name || "TradeFlow User";
  const addressInfo = parseAddress(user.companyAddress || location.address || "");
  const searchLocation = `${addressInfo.district}, ${addressInfo.city}`; 
  const websiteUrl = user.companyWebsite || location.website;
  const myDomain = cleanDomain(websiteUrl);

  // 3. LIVE FORENSIC RECONNAISSANCE
  let competitorIntel: any[] = [];
  let reputationIntel: any[] = [];
  let seoIntel: any = { 
      myPages: "0", 
      competitors: [], // Array of { name, pages }
      trafficSignal: "Unknown", 
      speedScore: null // Nullable
  };

  if (process.env.SERPAPI_KEY) {
      try {
        // A. CORE SEARCHES
        const compQuery = `${niche} in ${searchLocation}`;
        const repQuery = `${companyName} ${searchLocation}`; 
        const mySiteQuery = `site:${myDomain}`;

        const [compRes, repRes, mySiteRes] = await Promise.all([
            fetch(`https://serpapi.com/search.json?api_key=${process.env.SERPAPI_KEY}&q=${encodeURIComponent(compQuery)}&google_domain=google.co.uk&gl=uk&hl=en`),
            fetch(`https://serpapi.com/search.json?api_key=${process.env.SERPAPI_KEY}&q=${encodeURIComponent(repQuery)}&google_domain=google.co.uk&gl=uk&hl=en`),
            websiteUrl ? fetch(`https://serpapi.com/search.json?api_key=${process.env.SERPAPI_KEY}&q=${encodeURIComponent(mySiteQuery)}&google_domain=google.co.uk&gl=uk&hl=en`) : Promise.resolve(null)
        ]);

        const compData = await compRes.json();
        const repData = await repRes.json();
        const mySiteData = mySiteRes ? await mySiteRes.json() : null;

        // --- 1. MY SEO STATS ---
        if (mySiteData && mySiteData.search_information) {
            seoIntel.myPages = mySiteData.search_information.total_results || "0";
        }

        // --- 2. COMPETITOR INTELLIGENCE (MULTI-TARGET) ---
        let potentialCompetitors: any[] = [];
        
        // Local Pack
        if (Array.isArray(compData.local_results)) {
            competitorIntel = compData.local_results.slice(0, 3).map((c: any) => ({
                name: c.title,
                rating: c.rating,
                reviews: c.reviews,
                type: "Local Map Winner",
                address: c.address
            }));
        }
        
        // Organic (Find the SEO Leaders)
        if (Array.isArray(compData.organic_results)) {
            const topOrganic = compData.organic_results.slice(0, 10).map((r: any) => ({
                name: r.title,
                snippet: r.snippet,
                type: "Organic SEO Winner",
                link: r.link,
                domain: cleanDomain(r.link)
            }));
            
            // Filter out directories and MYSELF
            const directories = ["checkatrade", "yell", "trustpilot", "mybuilder", "facebook", "instagram", "linkedin", "bark"];
            
            // FIX: Explicitly typed 'c' as any to satisfy TypeScript
            potentialCompetitors = topOrganic.filter((c: any) => {
                const isDirectory = directories.some(d => c.domain.includes(d));
                const isMe = c.domain === myDomain; 
                return !isDirectory && !isMe;
            }).slice(0, 3); // Take top 3 real businesses

            competitorIntel = [...competitorIntel, ...potentialCompetitors];
        }

        // --- 3. COUNTER-STRIKE SCAN (Scan Top 3 Competitors) ---
        if (potentialCompetitors.length > 0) {
            // FIX: Explicitly typed 'comp' as any
            const compPromises = potentialCompetitors.map((comp: any) => 
                fetch(`https://serpapi.com/search.json?api_key=${process.env.SERPAPI_KEY}&q=${encodeURIComponent(`site:${comp.domain}`)}&google_domain=google.co.uk&gl=uk&hl=en`)
                    .then(r => r.json())
                    .then(data => ({
                        name: comp.name,
                        pages: data.search_information?.total_results || "Unknown"
                    }))
            );
            
            const compStats = await Promise.all(compPromises);
            seoIntel.competitors = compStats;
        }

        // --- 4. REPUTATION SCAN ---
        if (repData.knowledge_graph) {
            reputationIntel.push({
                source: "Google",
                rating: repData.knowledge_graph.rating || "N/A",
                reviews: repData.knowledge_graph.review_count || "0",
                status: "Active"
            });
        }

        if (Array.isArray(repData.organic_results)) {
            const targets = ["trustpilot", "yell", "checkatrade", "facebook", "google"];
            repData.organic_results.forEach((r: any) => {
                const title = (r.title || "").toLowerCase();
                const link = (r.link || "").toLowerCase();
                const isTarget = targets.some(t => title.includes(t) || link.includes(t));
                
                if (isTarget) {
                    let rating = "N/A";
                    let reviewCount = "0";
                    let status = "Listing Found";

                    const ratingMatch = r.snippet?.match(/(\d(\.\d)?)\s*(\/|stars|star)/i) || r.title?.match(/(\d(\.\d)?)\s*(\/|stars|star)/i);
                    const countMatch = r.snippet?.match(/(\d+)\s*reviews?/i) || r.title?.match(/(\d+)\s*reviews?/i);

                    if (r.rich_snippet?.top?.detected_extensions?.rating) rating = r.rich_snippet.top.detected_extensions.rating;
                    else if (ratingMatch) rating = ratingMatch[1];

                    if (r.rich_snippet?.top?.detected_extensions?.reviews) reviewCount = r.rich_snippet.top.detected_extensions.reviews;
                    else if (countMatch) reviewCount = countMatch[1];

                    if (rating === "N/A" && reviewCount === "0") status = "Empty Profile / Unrated";
                    else status = "Active Profile";

                    let sourceName = "Directory";
                    if (link.includes("trustpilot")) sourceName = "Trustpilot";
                    else if (link.includes("yell")) sourceName = "Yell";
                    else if (link.includes("checkatrade")) sourceName = "Checkatrade";
                    else if (link.includes("facebook")) sourceName = "Facebook";
                    else if (link.includes("google")) sourceName = "Google Reviews";

                    if (!reputationIntel.some(i => i.source === sourceName)) {
                        reputationIntel.push({
                            source: sourceName,
                            rating: rating,
                            reviews: reviewCount,
                            status: status,
                            link: r.link
                        });
                    }
                }
            });
        }

      } catch (e) { console.error("SerpApi Failed", e); }
  }

  // 4. PAGESPEED (With Null Safety)
  if (websiteUrl) {
      try {
          const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
          if (apiKey) {
            const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${websiteUrl}&key=${apiKey}&strategy=mobile`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.error) {
                console.warn("PageSpeed Error:", data.error.message);
                seoIntel.speedScore = null; // Explicit null on error
            } else {
                if (data.loadingExperience && data.loadingExperience.metrics) {
                    seoIntel.trafficSignal = "High (Field Data Available)";
                } else {
                    seoIntel.trafficSignal = "Low (No Field Data)";
                }
                seoIntel.speedScore = Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100);
            }
          }
      } catch (e) { console.error("PageSpeed Failed", e); seoIntel.speedScore = null; }
  }

  return {
    meta: {
        currentDate: now.toLocaleDateString('en-GB'),
        monthProgress: `${monthProgress.toFixed(1)}%`,
    },
    identity: {
        name: companyName,
        niche: niche,
        targetLocation: searchLocation,
        fullAddress: user.companyAddress
    },
    financials: {
        revenue: currentStats.revenue,
        projectedMonthEndRevenue: (currentStats.revenue / monthProgress) * 100,
    },
    pipeline: {
        conversionRate: currentStats.conversionRate,
        totalLeads: currentStats.totalLeads,
    },
    marketRecon: competitorIntel,
    reputationAudit: reputationIntel,
    seoHardData: seoIntel,
    history: lastReport ? { lastAdviceDate: lastReport.createdAt } : null
  };
}