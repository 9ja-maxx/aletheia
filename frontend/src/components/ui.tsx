'use client';

import React, { useEffect, useRef } from 'react';

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = 'var(--teal)' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 0.7s linear infinite' }}
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Icon: Close ───────────────────────────────────────────────────────────────
export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Icon: Chevron ─────────────────────────────────────────────────────────────
export function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Icon: External Link ───────────────────────────────────────────────────────
export function ExternalIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Icon: Shield (Verdict) ────────────────────────────────────────────────────
export function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Icon: Sword ───────────────────────────────────────────────────────────────
export function SwordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
  );
}

// ── Icon: Refresh ─────────────────────────────────────────────────────────────
export function RefreshIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

// ── Icon: Wallet ──────────────────────────────────────────────────────────────
export function WalletIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12.01" y2="12" />
    </svg>
  );
}

// ── Tooltip-style address truncation ─────────────────────────────────────────
export function AddrChip({ addr }: { addr: string }) {
  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  return (
    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }} title={addr}>
      {short}
    </span>
  );
}

// ── Status Badge for consensus phases ────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:            'badge-dim',
  PROPOSING:          'badge-violet',
  COMMITTING:         'badge-violet',
  REVEALING:          'badge-amber',
  ACCEPTED:           'badge-teal',
  FINALIZED:          'badge-teal',
  UNDETERMINED:       'badge-amber',
  CANCELED:           'badge-red',
  VALIDATORS_TIMEOUT: 'badge-red',
  LEADER_TIMEOUT:     'badge-red',
  TIMEOUT:            'badge-red',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'badge-dim';
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ── Toast Notification ────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
}

const TOAST_COLORS: Record<ToastVariant, { border: string; icon: string; label: string }> = {
  success: { border: 'rgba(34,197,94,0.35)', icon: '✦', label: 'var(--green)' },
  error:   { border: 'rgba(239,68,68,0.35)',  icon: '⊗', label: 'var(--red)' },
  info:    { border: 'rgba(56,217,192,0.35)', icon: '◈', label: 'var(--teal)' },
  warning: { border: 'rgba(245,158,11,0.35)', icon: '◉', label: 'var(--amber)' },
};

export function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  const t = TOAST_COLORS[variant];
  useEffect(() => {
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [onDismiss]);
  return (
    <div className="toast" style={{ borderColor: t.border }}>
      <span style={{ color: t.label, fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}>{t.icon}</span>
      <div style={{ flex: 1, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{message}</div>
      <button className="btn btn-ghost btn-icon" onClick={onDismiss} aria-label="Dismiss notification">
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

// ── Focus trap helper ─────────────────────────────────────────────────────────
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length) focusable[0].focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, []);
  return <div ref={ref}>{children}</div>;
}
