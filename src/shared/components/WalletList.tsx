import {
  useCreateWallet,
  useConnectWallet,
  WalletWithMetadata,
  useUser,
} from "@privy-io/react-auth";
import { useCreateWallet as useCreateSolanaWallet } from "@privy-io/react-auth/solana";
import { useCallback, useMemo, useState } from "react";
import WalletCard from "./WalletCard";
import { walletLabel } from "@utils/wallet";

export default function WalletList() {
  const { user } = useUser();
  const { createWallet: createEthereumWallet } = useCreateWallet();
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet();
  const { connectWallet } = useConnectWallet();
  const [isCreatingEth, setIsCreatingEth] = useState(false);
  const [isCreatingSol, setIsCreatingSol] = useState(false);
  const [createError, setCreateError] = useState("");

  // All Ethereum wallets (embedded + external)
  const ethereumWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" && account.chainType === "ethereum",
      ) as WalletWithMetadata[]) ?? [],
    [user],
  );

  // All Solana wallets (embedded + external)
  const solanaWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" && account.chainType === "solana",
      ) as WalletWithMetadata[]) ?? [],
    [user],
  );

  const handleCreateWallet = useCallback(
    async (type: "ethereum" | "solana") => {
      const setCreating = type === "ethereum" ? setIsCreatingEth : setIsCreatingSol;
      setCreating(true);
      setCreateError("");
      try {
        if (type === "ethereum") {
          await createEthereumWallet();
        } else if (type === "solana") {
          await createSolanaWallet();
        }
      } catch (error: any) {
        console.error("Error creating wallet:", error);
        setCreateError(error?.message || "Failed to create wallet. Please try again.");
      } finally {
        setCreating(false);
      }
    },
    [createEthereumWallet, createSolanaWallet],
  );

  const handleConnectExternal = useCallback(() => {
    connectWallet();
  }, [connectWallet]);

  return (
    <div className="space-y-6">
      {/* Ethereum wallets */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Ethereum Wallets</h3>
        {ethereumWallets.length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600 mb-4">No Ethereum wallets found.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCreateWallet("ethereum")}
                disabled={isCreatingEth}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                {isCreatingEth ? "Creating\u2026" : "Create Embedded Wallet"}
              </button>
              <button
                onClick={handleConnectExternal}
                className="text-sm border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-md text-gray-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                Connect External Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {ethereumWallets.map((wallet) => (
              <div key={wallet.address}>
                <span className="text-xs text-gray-400 mb-1 block">
                  {walletLabel(wallet)} &middot; Ethereum
                </span>
                <WalletCard wallet={wallet} />
              </div>
            ))}
            <button
              onClick={handleConnectExternal}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              + Connect another wallet
            </button>
          </div>
        )}
      </div>

      {/* Solana wallets */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Solana Wallets</h3>
        {solanaWallets.length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600 mb-4">No Solana wallets found.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCreateWallet("solana")}
                disabled={isCreatingSol}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                {isCreatingSol ? "Creating\u2026" : "Create Embedded Wallet"}
              </button>
              <button
                onClick={handleConnectExternal}
                className="text-sm border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-md text-gray-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                Connect External Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {solanaWallets.map((wallet) => (
              <div key={wallet.address}>
                <span className="text-xs text-gray-400 mb-1 block">
                  {walletLabel(wallet)} &middot; Solana
                </span>
                <WalletCard wallet={wallet} />
              </div>
            ))}
            <button
              onClick={handleConnectExternal}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              + Connect another wallet
            </button>
          </div>
        )}
      </div>
      {createError && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{createError}</p>
        </div>
      )}
    </div>
  );
}
