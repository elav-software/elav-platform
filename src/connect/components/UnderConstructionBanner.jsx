export default function UnderConstructionBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-white">
        <svg 
          className="w-6 h-6 animate-pulse" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <p className="text-sm md:text-base font-medium text-center">
          🚧 Sitio web en construcción — Estamos trabajando para mejorar tu experiencia
        </p>
      </div>
    </div>
  );
}
