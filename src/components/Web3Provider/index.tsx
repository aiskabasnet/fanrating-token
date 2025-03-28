import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Web3 from "web3";
import type { AbiItem } from "web3-utils";
import { DAJU_TOKEN_ABI, DAJU_TOKEN_ADDRESS } from "../../lib";

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  connected: boolean;
  dajuContract: any | null;
  connectWallet: () => Promise<void>;
  loading: boolean;
  chainId: number | null;
  switchToSupportedNetwork: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Web3Context = createContext<Web3ContextType>({
  web3: null,
  account: null,
  connected: false,
  dajuContract: null,
  connectWallet: async () => {},
  loading: false,
  chainId: null,
  switchToSupportedNetwork: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [dajuContract, setDajuContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Initialize web3
  useEffect(() => {
    const initWeb3 = async () => {
      // Check if MetaMask is installed
      if (
        typeof window !== "undefined" &&
        typeof window.ethereum !== "undefined"
      ) {
        try {
          // Create a new web3 instance
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Create contract instance
          const contractInstance = new web3Instance.eth.Contract(
            DAJU_TOKEN_ABI as AbiItem[],
            DAJU_TOKEN_ADDRESS
          );
          setDajuContract(contractInstance);

          // Get current chain ID
          const chainId = (await web3Instance.eth.getChainId()) as any;
          setChainId(chainId);

          // Check if already connected
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setConnected(true);
          }

          // Setup event listeners
          window.ethereum.on("accountsChanged", (accounts: string[]) => {
            if (accounts.length > 0) {
              setAccount(accounts[0]);
              setConnected(true);
            } else {
              setAccount(null);
              setConnected(false);
            }
          });

          window.ethereum.on("chainChanged", (chainId: string) => {
            setChainId(Number.parseInt(chainId, 16));
            window.location.reload();
          });
        } catch (error) {
          console.error("Error initializing web3:", error);
        }
      } else {
        console.log("Please install MetaMask to use this application");
      }
    };

    initWeb3();

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (!web3) return;

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setConnected(true);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Switch to supported network (Sepolia testnet)
  const switchToSupportedNetwork = async () => {
    if (!web3) return;

    try {
      setLoading(true);
      // Sepolia testnet
      const targetChainId = "0xaa36a7"; // 11155111 in hex

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // If the chain is not added to MetaMask, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      } else {
        console.error("Error switching network:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        connected,
        dajuContract,
        connectWallet,
        loading,
        chainId,
        switchToSupportedNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
