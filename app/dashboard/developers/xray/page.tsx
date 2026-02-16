'use client';
import { useState, useEffect } from 'react';

export default function XrayPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/ghl/scan').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="p-10">Scanning...</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">GHL Field X-Ray</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <h3 className="font-bold">Opportunity Fields</h3>
            <pre className="text-xs bg-gray-100 p-4 rounded">{JSON.stringify(data.OPPORTUNITY_FIELDS, null, 2)}</pre>
        </div>
        <div>
            <h3 className="font-bold">Contact Fields</h3>
            <pre className="text-xs bg-gray-100 p-4 rounded">{JSON.stringify(data.CONTACT_FIELDS, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}