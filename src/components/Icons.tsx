import React from 'react';
import { ClassId, ElementType } from '../game/types';

export const TitleLockupSvg: React.FC = () => (
  <svg
    viewBox="0 0 520 118"
    className="w-full max-w-[460px] h-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.75)]"
    aria-label="Sylvan Ward"
  >
    <defs>
      <linearGradient id="goldLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="48%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
    </defs>
    {/* Subtle ward crest emblem */}
    <path
      d="M260 6 L278 24 L260 44 L242 24 Z"
      fill="none"
      stroke="url(#goldLeafGrad)"
      strokeWidth="2"
    />
    <path d="M260 12 L270 24 L260 36 L250 24 Z" fill="#eab308" fillOpacity="0.24" />
    <line x1="90" y1="24" x2="226" y2="24" stroke="#d4af6a" strokeOpacity="0.4" strokeWidth="1" />
    <line x1="294" y1="24" x2="430" y2="24" stroke="#d4af6a" strokeOpacity="0.4" strokeWidth="1" />
    <text
      x="260"
      y="88"
      textAnchor="middle"
      fill="url(#goldLeafGrad)"
      fontFamily="Cinzel, Georgia, serif"
      fontWeight="700"
      fontSize="50"
      letterSpacing="6"
    >
      SYLVAN WARD
    </text>
  </svg>
);

export const ClassEmblem: React.FC<{ classId: ClassId; size?: number }> = ({
  classId,
  size = 24,
}) => {
  if (classId === 'warrior') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
        <path d="M12 7v10M8.5 11.5h7" />
      </svg>
    );
  }
  if (classId === 'archer') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 19c4-4 10-10 14-14" />
        <path d="M14 5h5v5" />
        <path d="M6 7c2.5 5 6.5 9 11 11" />
      </svg>
    );
  }
  if (classId === 'mage') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="9" r="4" />
        <path d="M12 2v2M12 14v8M5 9H3M21 9h-2M7 4.5l1.5 1.5M17 4.5L15.5 6" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3a6 6 0 0 0-6 6v3l-1.5 2.5h15L18 12V9a6 6 0 0 0-6-6z" />
      <circle cx="9.5" cy="9.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor" />
      <path d="M9 17.5v3M12 17.5v3M15 17.5v3" />
    </svg>
  );
};

export const ElementEmblem: React.FC<{ element: ElementType; size?: number }> = ({
  element,
  size = 16,
}) => {
  if (element === 'water') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3s6 6.8 6 11a6 6 0 1 1-12 0c0-4.2 6-11 6-11z" />
      </svg>
    );
  }
  if (element === 'fire') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2c2 3.5 5 5.5 5 10a5 5 0 1 1-10 0c0-2.5 1-4.5 2.5-6.2C10 8 11.5 8 12 2z" />
      </svg>
    );
  }
  if (element === 'lightning') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }
  if (element === 'wind') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h8" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 15H4L12 3z" />
    </svg>
  );
};
