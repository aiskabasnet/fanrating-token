"use client";

import { useState, useEffect, useCallback } from "react";

import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDownUp,
  RefreshCcw,
} from "lucide-react";
import { useWeb3 } from "../Web3Provider";
import { USDC_DECIMALS } from "../../lib";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { ProgressSpinner } from "primereact/progressspinner";

export default function TokenExchange() {
  const {
    web3,
    account,
    connected,
    dajuContract,
    connectWallet,
    // loading: walletLoading,
    chainId,
    switchToSupportedNetwork,
  } = useWeb3();

  const [usdAmount, setUsdAmount] = useState<number | null>(0);
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [exchangeRates, setExchangeRates] = useState<{
    tokens: string[];
    rates: string[];
  }>({ tokens: [], rates: [] });
  const [txStatus, setTxStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [txMessage, setTxMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  // const [balanceRefreshing, setBalanceRefreshing] = useState<boolean>(false);

  // const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Check if on the correct network (Sepolia testnet)
  const isCorrectNetwork = chainId?.toString() === "11155111".toString(); // Sepolia testnet chain ID

  // Function to fetch token balance
  const fetchTokenBalance = useCallback(async () => {
    if (!web3 || !dajuContract || !account || !connected || !isCorrectNetwork)
      return "0";

    try {
      const balance = await dajuContract.methods.balanceOf(account).call();
      console.log(balance, "BALACE  ");
      return web3.utils.fromWei(balance, "ether");
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return "0";
    }
  }, [web3, dajuContract, account, connected, isCorrectNetwork]);

  // Function to fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    if (!web3 || !dajuContract || !isCorrectNetwork)
      return { tokens: [], rates: [] };

    try {
      const ratesData = await dajuContract.methods
        .getSupportedTokensAndRates()
        .call();
      return {
        tokens: ratesData[0],
        rates: ratesData[1].map((rate: string) =>
          web3.utils.fromWei(rate, "ether")
        ),
      };
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      return { tokens: [], rates: [] };
    }
  }, [web3, dajuContract, isCorrectNetwork]);

  // Force refresh account data
  const handleForceRefresh = async () => {
    if (web3) {
      setLoading(true);
      try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0 && accounts[0] !== account) {
          setCurrentAccount(accounts[0]);
        }
        await refreshData();
      } catch (error) {
        console.error("Error refreshing account:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch token balance
      const balance = await fetchTokenBalance();
      setTokenBalance(balance);

      // Fetch exchange rates
      const rates = await fetchExchangeRates();
      setExchangeRates(rates);

      // setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchTokenBalance, fetchExchangeRates]);

  // Function to refresh balance multiple times after transaction
  const refreshBalanceAfterTransaction = useCallback(async () => {
    // setBalanceRefreshing(true);

    // Try to refresh the balance multiple times with delays
    // This helps account for blockchain confirmation times
    try {
      console.log("Starting post-transaction balance refresh sequence");

      // First attempt - immediate
      let balance = await fetchTokenBalance();
      setTokenBalance(balance);
      console.log("Balance after first refresh:", balance);

      // Second attempt - after 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      balance = await fetchTokenBalance();
      setTokenBalance(balance);
      console.log("Balance after second refresh:", balance);

      // Third attempt - after another 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));
      balance = await fetchTokenBalance();
      setTokenBalance(balance);
      console.log("Balance after third refresh:", balance);

      // Final attempt - after another 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
      balance = await fetchTokenBalance();
      setTokenBalance(balance);
      console.log("Balance after final refresh:", balance);
    } catch (error) {
      console.error("Error during post-transaction balance refresh:", error);
    }
    // finally {
    //   setBalanceRefreshing(false);
    // }
  }, [fetchTokenBalance]);

  useEffect(() => {
    if (account !== currentAccount) {
      console.log("Account changed from", currentAccount, "to", account);
      setCurrentAccount(account);
      setTokenBalance("0");
      setUsdAmount(0);
      setTokenAmount("");
      setTxStatus("idle");
      setTxMessage("");

      if (account && connected && web3 && dajuContract && isCorrectNetwork) {
        refreshData();
      }
    }
  }, [account]);

  useEffect(() => {
    if (web3 && dajuContract && account && connected && isCorrectNetwork) {
      refreshData();

      // Refreshing data every 15 seconds
      const interval = setInterval(refreshData, 15000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [web3, dajuContract, account, connected, isCorrectNetwork, refreshData]);

  // Listen for blockchain events that might affect our balance
  // useEffect(() => {
  //   if (!web3 || !dajuContract || !account || !connected || !isCorrectNetwork)
  //     return;

  //   // const setupEventListeners = async () => {
  //   //   try {
  //   //     // Listen for Transfer events to/from our account
  //   //     const transferFilter = {
  //   //       fromBlock: "latest",
  //   //       topics: [
  //   //         web3.utils.sha3("Transfer(address,address,uint256)"),
  //   //         null, // from address (any)
  //   //         web3.utils.padLeft(account, 64), // to address (our account)
  //   //       ],
  //   //     };

  //   //     // web3.eth.subscribe("logs", transferFilter, (error, result) => {
  //   //     //   if (!error) {
  //   //     //     console.log("Transfer event detected, refreshing balance...");
  //   //     //     refreshData();
  //   //     //   }
  //   //     // });

  //   //     // Listen for ExchangeCompleted events for our account
  //   //     // const exchangeFilter = {
  //   //     //   fromBlock: "latest",
  //   //     //   topics: [
  //   //     //     web3.utils.sha3("ExchangeCompleted(address,string,uint256,bool)"),
  //   //     //     web3.utils.padLeft(account, 64), // user address (our account)
  //   //     //   ],
  //   //     // } as any;

  //   //     // web3.eth.subscribe("logs", exchangeFilter, (error) => {
  //   //     //   if (!error) {
  //   //     //     console.log("Exchange event detected, refreshing data...");
  //   //     //     refreshData();
  //   //     //   }
  //   //     // });
  //   //   } catch (error) {
  //   //     console.error("Error setting up event listeners:", error);
  //   //   }
  //   // };

  //   // setupEventListeners();

  //   // Cleanup function
  //   return () => {
  //     // Unsubscribe from all subscriptions
  //     web3.eth.clearSubscriptions();
  //   };
  // }, [web3, dajuContract, account, connected, isCorrectNetwork, refreshData]);

  // Find USDC exchange rate
  const usdcRate = exchangeRates.tokens.includes("FANR")
    ? exchangeRates.rates[exchangeRates.tokens.indexOf("FANR")]
    : "0";

  // Calculate token amount based on USD input
  const calculateTokenAmount = (usdValue: string) => {
    if (!usdValue || !usdcRate || Number.parseFloat(usdcRate) === 0 || !web3)
      return "";

    try {
      // Converting USD to USDC (1:1)
      const usdcAmount = Number.parseFloat(usdValue);
      const calculatedAmount = usdcAmount / Number.parseFloat(usdcRate);
      return calculatedAmount.toFixed(6);
    } catch (error) {
      console.error("Error calculating token amount:", error);
      return "";
    }
  };

  // Update token amount when USD amount changes
  useEffect(() => {
    if (usdAmount) {
      const calculated = calculateTokenAmount(usdAmount.toString());
      setTokenAmount(calculated);
    } else {
      setTokenAmount("");
    }
  }, [usdAmount, usdcRate]);

  // Handle buying tokens
  const handleBuyTokens = async () => {
    if (!web3 || !dajuContract || !account || !usdAmount || !tokenAmount)
      return;

    try {
      setTxStatus("loading");
      setTxMessage("Processing your purchase...");

      // Convert USD to USDC amount in wei (USDC has 6 decimals)
      const usdcAmountInWei = Math.floor(
        usdAmount * 10 ** USDC_DECIMALS
      ).toString();

      // Record the exchange
      const tx = await dajuContract.methods
        .recordExchange(
          account,
          "DAJU",
          usdcAmountInWei,
          true // isBuying = true
        )
        .send({ from: account });

      console.log("Transaction successful:", tx);

      setTxStatus("success");
      setTxMessage(
        `Successfully purchased ${tokenAmount} FanRating tokens! Updating balance...`
      );

      // Reset form
      setUsdAmount(0);
      setTokenAmount("");

      // Start the multi-refresh sequence to update the balance
      // This handles the delay in blockchain confirmation
      await refreshBalanceAfterTransaction();

      // Update the success message after balance refresh
      setTxMessage(`Successfully purchased ${tokenAmount} FanRating tokens!`);

      // Reset status after a delay
      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error buying tokens:", error);
      setTxStatus("error");
      setTxMessage("Transaction failed. Please try again.");

      // Reset status after a delay
      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // const handleManualRefresh = () => {
  //   refreshData();
  // };

  // Render wallet connection UI if not connected
  if (!connected) {
    return (
      <div className="not-connected-container">
        <h6>Connect your wallet to buy Fanrating tokens</h6>
        <p>You need to connect your Ethereum wallet to use this application</p>
        <Button loading={loading} onClick={connectWallet} disabled={loading}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  // Render network switch UI if on wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="error-info">
        <div>
          <div>Wrong Network!</div>
          <div className="text">Please switch to Sepolia testnet</div>
        </div>
        <div>This application requires the Sepolia testnet</div>
        <Button
          onClick={switchToSupportedNetwork}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Switching...
            </>
          ) : (
            "Switch to Sepolia"
          )}
        </Button>
      </div>
    );
  }

  // Main exchange UI
  return (
    <>
      <div className="current-balance">
        <div onClick={handleForceRefresh}>
          <RefreshCcw />
        </div>
        Current balance: {Number(tokenBalance).toLocaleString()} tokens
      </div>
      <div className="account">Connected account: {account}</div>
      <div className="form">
        <label htmlFor="usd-amount">USD Amount</label>
        <InputNumber
          id="usd-amount"
          placeholder="0.00"
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.value)}
        />

        <div className="arrow">
          <ArrowDownUp />
        </div>

        <label htmlFor="fanrating-amount">Fanrating Tokens</label>
        <InputNumber
          id="fanrating-amount"
          type="text"
          placeholder="0.00"
          value={Number(tokenAmount)}
          readOnly
          className="bg-slate-700 border-slate-600 pr-16"
        />

        {txStatus !== "idle" && (
          <div
            className={`info-msg ${
              txStatus === "loading"
                ? "grey"
                : txStatus === "success"
                ? "success"
                : "error"
            }`}
          >
            {txStatus === "loading" && (
              <ProgressSpinner style={{ width: "20px", height: "20px" }} />
            )}

            {txStatus === "success" && <CheckCircle2 />}
            {txStatus === "error" && <AlertCircle />}
            {/* <div>
              {txStatus === "loading"
                ? "Processing"
                : txStatus === "success"
                ? "Success"
                : "Error"}
            </div> */}
            <div>{txMessage}</div>
          </div>
        )}

        <Button
          onClick={handleBuyTokens}
          loading={txStatus === "loading"}
          disabled={
            !usdAmount || !tokenAmount || Number.parseFloat(usdcRate) === 0
          }
        >
          Buy
        </Button>
        <div className="exchange-rate">
          <p>Exchange Rate:</p>
          <p>
            {Number.parseFloat(usdcRate) > 0
              ? `1 FANR = ${usdcRate} USDC`
              : "Loading exchange rates..."}
          </p>
        </div>
      </div>
    </>
  );
}
