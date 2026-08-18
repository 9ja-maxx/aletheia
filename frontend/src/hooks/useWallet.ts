'use client';

import { useCallback, useEffect, useState } from 'react';

// Configuration parameters to register and auto-switch to GenLayer StudioNet.
const NETWORK_PARAMS = {
  chainId: '0xF22F', // 61999 decimal
  chainName: 'GenLayer StudioNet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://explorer-studio.genlayer.com/'],
};
const NETWORK_CHAIN_ID_HEX = '0xf22f';

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getProvider(): EIP1193Provider | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ethereum?: EIP1193Provider }).ethereum ?? null;
}

export interface WalletState {
  address: `0x${string}` | null;
  chainId: string | null;
  balance: string | null;
  connecting: boolean;
  error: string | null;
  hasProvider: boolean;
  onChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

// Convert wei (as hex or big number) to string GEN with custom fraction precision.
function convertWeiToGen(hexStr: string, maxDecimals = 4): string {
  try {
    const rawVal = BigInt(hexStr);
    const wholeGen = rawVal / 10n ** 18n;
    const fractionalPart = (rawVal % 10n ** 18n)
      .toString()
      .padStart(18, '0')
      .slice(0, maxDecimals)
      .replace(/0+$/, '');
    return fractionalPart ? `${wholeGen}.${fractionalPart}` : wholeGen.toString();
  } catch {
    return '0';
  }
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);

  // Set provider presence on client-side render
  useEffect(() => {
    setHasProvider(!!getProvider());
  }, []);

  const refreshChain = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const activeId = (await provider.request({ method: 'eth_chainId' })) as string;
      setChainId(activeId);
    } catch {
      /* ignore view errors */
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !address) return;
    try {
      const hexBalance = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      setBalance(convertWeiToGen(hexBalance));
    } catch {
      /* ignore balance errors */
    }
  }, [address]);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('No Ethereum wallet extension detected.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const connectedAccounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!connectedAccounts || connectedAccounts.length === 0) throw new Error('No accounts retrieved');

      // Attempt to add StudioNet if not already configured in wallet
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_PARAMS],
        });
      } catch {
        /* chain might already exist */
      }

      // Prompt switch to StudioNet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: NETWORK_PARAMS.chainId }],
        });
      } catch {
        /* user may decline network switch */
      }

      setAddress(connectedAccounts[0] as `0x${string}`);
      await refreshChain();
    } catch (e) {
      const errMessage = String((e as { message?: string })?.message ?? e);
      if (/reject|denied|4001/i.test(errMessage)) {
        setError('Connection signature cancelled by user.');
      } else {
        setError('Failed to establish wallet connection.');
      }
    } finally {
      setConnecting(false);
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  // Listen to standard wallet event listeners
  useEffect(() => {
    const provider = getProvider();
    if (!provider || !provider.on) return;

    const handleAccounts = (...args: unknown[]) => {
      const activeAccs = args[0] as string[];
      if (!activeAccs || activeAccs.length === 0) {
        setAddress(null);
      } else {
        setAddress(activeAccs[0] as `0x${string}`);
      }
    };

    const handleChain = (...args: unknown[]) => {
      setChainId(args[0] as string);
    };

    provider.on('accountsChanged', handleAccounts);
    provider.on('chainChanged', handleChain);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccounts);
      provider.removeListener?.('chainChanged', handleChain);
    };
  }, []);

  useEffect(() => {
    if (address) refreshBalance();
  }, [address, refreshBalance]);

  const onChain = (chainId ?? '').toLowerCase() === NETWORK_CHAIN_ID_HEX;

  return {
    address,
    chainId,
    balance,
    connecting,
    error,
    hasProvider,
    onChain,
    connect,
    disconnect,
    refreshBalance,
  };
}
