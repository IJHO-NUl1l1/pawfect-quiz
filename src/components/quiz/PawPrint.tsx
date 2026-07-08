/** 발바닥 SVG — 선택지 호버/선택 인터랙션용 (색은 currentColor) */
export default function PawPrint({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <ellipse cx="12" cy="16.5" rx="5.2" ry="4.2" />
      <ellipse cx="4.8" cy="11" rx="2.3" ry="3" transform="rotate(-22 4.8 11)" />
      <ellipse cx="9.4" cy="7.4" rx="2.3" ry="3.1" transform="rotate(-8 9.4 7.4)" />
      <ellipse cx="14.6" cy="7.4" rx="2.3" ry="3.1" transform="rotate(8 14.6 7.4)" />
      <ellipse cx="19.2" cy="11" rx="2.3" ry="3" transform="rotate(22 19.2 11)" />
    </svg>
  );
}
