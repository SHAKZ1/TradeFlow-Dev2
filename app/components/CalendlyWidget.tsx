'use client';

import { useEffect, FC } from 'react';

const CalendlyWidget: FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      className="calendly-inline-widget w-full" 
      data-url="https://calendly.com/shakil-igbokwe03/15-minute-consultation?hide_gdpr_banner=1&background_color=ffffff&text_color=111827&primary_color=4f46e5" 
      style={{ minWidth: '320px', height: '700px' }} 
    />
  );
};

export default CalendlyWidget;




//https://calendly.com/shakil-igbokwe03/15-minute-consultation?hide_gdpr_banner=1