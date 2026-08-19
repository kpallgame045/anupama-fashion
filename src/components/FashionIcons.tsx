import React from "react";

export const DressIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Dress silhouette line art */}
    <path d="M9 3L11 7L7 21H17L13 7L15 3C15 3 13.5 4 12 4C10.5 4 9 3 9 3Z" />
    <path d="M12 4V7" />
    <path d="M9 13H15" strokeDasharray="1 1" />
  </svg>
);

export const HangerIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Hanger line art */}
    <path d="M12 7C13.1046 7 14 6.10457 14 5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5" />
    <path d="M12 7V10L3 16V18H21V16L12 10Z" />
  </svg>
);

export const TwoPieceIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Two-piece top & skirt outline */}
    <path d="M8 4L12 6L16 4V9H8V4Z" />
    <path d="M7 12H17L18 20H6L7 12Z" />
  </svg>
);

export const FabricSparkleIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Diamond sparkle emblem */}
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

export const HandbagOutlineIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 8V6C8 4.34315 9.34315 3 11 3H13C14.6569 3 16 4.34315 16 6V8" />
    <path d="M4 8H20L19 21H5L4 8Z" />
  </svg>
);

export const GoldFlourishDivider = ({ className = "w-48 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12H75" stroke="url(#gold_grad)" strokeWidth="1" strokeLinecap="round" />
    <path d="M125 12H190" stroke="url(#gold_grad)" strokeWidth="1" strokeLinecap="round" />
    <circle cx="85" cy="12" r="2" fill="#D4AF37" />
    <polygon points="100,5 107,12 100,19 93,12" fill="#D4AF37" />
    <circle cx="115" cy="12" r="2" fill="#D4AF37" />
    <defs>
      <linearGradient id="gold_grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
      </linearGradient>
    </defs>
  </svg>
);
