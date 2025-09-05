import { useEffect, useState } from 'react';

export const PleinAirLogo = ({ className = "" }: { className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Animated SVG Logo */}
      <div className="relative">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        >
          {/* Sky gradient background */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" className="transition-colors duration-2000">
                <animate 
                  attributeName="stop-color" 
                  values="#87CEEB;#98D8F4;#87CEEB" 
                  dur="4s" 
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#E6F3FF" className="transition-colors duration-2000">
                <animate 
                  attributeName="stop-color" 
                  values="#E6F3FF;#F0F8FF;#E6F3FF" 
                  dur="3s" 
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            
            {/* Mountain gradient */}
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8FBC8F" />
              <stop offset="50%" stopColor="#9ACD32" />
              <stop offset="100%" stopColor="#228B22" />
            </linearGradient>

            {/* Canvas/Easel gradient */}
            <linearGradient id="canvasGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFEF7" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8F8FF" />
            </linearGradient>

            {/* Wood gradient for easel */}
            <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DEB887" />
              <stop offset="50%" stopColor="#D2B48C" />
              <stop offset="100%" stopColor="#BC9A6A" />
            </linearGradient>
          </defs>

          {/* Animated sky background circle */}
          <circle 
            cx="16" 
            cy="16" 
            r="15" 
            fill="url(#skyGradient)" 
            stroke="#B0E0E6" 
            strokeWidth="0.5"
            className="drop-shadow-sm"
          />

          {/* Distant mountains with parallax effect */}
          <path 
            d="M 2 20 Q 8 14 14 18 Q 20 12 26 16 Q 30 14 30 20 L 30 30 L 2 30 Z" 
            fill="url(#mountainGradient)" 
            opacity="0.8"
            className="animate-pulse"
            style={{
              animationDuration: '6s',
              animationDelay: '1s'
            }}
          />

          {/* Miniature easel */}
          <g className={`transition-all duration-1500 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {/* Easel legs */}
            <line x1="8" y1="28" x2="12" y2="18" stroke="url(#woodGradient)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="12" y1="28" x2="12" y2="18" stroke="url(#woodGradient)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="16" y1="28" x2="12" y2="18" stroke="url(#woodGradient)" strokeWidth="1.2" strokeLinecap="round" />
            
            {/* Canvas on easel */}
            <rect 
              x="9" 
              y="14" 
              width="8" 
              height="6" 
              fill="url(#canvasGradient)" 
              stroke="#E0E0E0" 
              strokeWidth="0.3"
              rx="0.2"
              className="drop-shadow-sm"
            />
            
            {/* Tiny landscape painting on canvas */}
            <rect x="9.5" y="14.5" width="7" height="5" fill="#E6F3FF" rx="0.1" />
            <path d="M 10 18 Q 12 16.5 14 17.5 Q 16 16 16.5 17.5" fill="#228B22" opacity="0.7" />
            <circle cx="12" cy="16" r="0.8" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Floating paint brush */}
          <g className={`transition-all duration-2000 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <line x1="22" y1="10" x2="26" y2="6" stroke="#8B4513" strokeWidth="0.8" strokeLinecap="round">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 24 8; 5 24 8; 0 24 8; -5 24 8; 0 24 8"
                dur="4s"
                repeatCount="indefinite"
              />
            </line>
            <circle cx="25.5" cy="6.5" r="1" fill="#4A4A4A" opacity="0.8">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 24 8; 5 24 8; 0 24 8; -5 24 8; 0 24 8"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* Subtle wind effect lines */}
          <g opacity="0.3" className={`transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-30' : 'opacity-0'}`}>
            <path d="M 4 8 Q 6 7 8 8" stroke="#FFFFFF" strokeWidth="0.3" fill="none">
              <animate attributeName="d" values="M 4 8 Q 6 7 8 8; M 4 8 Q 6 9 8 8; M 4 8 Q 6 7 8 8" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M 24 6 Q 26 5 28 6" stroke="#FFFFFF" strokeWidth="0.3" fill="none">
              <animate attributeName="d" values="M 24 6 Q 26 5 28 6; M 24 6 Q 26 7 28 6; M 24 6 Q 26 5 28 6" dur="2.5s" repeatCount="indefinite" />
            </path>
          </g>
        </svg>
      </div>

      {/* Animated text */}
      <div className="flex flex-col">
        <span className={`font-serif text-lg font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-700 bg-clip-text text-transparent transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          Plein Air
        </span>
        <span className={`text-xs text-muted-foreground font-light transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
          Studio
        </span>
      </div>
    </div>
  );
};