/** Wordmark + meter glyph. The mark is a meter: three bars of metered
 *  capacity, the last one settled in the payment accent. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden className="shrink-0">
      <rect x="0.6" y="0.6" width="24.8" height="24.8" rx="7" fill="var(--color-elev)" stroke="var(--color-line-2)" />
      <rect x="6" y="15" width="3.5" height="5" rx="1.2" fill="var(--color-cap)" opacity="0.55" />
      <rect x="11.25" y="11" width="3.5" height="9" rx="1.2" fill="var(--color-cap)" opacity="0.8" />
      <rect x="16.5" y="6" width="3.5" height="14" rx="1.2" fill="var(--color-pay)" />
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span className="font-display text-[17px] font-semibold tracking-tight text-fg">IdleProxy</span>
    </span>
  );
}
