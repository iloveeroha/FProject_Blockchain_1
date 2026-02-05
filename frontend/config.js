const CONTRACT_CONFIG = {
  CHARITY_CHAIN_ADDRESS: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  REWARD_TOKEN_ADDRESS: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  NETWORK_ID: 31337,
  RPC_URL: "http://127.0.0.1:8545",
};

if (typeof window !== "undefined") {
  window.CONTRACT_CONFIG = CONTRACT_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONTRACT_CONFIG;
}
