// app/components/GoHighLevelForm.js
'use client'; // This is a Client Component, essential for using hooks like useEffect

import { useEffect } from 'react';

const GoHighLevelForm = () => {
  useEffect(() => {
    // This function runs after the component mounts on the client's browser
    const script = document.createElement('script');
    script.src = "https://link.msgsndr.com/js/form_embed.js"; // The GHL script URL
    script.async = true;
    
    // Append the script to the body
    document.body.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []); // The empty array ensures this effect runs only once

  return (
    // This is where you paste the <iframe> part of your GHL embed code.
    // It's important to use dangerouslySetInnerHTML for this.
    <div
      style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
      dangerouslySetInnerHTML={{
        __html: `
          <!-- 
            PASTE YOUR GHL <iframe> CODE HERE. 
            IT WILL LOOK SOMETHING LIKE THIS:
            <iframe src="https://link.msgsndr.com/widget/form/XYZ..." style="width: 100%; height: 100%; border: none; border-radius: 5px;" id="inline-XYZ..."></iframe>
          -->

          <!-- For now, here is a placeholder until you get your real code -->
          <div style="background-color: white; padding: 20px; border-radius: 5px; color: #333;">
            <h2>Your Booking Form Will Appear Here</h2>
            <p>Go to GoHighLevel, create your form, and paste the iframe code to replace this placeholder.</p>
          </div>
        `,
      }}
    />
  );
};

export default GoHighLevelForm;