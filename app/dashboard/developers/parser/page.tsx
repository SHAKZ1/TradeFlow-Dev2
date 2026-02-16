'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ParserTestPage() {
  const { user } = useUser();
  const [subject, setSubject] = useState('New Job Lead from Checkatrade');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);

  const sampleTrustpilot = `
    <html>
      <body>
        <h1>You got a new review!</h1>
        <p>Review by <strong>Alice Wonderland</strong></p>
        <p>5 stars</p>
        <p>Great service, very quick and clean.</p>
        <a href="#">Reply to review</a>
      </body>
    </html>
  `;

  // --- AUTO-FETCH LOCATION ID ---
  useEffect(() => {
      fetch('/api/settings')
          .then(res => res.json())
          .then(data => {
              if (data.ghlLocationId) {
                  setLocationId(data.ghlLocationId);
              }
          });
  }, []);

  const handleTest = async () => {
    if (!locationId) {
        alert("No Location ID found. Please connect GHL in Settings.");
        return;
    }
    setLoading(true);
    try {
        // Use the dynamic locationId
        const res = await fetch(`/api/webhooks/parser?locationId=${locationId}`, {
            method: 'POST',
            body: JSON.stringify({ subject, body })
        });
        const data = await res.json();
        setResult(data);

    } catch (e: any) {
        setResult({ error: e.message });
    } finally {
        setLoading(false);
    }
  };

  const sampleCheckatrade = `
    <html>
      <body>
        <h1>New Job Alert</h1>
        <p><strong>Job Description:</strong> Boiler leaking in the kitchen.</p>
        <hr>
        <h3>Customer Details</h3>
        <p>Name: John Smith</p>
        <p>Telephone: 07700 900 123</p>
        <p>Email: john.smith@example.com</p>
        <p>Postcode: SW1A 1AA</p>
      </body>
    </html>
  `;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lead Parser Simulator</h1>
          <div className="text-xs font-mono bg-gray-100 px-3 py-1 rounded-full">
              Target Location: {locationId || 'Loading...'}
          </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold mb-2">Email Subject</label>
                <input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 border rounded-xl"
                />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">Email Body (HTML)</label>
                <textarea 
                    value={body} 
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-64 p-3 border rounded-xl font-mono text-xs"
                    placeholder="Paste raw HTML here..."
                />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => { setSubject("You got a new review on Trustpilot"); setBody(sampleTrustpilot); }}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-xs font-bold"
                >
                    Load Trustpilot Sample
                </button>
                <button 
                    onClick={() => setBody(sampleCheckatrade)}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold"
                >
                    Load Checkatrade Sample
                </button>
                <button 
                    onClick={handleTest}
                    disabled={loading || !locationId}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                    {loading ? 'Parsing...' : 'Simulate Webhook'}
                </button>
            </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 text-green-400 font-mono text-xs overflow-auto h-[500px]">
            <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}