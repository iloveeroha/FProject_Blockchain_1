const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`RewardToken deployed at: ${rewardTokenAddress}`);

  const CharityChain = await ethers.getContractFactory("CharityChain");
  const charityChain = await CharityChain.deploy(rewardTokenAddress);
  await charityChain.waitForDeployment();
  const charityChainAddress = await charityChain.getAddress();
  console.log(`CharityChain deployed at: ${charityChainAddress}`);

  await rewardToken.setMinter(charityChainAddress);
  console.log("CharityChain set as minter");

  const configContent = `const CONTRACT_CONFIG = {
  CHARITY_CHAIN_ADDRESS: "${charityChainAddress}",
  REWARD_TOKEN_ADDRESS: "${rewardTokenAddress}",
  NETWORK_ID: 31337,
  RPC_URL: "http://127.0.0.1:8545"
};

if (typeof window !== "undefined") {
  window.CONTRACT_CONFIG = CONTRACT_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONTRACT_CONFIG;
}
`;

  const configPath = path.join(__dirname, "../frontend/config.js");
  fs.writeFileSync(configPath, configContent);
  console.log(`Frontend config created at ${configPath}`);

  console.log("\nDEPLOYMENT SUCCESSFUL!");
  console.log(`RewardToken:   ${rewardTokenAddress}`);
  console.log(`CharityChain:  ${charityChainAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
