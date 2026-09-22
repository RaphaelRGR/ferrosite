/**
 * Locomotiva a vapor em silhueta (decorativa) com puffs de vapor em CSS.
 * Usada no rodapé e no easter egg; `running` liga as rodas.
 */
export function Locomotive({ className = "", running = false, steam = true }: { className?: string; running?: boolean; steam?: boolean }) {
  return (
    <span aria-hidden="true" className={`loco relative inline-block ${running ? "loco-run" : ""} ${className}`}>
      {steam && (
        <span className="steam absolute left-[20%] top-0 block h-1 w-1">
          <i />
          <i />
          <i />
        </span>
      )}
      <svg viewBox="0 0 96 40" fill="currentColor" className="block h-auto w-full">
        <rect x="6" y="16" width="34" height="14" rx="2" />
        <rect x="40" y="8" width="26" height="22" rx="2" />
        <rect x="66" y="12" width="20" height="18" rx="2" />
        <rect x="18" y="6" width="6" height="12" rx="1" />
        <rect x="46" y="12" width="6" height="6" rx="1" fill="var(--bg-surface)" />
        <rect x="54" y="12" width="6" height="6" rx="1" fill="var(--bg-surface)" />
        <rect x="86" y="24" width="8" height="6" rx="1" />
        <rect x="0" y="26" width="8" height="4" rx="1" />
        <g className="loco-wheel"><circle cx="16" cy="32" r="5" /><rect x="15.2" y="28.2" width="1.6" height="7.6" fill="var(--bg-surface)" opacity="0.8" /></g>
        <g className="loco-wheel"><circle cx="30" cy="32" r="5" /><rect x="29.2" y="28.2" width="1.6" height="7.6" fill="var(--bg-surface)" opacity="0.8" /></g>
        <g className="loco-wheel"><circle cx="50" cy="33" r="6" /><rect x="49.2" y="28.2" width="1.6" height="9.6" fill="var(--bg-surface)" opacity="0.8" /></g>
        <g className="loco-wheel"><circle cx="66" cy="33" r="6" /><rect x="65.2" y="28.2" width="1.6" height="9.6" fill="var(--bg-surface)" opacity="0.8" /></g>
        <g className="loco-wheel"><circle cx="80" cy="34" r="4" /><rect x="79.2" y="31.2" width="1.6" height="5.6" fill="var(--bg-surface)" opacity="0.8" /></g>
        <rect x="0" y="38" width="96" height="2" rx="1" opacity="0.5" />
      </svg>
    </span>
  );
}
