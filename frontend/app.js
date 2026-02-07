const ABI_CHARITY_CHAIN = [
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "uint256", name: "_goalWei", type: "uint256" },
      { internalType: "uint256", name: "_durationSeconds", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
 
  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "finalizeCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address payable", name: "creator", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "goalWei", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "totalRaised", type: "uint256" },
          { internalType: "bool", name: "finalized", type: "bool" },
          { internalType: "bool", name: "successful", type: "bool" },
        ],
        internalType: "struct CharityChain.Campaign",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      { internalType: "uint256", name: "_campaignId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserContribution",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "campaignCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
 
  {
    inputs: [
      { internalType: "uint256", name: "_campaignId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "hasUserRefunded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const ABI_REWARD_TOKEN = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

let state = {
  provider: null,
  signer: null,
  userAddress: null,
  charityChainContract: null,
  rewardTokenContract: null,
  chainId: null,
  campaigns: [],
};

window.addEventListener("load", () => {
  initialize();
});

async function initialize() {
  console.log("🚀 Initializing CharityChain DApp...");

  let retries = 0;
  while (!window.ethers && retries < 10) {
    await new Promise(r => setTimeout(r, 100));
    retries++;
  }

  if (!window.ethers) {
    showAlert("❌ Ethers.js failed to load. Please refresh the page.", "error");
    return;
  }

  console.log("✅ Ethers.js loaded successfully");

  if (!window.ethereum) {
    showAlert("❌ MetaMask not detected. Please install MetaMask.", "error");
    disableAllControls();
    return;
  }

  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());

  document.getElementById("connectBtn").addEventListener("click", connectMetaMask);
  document.getElementById("createCampaignForm").addEventListener("submit", handleCreateCampaign);
  document.getElementById("contributeForm").addEventListener("submit", handleContribute);
  document.getElementById("finalizeBtn").addEventListener("click", handleFinalize);
  document.getElementById("withdrawBtn").addEventListener("click", handleWithdraw);
  document.getElementById("refundBtn").addEventListener("click", handleRefund);

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      await connectMetaMask();
    }
  } catch (error) {
    console.log("Not connected yet:", error.message);
  }
}

async function connectMetaMask() {
  try {
    if (!window.ethers) {
      throw new Error("Ethers.js library not loaded. Please refresh the page.");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      showAlert("❌ No accounts found. Please enable MetaMask.", "error");
      return;
    }

    state.provider = new ethers.providers.Web3Provider(window.ethereum);
    state.signer = state.provider.getSigner();
    state.userAddress = accounts[0];

    const network = await state.provider.getNetwork();
    state.chainId = network.chainId;

    console.log(`✅ Connected to account: ${state.userAddress}`);
    console.log(`✅ Chain ID: ${state.chainId}`);

    if (state.chainId !== 31337 && state.chainId !== 1337) {
      showAlert(
        `⚠️ Wrong network! Please switch to Localhost (Chain ID: 31337). Current: ${state.chainId}`,
        "error"
      );
      disableAllControls();
      return;
    }

    showAlert("✅ Connected to Hardhat Localhost (Chain ID: 31337)", "success");

    if (!CONTRACT_CONFIG) {
      showAlert(
        "❌ Contract config not found. Did you run 'npm run deploy:local'?",
        "error"
      );
      disableAllControls();
      return;
    }

    state.charityChainContract = new ethers.Contract(
      CONTRACT_CONFIG.CHARITY_CHAIN_ADDRESS,
      ABI_CHARITY_CHAIN,
      state.signer
    );

    state.rewardTokenContract = new ethers.Contract(
      CONTRACT_CONFIG.REWARD_TOKEN_ADDRESS,
      ABI_REWARD_TOKEN,
      state.signer
    );

    updateHeader();
    enableAllControls();
    loadCampaigns();

    setInterval(updateHeader, 5000);
  } catch (error) {
    console.error("Connection error:", error);
    showAlert(`❌ Connection failed: ${error.message}`, "error");
  }
}

async function updateHeader() {
  if (!state.userAddress) return;

  try {
    document.getElementById("walletAddress").textContent =
      state.userAddress.substring(0, 6) + "..." + state.userAddress.substring(38);

    document.getElementById("networkInfo").textContent =
      state.chainId === 31337 ? "Hardhat (31337)" : `Chain ${state.chainId}`;

    const balance = await state.provider.getBalance(state.userAddress);
    const ethBalance = ethers.utils.formatEther(balance);
    document.getElementById("ethBalance").textContent = parseFloat(ethBalance).toFixed(4) + " ETH";

    const tokenBalance = await state.rewardTokenContract.balanceOf(state.userAddress);
    const formattedBalance = ethers.utils.formatEther(tokenBalance);
    document.getElementById("tokenBalance").textContent = parseFloat(formattedBalance).toFixed(2);

    document.getElementById("connectBtn").textContent = "✅ Connected";
    document.getElementById("connectBtn").disabled = true;
  } catch (error) {
    console.error("Error updating header:", error);
  }
}

async function handleCreateCampaign(event) {
  event.preventDefault();

  if (!state.charityChainContract) {
    showAlert("❌ Not connected. Please connect MetaMask first.", "error");
    return;
  }

  try {
    const title = document.getElementById("campaignTitle").value;
    const goalEth = parseFloat(document.getElementById("campaignGoal").value);
    const durationSeconds = parseInt(document.getElementById("campaignDuration").value);

    if (!title || !goalEth || !durationSeconds) {
      showAlert("❌ Please fill in all fields.", "error");
      return;
    }

    if (durationSeconds < 10 || durationSeconds > 600) {
      showAlert("❌ Duration must be between 10 and 600 seconds.", "error");
      return;
    }

    const goalWei = ethers.utils.parseEther(goalEth.toString());

    console.log(`Creating campaign: "${title}" with goal ${goalEth} ETH, duration ${durationSeconds}s`);

    const tx = await state.charityChainContract.createCampaign(
      title,
      goalWei,
      durationSeconds
    );

    showAlert(`⏳ Creating campaign... TX: ${tx.hash}`, "info");
    await tx.wait();

    showAlert(`✅ Campaign created successfully!`, "success");
    event.target.reset();
    loadCampaigns();
    updateHeader();
  } catch (error) {
    console.error("Create campaign error:", error);
    showAlert(`❌ Error: ${error.message}`, "error");
  }
}

