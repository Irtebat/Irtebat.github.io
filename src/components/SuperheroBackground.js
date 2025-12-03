import React, { useEffect, useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export default function SuperheroBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM) {
      const handleScroll = () => {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (!ExecutionEnvironment.canUseDOM) return null;

  // Calculate positions
  // We want them to appear as user scrolls down
  
  // Hero 1 (Left): Starts off-screen left (-300px), flies in to right
  // Speed: 0.5px per scroll pixel
  const hero1X = -300 + (scrollY * 1.2);
  
  // Hero 2 (Right): Starts off-screen right, flies in to left
  const hero2X = 300 - (scrollY * 0.8);
  
  // Hero 3 (Bottom): Rising star
  const hero3Y = 200 - (scrollY * 0.5);

  // Cloud positions (drifting)
  const cloud1X = (scrollY * 0.2) % window.innerWidth;
  const cloud2X = window.innerWidth - ((scrollY * 0.3) % window.innerWidth);

  return (
    <div className="superhero-bg-layer" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0, 
      overflow: 'hidden'
    }}>
      
      {/* DECORATIVE DOTS/STARS LAYER */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.1 }}>
         <svg width="100%" height="100%">
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
               <circle cx="2" cy="2" r="2" fill="#000" />
            </pattern>
            {/* Random stars positioned absolutely */}
            <circle cx="10%" cy="20%" r="4" fill="#fbbf24" style={{ transform: `translateY(${-scrollY * 0.1}px)` }} />
            <circle cx="85%" cy="15%" r="6" fill="#fbbf24" style={{ transform: `translateY(${-scrollY * 0.15}px)` }} />
            <circle cx="50%" cy="60%" r="3" fill="#fbbf24" style={{ transform: `translateY(${-scrollY * 0.05}px)` }} />
            
            {/* Action Lines */}
            <path d="M 50 50 L 100 100" stroke="#000" strokeWidth="2" opacity="0.2" style={{ transform: `translateY(${-scrollY * 0.5}px)` }} />
            <path d="M 90% 80% L 85% 85%" stroke="#000" strokeWidth="2" opacity="0.2" style={{ transform: `translateY(${-scrollY * 0.5}px)` }} />
         </svg>
      </div>

      {/* CLOUDS */}
      <div style={{ position: 'absolute', top: '10%', left: -100, transform: `translateX(${cloud1X}px)`, opacity: 0.4 }}>
        <svg width="100" height="60" viewBox="0 0 100 60" fill="#e2e8f0">
           <path d="M10 40 Q20 10 50 30 Q70 0 90 30 Q100 40 90 50 L10 50 Q0 40 10 40 Z" />
        </svg>
      </div>
      
      <div style={{ position: 'absolute', top: '60%', left: 0, transform: `translateX(${cloud2X}px)`, opacity: 0.3 }}>
        <svg width="120" height="70" viewBox="0 0 120 70" fill="#cbd5e1">
           <path d="M10 50 Q30 20 60 40 Q80 10 110 40 Q120 50 110 60 L10 60 Q-10 50 10 50 Z" />
        </svg>
      </div>

      {/* HERO 1: The Blue Flyer (Top Left) */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: 0,
        transform: `translateX(${Math.min(hero1X, window.innerWidth + 300)}px)`, // Flies across
        opacity: 0.2,
        transition: 'transform 0.1s cubic-bezier(0,0,0.2,1)' // Smooth out slightly
      }}>
        <svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 100 C 50 80, 100 80, 150 100 L 250 120 L 180 150 C 120 160, 50 140, 20 100 Z" fill="#2563eb" />
          <circle cx="250" cy="120" r="15" fill="#2563eb" />
          <path d="M20 100 Q 0 110 10 130 L 60 120 Z" fill="#1d4ed8" /> {/* Cape tail */}
        </svg>
      </div>

      {/* HERO 2: The Red Zoom (Middle Right) */}
      <div style={{
        position: 'absolute',
        top: '45%',
        right: 0,
        transform: `translateX(${Math.max(hero2X, -window.innerWidth - 300)}px)`,
        opacity: 0.2,
      }}>
        <svg width="400" height="150" viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M380 75 L 300 50 L 100 75 L 300 100 Z" fill="#ef4444" />
          <path d="M380 75 L 350 60 L 350 90 Z" fill="#b91c1c" />
          {/* Speed lines */}
          <rect x="50" y="60" width="100" height="5" fill="#ef4444" opacity="0.5"/>
          <rect x="20" y="85" width="150" height="3" fill="#ef4444" opacity="0.5"/>
        </svg>
      </div>

      {/* HERO 3: The Rising Green (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '10%',
        transform: `translateY(${hero3Y}px)`,
        opacity: 0.15,
      }}>
        <svg width="200" height="300" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 20 L 140 100 L 100 250 L 60 100 Z" fill="#10b981" />
          <circle cx="100" cy="40" r="20" fill="#059669" />
        </svg>
      </div>

      {/* COMIC TEXT: POW! */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: `translate(-50%, ${-scrollY * 0.2}px) rotate(-15deg)`,
        opacity: Math.min(1, scrollY / 400) * 0.2, // Fades in
      }}>
         <svg width="200" height="150" viewBox="0 0 200 150" fill="none">
            <path d="M100 75 L 130 20 L 150 60 L 190 40 L 170 90 L 200 130 L 140 110 L 100 150 L 80 100 L 20 120 L 60 70 L 10 30 L 70 50 Z" fill="#f59e0b" stroke="#000" strokeWidth="3"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="40" fontFamily="Bangers" stroke="#000" strokeWidth="2">POW!</text>
         </svg>
      </div>
      
      {/* COMIC TEXT: ZAP! (Appears later) */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        transform: `translate(0, ${-scrollY * 0.3}px) rotate(10deg)`,
        opacity: Math.max(0, Math.min(1, (scrollY - 300) / 400)) * 0.2,
      }}>
         <svg width="150" height="100" viewBox="0 0 150 100" fill="none">
            <path d="M10 40 L 60 10 L 40 40 L 90 30 L 60 60 L 110 50 L 80 90 L 30 60 Z" fill="#ef4444" stroke="#000" strokeWidth="3"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="30" fontFamily="Bangers" stroke="#000" strokeWidth="2">ZAP!</text>
         </svg>
      </div>

    </div>
  );
}
