/** Kanbot mark: three board columns + an amber AI spark. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Kanbot">
      <defs>
        <linearGradient id="kb-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5663ff" />
          <stop offset="1" stopColor="#2a33c2" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#kb-mark)" />
      <rect x="8" y="13" width="6" height="18" rx="2" fill="#fff" opacity=".95" />
      <rect x="17" y="17" width="6" height="14" rx="2" fill="#fff" opacity=".75" />
      <rect x="26" y="21" width="6" height="10" rx="2" fill="#fff" opacity=".55" />
      <path className="logo-spark" d="M30 4.5l1.5 3.9 3.9 1.5-3.9 1.5L30 15.3l-1.5-3.9-3.9-1.5 3.9-1.5z" fill="#ffb224" />
    </svg>
  );
}

export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={size} />
      <span className="logo-word" dir="ltr">
        Kanbot
      </span>
    </span>
  );
}
