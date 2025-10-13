export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className={`block mx-auto ${className ?? ''}`}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="10" fill="#10B981" />
      <path d="M12 28c2-4 6-6 10-6s8 2 10 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20c1.5-2 4-3 6-3s4.5 1 6 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="16" r="3" fill="#fff" />
    </svg>
  );
}