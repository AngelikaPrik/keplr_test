import { useEffect, useState } from "react";

import { SigningStargateClient } from "@cosmjs/stargate";

import { assertIsBroadcastTxSuccess } from "@cosmjs/launchpad";

const CHAIN_ID = "osmosis-1";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false)

  const connect = async () => {
    if (!window.getOfflineSigner || !window.keplr) {
      alert("Please install keplr extension");
    } else {
      if (window.keplr.experimentalSuggestChain) {
        try {
          await window.keplr.experimentalSuggestChain({
            chainId: CHAIN_ID,
            chainName: "Osmosis mainnet",
            rpc: "https://rpc-osmosis.blockapsis.com",
            rest: "https://lcd-osmosis.blockapsis.com",
            stakeCurrency: {
              coinDenom: "OSMO",
              coinMinimalDenom: "uosmo",
              coinDecimals: 6,
            },
            bip44: {
              coinType: 118,
            },
            bech32Config: {
              bech32PrefixAccAddr: "osmo",
              bech32PrefixAccPub: "osmopub",
              bech32PrefixValAddr: "osmovaloper",
              bech32PrefixValPub: "osmovaloperpub",
              bech32PrefixConsAddr: "osmovalcons",
              bech32PrefixConsPub: "osmovalconspub",
            },
            currencies: [
              {
                coinDenom: "OSMO",
                coinMinimalDenom: "uosmo",
                coinDecimals: 6,
              },
            ],
            feeCurrencies: [
              {
                coinDenom: "OSMO",
                coinMinimalDenom: "uosmo",
                coinDecimals: 6,
              },
            ],
            gasPriceStep: {
              low: 0.01,
              average: 0.025,
              high: 0.04,
            },
            coinType: 118,
          });
        } catch {
          alert("Failed to suggest the chain");
        }
      } else {
        alert("Please use the recent version of keplr extension");
      }
    }

    await window.keplr.enable(CHAIN_ID);
    setIsConnected(true);
  };

  const disconnect = () => {
    window.keplr.disable();
    setIsConnected(false);
  };

  const takeTransaction = async () => {
    setIsLoading(true)
    
    let recipient = "osmo159txefdcl4a9d8kjsuy9d9em3wleu0psvtewj3";
    let amount = parseFloat(inputValue);
    
    if (isNaN(amount)) {
      alert("Invalid amount");
      return false;
    }

    amount *= 1000000;
    amount = Math.floor(amount);

    (async () => {
      const offlineSigner = window.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      const client = await SigningStargateClient.connectWithSigner(
        "https://rpc-osmosis.blockapsis.com",
        offlineSigner
      );

      const amountFinal = {
        denom: "uosmo",
        amount: amount.toString(),
      };
      const fee = {
        amount: [
          {
            denom: "uosmo",
            amount: "5000",
          },
        ],
        gas: "200000",
      };
      const result = await client.sendTokens(
        accounts[0].address,
        recipient,
        [amountFinal],
        fee,
        ""
      );
      assertIsBroadcastTxSuccess(result);

      if (result.code !== undefined && result.code !== 0) {
        alert("Failed to send tx: " + result.log || result.rawLog);
        setIsLoading(false)
      } else {
        alert("Succeed to send tx:" + result.transactionHash);
        setInputValue("")
        setIsLoading(false)
      }

      
    })();
    setIsLoading(false)
    return false;
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div>
      <button
        className="btn"
        onClick={isConnected ? () => disconnect() : () => connect()}
      >
        {isConnected ? "Disconnect" : "Connect wallet"}
      </button>
      {isConnected && (
        <div>
          <input
            className="input"
            onChange={e => setInputValue(e.target.value)}
            value={inputValue}
          />
          <button className="btn" onClick={takeTransaction}>
            {isLoading ? "Wait..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
