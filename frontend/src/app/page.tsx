'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Arena,
  clashThesis,
  EXPLORER,
  FAUCET,
  LedgerEvent,
  proposeThesis,
  Stats,
} from '@/lib/contract';
import { useContractData } from '@/hooks/useContractData';
import { useTransaction } from '@/hooks/useTransaction';
import { useWallet } from '@/hooks/useWallet';
import {
  AddrChip,
  CloseIcon,
  ExternalIcon,
  FocusTrap,
  RefreshIcon,
  ShieldIcon,
  Spinner,
  StatusBadge,
  SwordIcon,
  Toast,
  ToastVariant,
  WalletIcon,
} from '@/components/ui';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface ToastItem { id: number; message: string; variant: ToastVariant; }

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now();
    setToasts(p => [...p.slice(-4), { id, message, variant }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);
  return { toasts, push, dismiss };
}

// ─────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────
function AppHeader({
  stats, wallet,
}: {
  stats: Stats | null;
  wallet: ReturnType<typeof useWallet>;
}) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-dim)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 1.5rem' }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--teal), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldIcon size={18} />
          </div>
          <div>
            <h1 className="display-title" style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Aletheia
            </h1>
            <p className="label-caps" style={{ lineHeight: 1, marginTop: '2px' }}>Debate Arena · GenLayer</p>
          </div>
        </div>

        {/* Stats strip */}
        {stats && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {([
              ['Arenas', stats.arenas],
              ['Debates', stats.debates],
              ['Overthrows', stats.overthrows],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-bright)' }}>{val}</div>
                <div className="label-caps">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {wallet.address ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'var(--bg-raised)', border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: wallet.onChain ? 'var(--green)' : 'var(--amber)',
                boxShadow: wallet.onChain ? '0 0 6px var(--green)' : '0 0 6px var(--amber)',
              }} />
              <AddrChip addr={wallet.address} />
              {wallet.balance && (
                <span className="mono" style={{ color: 'var(--teal)', fontSize: '0.78rem' }}>
                  {wallet.balance} GEN
                </span>
              )}
              <button className="btn btn-ghost btn-icon" onClick={wallet.disconnect} aria-label="Disconnect wallet" style={{ width: 24, height: 24, marginLeft: 2 }}>
                <CloseIcon size={12} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={wallet.connect}
              disabled={wallet.connecting || !wallet.hasProvider}
              id="connect-wallet-btn"
              aria-label="Connect MetaMask wallet"
            >
              {wallet.connecting ? <Spinner size={14} /> : <WalletIcon size={14} />}
              {wallet.connecting ? 'Connecting…' : wallet.hasProvider ? 'Connect Wallet' : 'Install MetaMask'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
//  ARENA SIDEBAR
// ─────────────────────────────────────────────
function ArenaSidebar({
  arenas, selected, onSelect, onPropose, loading,
}: {
  arenas: Arena[]; selected: Arena | null;
  onSelect: (a: Arena) => void; onPropose: () => void; loading: boolean;
}) {
  return (
    <aside className="panel" style={{ position: 'sticky', top: '73px', maxHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <h2 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', letterSpacing: '0.02em' }}>
          Active Arenas
        </h2>
        <span className="badge badge-teal">{arenas.length}</span>
      </div>

      <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }} onClick={onPropose} id="propose-thesis-btn">
          + Propose Thesis
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
        {loading && arenas.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '0.6rem', marginBottom: '0.3rem', borderRadius: 'var(--radius-md)' }}>
              <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 10, width: '50%' }} />
            </div>
          ))
        ) : arenas.length === 0 ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
            No arenas yet. Be first to propose a thesis.
          </p>
        ) : (
          arenas.map(arena => (
            <button
              key={arena.id}
              className={`arena-item ${selected?.id === arena.id ? 'selected' : ''}`}
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => onSelect(arena)}
              id={`arena-item-${arena.id}`}
            >
              <div className="truncate" style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-bright)', marginBottom: 3 }}>
                {arena.topic}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge badge-dim" style={{ fontSize: '0.66rem' }}>
                  {arena.clashes} clash{arena.clashes !== 1 ? 'es' : ''}
                </span>
                <span className="badge badge-dim" style={{ fontSize: '0.66rem' }}>
                  {arena.defenses} defense{arena.defenses !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
//  ARENA DETAIL VIEW
// ─────────────────────────────────────────────
function ArenaDetail({
  arena, walletAddr, onClash,
}: {
  arena: Arena | null; walletAddr: string | null; onClash: (a: Arena) => void;
}) {
  if (!arena) {
    return (
      <div className="panel flex-center" style={{ minHeight: 400, flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>⚖️</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select an arena from the sidebar to view its debate history.</p>
      </div>
    );
  }

  const canClash = !!walletAddr && walletAddr.toLowerCase() !== arena.proponent.toLowerCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Arena header card */}
      <div className="panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <p className="label-caps" style={{ marginBottom: '0.25rem' }}>Topic</p>
            <h2 className="display-title" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{arena.topic}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'flex-start' }}>
            <span className="badge badge-teal">Live</span>
            {canClash && (
              <button className="btn btn-secondary" onClick={() => onClash(arena)} id={`clash-btn-${arena.id}`}>
                <SwordIcon size={14} />
                Clash
              </button>
            )}
          </div>
        </div>

        {/* Current thesis box */}
        <div style={{
          background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-soft)', padding: '1rem',
        }}>
          <p className="label-caps" style={{ marginBottom: '0.5rem' }}>Current Thesis</p>
          <p style={{ color: 'var(--text-bright)', lineHeight: 1.65, marginBottom: '0.75rem' }}>
            {arena.claim}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="label-caps">Proponent</span>
              <AddrChip addr={arena.proponent} />
            </div>
            {arena.evidence_url && (
              <a
                href={arena.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ fontSize: '0.76rem', padding: '0.2rem 0.5rem', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
              >
                Evidence <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Progression history */}
      {arena.progression.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>Progression History</h3>
            <span className="badge badge-dim">{arena.progression.length} entries</span>
          </div>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {arena.progression.map((entry, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-deep)',
                border: `1px solid ${entry.toppled_by ? 'rgba(239,68,68,0.2)' : 'var(--border-dim)'}`,
                borderRadius: 'var(--radius-md)', padding: '0.875rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`badge ${entry.toppled_by ? 'badge-red' : 'badge-teal'}`} style={{ fontSize: '0.68rem' }}>
                    {entry.toppled_by ? 'OVERTHROWN' : 'DEFENDED'}
                  </span>
                  <span className="label-caps">Stage {entry.stage}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    margin: {entry.margin}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{entry.claim}</p>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    by <AddrChip addr={entry.proponent} />
                  </span>
                  {entry.toppled_by && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--red)' }}>
                      overthrown by <AddrChip addr={entry.toppled_by} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  LEDGER PANEL (right rail)
// ─────────────────────────────────────────────
function LedgerPanel({ ledger, loading }: { ledger: LedgerEvent[]; loading: boolean }) {
  return (
    <aside className="panel" style={{ position: 'sticky', top: '73px', maxHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <h2 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>Duel Ledger</h2>
        <span className="badge badge-violet">{ledger.length}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0.625rem' }}>
        {loading && ledger.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '0.6rem', marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ height: 11, width: '65%', marginBottom: 5 }} />
              <div className="skeleton" style={{ height: 10, width: '90%', marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: '40%' }} />
            </div>
          ))
        ) : ledger.length === 0 ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem', padding: '1rem', textAlign: 'center' }}>
            No duels recorded yet.
          </p>
        ) : (
          ledger.map((ev, idx) => {
            const isOverthrow = ev.result === 'OVERTHROW';
            return (
              <div key={idx} style={{
                padding: '0.75rem', marginBottom: '0.4rem',
                background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
                border: `1px solid ${isOverthrow ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.12)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span className={`badge ${isOverthrow ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                    {ev.result}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                    Δ{ev.margin}
                  </span>
                </div>
                <p className="truncate" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {ev.topic}
                </p>
                {ev.reasoning && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ev.reasoning}
                  </p>
                )}
                <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>by</span>
                  <AddrChip addr={ev.opponent} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
//  CONSENSUS STATUS PANEL
// ─────────────────────────────────────────────
function ConsensusBanner({ txState, onClose }: {
  txState: ReturnType<typeof useTransaction>['state'];
  onClose: () => void;
}) {
  const { phase, hash, liveStatus, draft, error } = txState;
  if (phase === 'idle') return null;

  const isActive = phase === 'wallet' || phase === 'submitted' || phase === 'consensus';
  const isDone   = phase === 'confirmed';
  const isError  = phase === 'error';

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, minWidth: 340, maxWidth: 500, width: '90vw',
    }}>
      <div className={`panel-raised verdict-box`} style={{
        padding: '1.25rem 1.5rem',
        borderColor: isError ? 'rgba(239,68,68,0.3)' : isDone ? 'rgba(56,217,192,0.3)' : 'var(--border-soft)',
        boxShadow: isError ? '0 0 30px rgba(239,68,68,0.12)' : isDone ? '0 0 30px rgba(56,217,192,0.15)' : 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isActive && <Spinner size={15} />}
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-bright)' }}>
              {phase === 'wallet' && 'Awaiting Wallet Signature…'}
              {phase === 'submitted' && 'Transaction Broadcast'}
              {phase === 'consensus' && 'Validator Consensus in Progress'}
              {phase === 'confirmed' && '⚡ Duel Resolved'}
              {phase === 'error' && '✕ Transaction Failed'}
            </span>
          </div>
          {!isActive && (
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ width: 28, height: 28 }} aria-label="Close status">
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        {phase === 'consensus' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <StatusBadge status={liveStatus} />
          </div>
        )}

        {draft && (
          <div style={{
            background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-soft)', padding: '0.875rem', marginBottom: '0.75rem',
          }}>
            <p className="label-caps" style={{ marginBottom: '0.4rem' }}>Arbiter Preview</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: draft.reasoning ? '0.5rem' : 0 }}>
              <span className={`badge ${draft.verdict === 'OVERTHROW' ? 'badge-red' : draft.verdict === 'DEFEND' ? 'badge-green' : 'badge-dim'}`}>
                {draft.verdict}
              </span>
              {draft.margin !== undefined && (
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>margin: {draft.margin}</span>
              )}
            </div>
            {draft.reasoning && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{draft.reasoning}</p>
            )}
          </div>
        )}

        {isError && error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.5 }}>{error}</p>
        )}

        {hash && (
          <a
            href={`${EXPLORER}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--teal)' }}
          >
            View on Explorer <ExternalIcon size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROPOSE MODAL
// ─────────────────────────────────────────────
interface ProposeModalProps {
  onClose: () => void;
  onSubmit: (topic: string, claim: string, url: string) => void;
  busy: boolean;
}

function ProposeModal({ onClose, onSubmit, busy }: ProposeModalProps) {
  const [topic, setTopic] = useState('');
  const [claim, setClaim] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!topic.trim()) e.topic = 'Topic is required.';
    if (topic.trim().length > 200) e.topic = 'Topic must be under 200 characters.';
    if (!claim.trim()) e.claim = 'Opening claim is required.';
    if (claim.trim().length > 1000) e.claim = 'Claim must be under 1000 characters.';
    if (!url.trim()) e.url = 'Evidence URL is required.';
    try { new URL(url.trim()); } catch { if (url.trim()) e.url = 'Must be a valid URL (https://…).'; }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(topic.trim(), claim.trim(), url.trim());
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="propose-modal-title">
      <FocusTrap>
        <div className="modal-box">
          <div className="modal-header">
            <div>
              <h2 id="propose-modal-title" className="display-title" style={{ fontSize: '1.15rem' }}>Propose a Thesis</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Open an arena for your claim. Evidence will be fetched on-chain.
              </p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy} aria-label="Close propose dialog">
              <CloseIcon />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="field-group">
                <label className="field-label" htmlFor="propose-topic">Debate Topic</label>
                <input
                  id="propose-topic"
                  className="field-input"
                  placeholder="e.g. AI will replace 50% of white-collar jobs by 2035"
                  value={topic}
                  onChange={e => { setTopic(e.target.value); setErrors(p => ({ ...p, topic: '' })); }}
                  maxLength={220}
                  disabled={busy}
                />
                {errors.topic && <span className="field-error-msg">{errors.topic}</span>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="propose-claim">Opening Claim</label>
                <textarea
                  id="propose-claim"
                  className="field-textarea"
                  placeholder="State your factual claim with precision and clarity…"
                  value={claim}
                  onChange={e => { setClaim(e.target.value); setErrors(p => ({ ...p, claim: '' })); }}
                  maxLength={1100}
                  disabled={busy}
                />
                {errors.claim && <span className="field-error-msg">{errors.claim}</span>}
                <span className="field-hint">{claim.length}/1000 characters</span>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="propose-url">Evidence URL</label>
                <input
                  id="propose-url"
                  className="field-input"
                  type="url"
                  placeholder="https://example.com/supporting-article"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setErrors(p => ({ ...p, url: '' })); }}
                  disabled={busy}
                />
                {errors.url && <span className="field-error-msg">{errors.url}</span>}
                <span className="field-hint">GenLayer validators will fetch this URL on-chain to ground adjudication.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy} id="propose-submit-btn">
                {busy ? <><Spinner size={14} /> Proposing…</> : 'Propose Thesis'}
              </button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CLASH MODAL
// ─────────────────────────────────────────────
interface ClashModalProps {
  arena: Arena;
  onClose: () => void;
  onSubmit: (arenaId: string, claim: string, url: string) => void;
  busy: boolean;
}

function ClashModal({ arena, onClose, onSubmit, busy }: ClashModalProps) {
  const [claim, setClaim] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!claim.trim()) e.claim = 'Contender claim is required.';
    if (claim.trim().length > 1000) e.claim = 'Claim must be under 1000 characters.';
    if (!url.trim()) e.url = 'Evidence URL is required.';
    try { new URL(url.trim()); } catch { if (url.trim()) e.url = 'Must be a valid URL (https://…).'; }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(arena.id, claim.trim(), url.trim());
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="clash-modal-title">
      <FocusTrap>
        <div className="modal-box">
          <div className="modal-header">
            <div>
              <h2 id="clash-modal-title" className="display-title" style={{ fontSize: '1.15rem' }}>Challenge the Thesis</h2>
              <p className="truncate" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 380 }}>
                Arena: {arena.topic}
              </p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy} aria-label="Close challenge dialog">
              <CloseIcon />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Incumbent thesis preview */}
              <div style={{
                background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-soft)', padding: '0.875rem',
              }}>
                <p className="label-caps" style={{ marginBottom: '0.35rem' }}>Current Thesis (Incumbent)</p>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {arena.claim.length > 240 ? arena.claim.slice(0, 240) + '…' : arena.claim}
                </p>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="clash-claim">Your Contending Claim</label>
                <textarea
                  id="clash-claim"
                  className="field-textarea"
                  placeholder="State your factual counter-argument grounded in evidence…"
                  value={claim}
                  onChange={e => { setClaim(e.target.value); setErrors(p => ({ ...p, claim: '' })); }}
                  maxLength={1100}
                  disabled={busy}
                />
                {errors.claim && <span className="field-error-msg">{errors.claim}</span>}
                <span className="field-hint">{claim.length}/1000 characters</span>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="clash-url">Your Evidence URL</label>
                <input
                  id="clash-url"
                  className="field-input"
                  type="url"
                  placeholder="https://example.com/your-evidence"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setErrors(p => ({ ...p, url: '' })); }}
                  disabled={busy}
                />
                {errors.url && <span className="field-error-msg">{errors.url}</span>}
                <span className="field-hint">
                  Validators will fetch both URLs on-chain and the arbiter will adjudicate on retrieved content.
                </span>
              </div>

              <div style={{ background: 'var(--amber-glow)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--amber)', lineHeight: 1.5 }}>
                  ⚠️ Validator consensus requires gas fees. Ensure your wallet has GEN tokens.{' '}
                  <a href={FAUCET} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Request from faucet</a>.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-danger" disabled={busy} id="clash-submit-btn">
                {busy ? <><Spinner size={14} color="var(--red)" /> Clashing…</> : <><SwordIcon size={14} /> Launch Duel</>}
              </button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
}

// ─────────────────────────────────────────────
//  WALLET GATE MESSAGE
// ─────────────────────────────────────────────
function WalletGate({ wallet, onConnect }: { wallet: ReturnType<typeof useWallet>; onConnect: () => void }) {
  return (
    <div className="panel" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>⚔️</div>
      <div>
        <h2 className="display-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Connect to Enter the Arena</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto' }}>
          To propose or challenge theses, connect your MetaMask wallet and switch to GenLayer StudioNet.
        </p>
      </div>
      <button className="btn btn-primary" onClick={onConnect} disabled={wallet.connecting || !wallet.hasProvider} id="gate-connect-btn">
        {wallet.connecting ? <Spinner size={14} /> : <WalletIcon size={14} />}
        {wallet.hasProvider ? 'Connect MetaMask' : 'Install MetaMask'}
      </button>
      {wallet.error && <p style={{ fontSize: '0.8rem', color: 'var(--red)' }}>{wallet.error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  PAGE ROOT
// ─────────────────────────────────────────────
export default function HomePage() {
  const wallet = useWallet();
  const { arenas, ledger, stats, loading, error: dataError, refreshData, setIsBusy } = useContractData();
  const { state: txState, runTx, resetTx } = useTransaction();
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [clashTarget, setClashTarget] = useState<Arena | null>(null);

  const txBusy = txState.phase === 'wallet' || txState.phase === 'submitted' || txState.phase === 'consensus';

  // Derive sorted arenas (newest id first — ids are numeric strings)
  const sortedArenas = useMemo(() => {
    return [...arenas].sort((a, b) => Number(b.id) - Number(a.id));
  }, [arenas]);

  const handlePropose = useCallback(async (topic: string, claim: string, url: string) => {
    if (!wallet.address) return;
    setShowPropose(false);
    setIsBusy(true);
    await runTx({
      account: wallet.address,
      send: (client) => proposeThesis(client, topic, claim, url),
      onConfirmed: async () => {
        pushToast('Thesis proposed! Your arena is now live.', 'success');
        await refreshData();
        setIsBusy(false);
      },
      onBusy: setIsBusy,
    });
    if (txState.phase === 'error') {
      pushToast('Thesis proposal failed. See status panel for details.', 'error');
      setIsBusy(false);
    }
  }, [wallet.address, runTx, refreshData, setIsBusy, pushToast, txState.phase]);

  const handleClash = useCallback(async (arenaId: string, claim: string, url: string) => {
    if (!wallet.address) return;
    setClashTarget(null);
    setIsBusy(true);
    await runTx({
      account: wallet.address,
      send: (client) => clashThesis(client, arenaId, claim, url),
      onConfirmed: async (_, draft) => {
        const verdict = draft?.verdict ?? 'DECIDED';
        const msg = verdict === 'OVERTHROW'
          ? '⚡ The incumbent thesis has been OVERTHROWN! You are the new proponent.'
          : '🛡 The incumbent thesis was successfully DEFENDED.';
        pushToast(msg, verdict === 'OVERTHROW' ? 'success' : 'warning');
        await refreshData();
        setIsBusy(false);
      },
      onBusy: setIsBusy,
    });
    if (txState.phase === 'error') {
      pushToast('Clash submission failed. See status panel for details.', 'error');
      setIsBusy(false);
    }
  }, [wallet.address, runTx, refreshData, setIsBusy, pushToast, txState.phase]);

  const openClash = useCallback((arena: Arena) => {
    if (!wallet.address) { pushToast('Connect your wallet to challenge a thesis.', 'warning'); return; }
    setClashTarget(arena);
  }, [wallet.address, pushToast]);

  return (
    <>
      <AppHeader stats={stats} wallet={wallet} />

      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 65px)', paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <div className="container">
          {/* Error banner */}
          {dataError && (
            <div style={{
              background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--red)' }}>{dataError}</p>
              <button className="btn btn-ghost" onClick={refreshData} style={{ fontSize: '0.8rem' }}>
                <RefreshIcon size={13} /> Retry
              </button>
            </div>
          )}

          <div className="layout-cols">
            {/* Left: Arena list */}
            <ArenaSidebar
              arenas={sortedArenas}
              selected={selectedArena}
              onSelect={setSelectedArena}
              onPropose={() => {
                if (!wallet.address) { pushToast('Connect your wallet first.', 'warning'); return; }
                setShowPropose(true);
              }}
              loading={loading}
            />

            {/* Center: Arena detail / wallet gate */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!wallet.address ? (
                <WalletGate wallet={wallet} onConnect={wallet.connect} />
              ) : (
                <ArenaDetail arena={selectedArena} walletAddr={wallet.address} onClash={openClash} />
              )}
            </section>

            {/* Right: Ledger */}
            <LedgerPanel ledger={ledger} loading={loading} />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showPropose && (
        <ProposeModal
          onClose={() => setShowPropose(false)}
          onSubmit={handlePropose}
          busy={txBusy}
        />
      )}
      {clashTarget && (
        <ClashModal
          arena={clashTarget}
          onClose={() => setClashTarget(null)}
          onSubmit={handleClash}
          busy={txBusy}
        />
      )}

      {/* Consensus status */}
      <ConsensusBanner txState={txState} onClose={resetTx} />

      {/* Toast stack */}
      <div style={{
        position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 70,
        display: 'flex', flexDirection: 'column', gap: '0.625rem', alignItems: 'flex-end',
      }} aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
