import React from 'react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69878a2b6ba10a3126753b8e/6932d40b5_ChatGPTImage9feb202609_56_36pm.png";

export default function Logo({ size = "md", showTagline = false }) {
  const sizes = {
    sm: { container: "w-16 h-12" },
    md: { container: "w-24 h-20" },
    lg: { container: "w-32 h-28" },
    xl: { container: "w-40 h-36" }
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center">
      <img 
        src={LOGO_URL} 
        alt="Centro Familiar Cristiano" 
        className={`${s.container} object-contain`}
      />
      {showTagline && (
        <p className="text-gray-500 mt-1 text-xs font-light tracking-wide">
          Tu lugar, Tu casa
        </p>
      )}
    </div>
  );
}