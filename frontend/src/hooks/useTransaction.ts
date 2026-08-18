'use client';

import { useCallback, useRef, useState } from 'react';
import {
  LeaderDraft,
  makeWalletClient,
  pollUntilDecided,
  WalletClient,
} from '@/lib/contract';

export type TxPhase = 'idle' | 'wallet' | 'submitted' | 'consensus' | 'confirmed' | 'error';

export interface TxState {
  phase: TxPhase;
  hash: `0x${string}` | null;
  liveStatus: string;
  draft: LeaderDraft | null;
  error: string | null;
}

const INITIAL_STATE: TxState = {
  phase: 'idle',
  hash: null,
  liveStatus: '',
  draft: null,
  error: null,
};

// Formats error messages into human-readable user notices.
function formatFriendlyError(e: unknown): string {
  const errMsg = String((e as { message?: string })?.message ?? e);
  if (/LackOfFundForMaxFee|insufficient funds/i.test(errMsg)) {
    return 'Your wallet lacks native GEN tokens required for validator consensus fees. Request funds at the faucet.';
  }
  if (/reject|denied|4001/i.test(errMsg)) {
    return 'Transaction signature request declined.';
  }
  if (/rate limit|429|too many/i.test(errMsg)) {
    return 'Network is highly congested; your transaction may still be queueing in the mempool.';
  }
  if (/network|fetch|timeout/i.test(errMsg)) {
    return 'Network RPC timeout occurred. Check your internet connection.';
  }
  return 'The transaction failed to complete. Please check the explorer or try again.';
}

export interface RunTxOptions {
  account: `0x${string}`;
  send: (client: WalletClient) => Promise<unknown>;
  onConfirmed?: (status: string, draft: LeaderDraft | null) => void;
  onBusy?: (busy: boolean) => void;
}

export function useTransaction() {
  const [state, setState] = useState<TxState>(INITIAL_STATE);
  const isSubmitting = useRef(false);

  const resetTx = useCallback(() => setState(INITIAL_STATE), []);

  const runTx = useCallback(async (opts: RunTxOptions) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    opts.onBusy?.(true);
    setState({ ...INITIAL_STATE, phase: 'wallet' });

    try {
      const client = makeWalletClient(opts.account);
      const txHash = (await opts.send(client)) as `0x${string}`;
      setState((s) => ({ ...s, phase: 'submitted', hash: txHash }));

      setState((s) => ({ ...s, phase: 'consensus', liveStatus: 'PENDING' }));
      const { status, draft } = await pollUntilDecided(client, txHash, (currentStatus, currentDraft) => {
        setState((s) => ({ ...s, liveStatus: currentStatus, draft: currentDraft }));
      });

      if (status === 'ACCEPTED' || status === 'FINALIZED') {
        setState((s) => ({ ...s, phase: 'confirmed', liveStatus: status, draft }));
        opts.onConfirmed?.(status, draft);
      } else if (status === 'UNDETERMINED') {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'Validator jury could not reach equivalence consensus on this duel.',
        }));
      } else {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'Transaction timed out. Check explorer for final confirmation status.',
        }));
      }
    } catch (e) {
      setState((s) => ({ ...s, phase: 'error', error: formatFriendlyError(e) }));
    } finally {
      isSubmitting.current = false;
      opts.onBusy?.(false);
    }
  }, []);

  return { state, runTx, resetTx };
}
