export function SubfloLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <defs>
        <linearGradient id="sl" x1="80" y1="80" x2="432" y2="432" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7a73ff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#sl)" />
      <path
        d="M320 148C320 148 360 148 360 188C360 228 280 228 256 228C232 228 152 228 152 268C152 308 192 308 232 308C272 308 360 308 360 348C360 388 280 388 256 388C232 388 152 388 152 348"
        stroke="white"
        strokeWidth="40"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function SubfloMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <path
        d="M320 108C320 108 380 108 380 168C380 228 280 228 256 228C232 228 132 228 132 288C132 348 192 348 232 348C272 348 380 348 380 408C380 448 280 448 256 448C232 448 132 448 132 388"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
