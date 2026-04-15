import React from 'react';

const LOGO_URL = "/logo.png";

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