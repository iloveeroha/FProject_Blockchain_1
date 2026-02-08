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

async function handleContribute(event) {
  event.preventDefault();

  if (!state.charityChainContract) {
    showAlert("❌ Not connected. Please connect MetaMask first.", "error");
    return;
  }

  try {
    const campaignId = parseInt(document.getElementById("campaignIdContribute").value);
    const amountEth = parseFloat(document.getElementById("contributionAmount").value);

    if (isNaN(campaignId) || !amountEth || amountEth <= 0) {
      showAlert("❌ Please enter valid campaign ID and amount.", "error");
      return;
    }

    const amountWei = ethers.utils.parseEther(amountEth.toString());

    console.log(`Contributing ${amountEth} ETH to campaign ${campaignId}`);

    const tx = await state.charityChainContract.contribute(campaignId, {
      value: amountWei,
    });

    showAlert(`⏳ Processing contribution... TX: ${tx.hash}`, "info");
    await tx.wait();

    showAlert(
      `✅ Contribution successful! You received ${(amountEth * 1000).toFixed(0)} CCRT tokens.`,
      "success"
    );
    event.target.reset();
    loadCampaigns();
    updateHeader();
  } catch (error) {
    console.error("Contribute error:", error);
    showAlert(`❌ Error: ${error.message}`, "error");
  }
}

async function handleFinalize() {
  if (!state.charityChainContract) {
    showAlert("❌ Not connected. Please connect MetaMask first.", "error");
    return;
  }

  try {
    const campaignId = parseInt(document.getElementById("campaignIdManage").value);

    if (isNaN(campaignId)) {
      showAlert("❌ Please enter a valid campaign ID.", "error");
      return;
    }

    console.log(`Finalizing campaign ${campaignId}`);

    const tx = await state.charityChainContract.finalizeCampaign(campaignId);

    showAlert(`⏳ Finalizing campaign... TX: ${tx.hash}`, "info");
    await tx.wait();

    showAlert(`✅ Campaign finalized!`, "success");
    loadCampaigns();
    updateHeader();
  } catch (error) {
    console.error("Finalize error:", error);
    showAlert(`❌ Error: ${error.message}`, "error");
  }
}

async function handleWithdraw() {
  if (!state.charityChainContract) {
    showAlert("❌ Not connected. Please connect MetaMask first.", "error");
    return;
  }

  try {
    const campaignId = parseInt(document.getElementById("campaignIdManage").value);

    if (isNaN(campaignId)) {
      showAlert("❌ Please enter a valid campaign ID.", "error");
      return;
    }

    console.log(`Withdrawing funds from campaign ${campaignId}`);

    const tx = await state.charityChainContract.withdrawFunds(campaignId);

    showAlert(`⏳ Withdrawing funds... TX: ${tx.hash}`, "info");
    await tx.wait();

    showAlert(`✅ Funds withdrawn successfully!`, "success");
    loadCampaigns();
    updateHeader();
  } catch (error) {
    console.error("Withdraw error:", error);
    showAlert(`❌ Error: ${error.message}`, "error");
  }
}

async function handleRefund() {
  if (!state.charityChainContract) {
    showAlert("❌ Not connected. Please connect MetaMask first.", "error");
    return;
  }

  try {
    const campaignId = parseInt(document.getElementById("campaignIdManage").value);

    if (isNaN(campaignId)) {
      showAlert("❌ Please enter a valid campaign ID.", "error");
      return;
    }

    console.log(`Requesting refund for campaign ${campaignId}`);

    const tx = await state.charityChainContract.refund(campaignId);

    showAlert(`⏳ Processing refund... TX: ${tx.hash}`, "info");
    await tx.wait();

    showAlert(`✅ Refund processed successfully!`, "success");
    loadCampaigns();
    updateHeader();
  } catch (error) {
    console.error("Refund error:", error);
    showAlert(`❌ Error: ${error.message}`, "error");
  }
}

async function loadCampaigns() {
  if (!state.charityChainContract) return;

  try {
    const count = await state.charityChainContract.campaignCount();
    state.campaigns = [];

    for (let i = 0; i < count; i++) {
      try {
        const campaign = await state.charityChainContract.getCampaign(i);
        state.campaigns.push(campaign);
      } catch (error) {
        console.error(`Error loading campaign ${i}:`, error);
      }
    }

    await displayCampaigns();
  } catch (error) {
    console.error("Error loading campaigns:", error);
    showAlert("❌ Error loading campaigns", "error");
  }
}

async function displayCampaigns() {
  const container = document.getElementById("campaignsList");

  if (state.campaigns.length === 0) {
    container.innerHTML = `
      <div class="placeholder">
        <p>No campaigns yet. Be the first to create one!</p>
      </div>
    `;
    return;
  }

  const campaignCards = [];
  for (const campaign of state.campaigns) {
    let hasRefunded = false;
    try {
      if (campaign.finalized && !campaign.successful) {
        hasRefunded = await state.charityChainContract.hasUserRefunded(
          campaign.id,
          state.userAddress
        );
      }
    } catch (error) {
      console.error(`Error checking refund status for campaign ${campaign.id}:`, error);
    }
    campaignCards.push(createCampaignCard(campaign, hasRefunded));
  }
  
  container.innerHTML = campaignCards.join("");
}

function createCampaignCard(campaign, hasRefunded = false) {
  const id = campaign.id.toString();
  const title = campaign.title;
  const goalEth = ethers.utils.formatEther(campaign.goalWei);
  const raisedEth = ethers.utils.formatEther(campaign.totalRaised);
  const percentage = Math.min((parseFloat(raisedEth) / parseFloat(goalEth)) * 100, 100);

  const isDeadlinePassed = campaign.deadline < Math.floor(Date.now() / 1000);
  const isSuccessful = campaign.successful; 
  
  let statusText, statusClass;
  if (!campaign.finalized) {
    statusText = isDeadlinePassed ? "⏰ Ended" : "🟢 Active";
    statusClass = isDeadlinePassed ? "status-ended" : "status-active";
  } else if (isSuccessful) {
    if (parseFloat(raisedEth) === 0) {
      statusText = "💰 Withdrawn";
      statusClass = "status-withdrawn";
    } else {
      statusText = "✅ Successful";
      statusClass = "status-successful";
    }
  } else {
    if (hasRefunded) {
      statusText = "🔄 Refunded";
      statusClass = "status-refunded";
    } else {
      statusText = "❌ Failed";
      statusClass = "status-failed";
    }
  }

  const remainingSeconds = Math.max(0, campaign.deadline - Math.floor(Date.now() / 1000));
  const creatorDisplay = campaign.creator.substring(0, 6) + "..." + campaign.creator.substring(38);

  return `
    <div class="campaign-card">
      <h4>${title}</h4>
      <div class="campaign-info">
        <span><strong>ID:</strong> #${id}</span>
        <span class="campaign-status ${statusClass}">${statusText}</span>
      </div>
      <div class="campaign-info">
        <label>Goal:</label>
        <span>${parseFloat(goalEth).toFixed(2)} ETH</span>
      </div>
      <div class="campaign-info">
        <label>Raised:</label>
        <span>${parseFloat(raisedEth).toFixed(2)} ETH</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="campaign-info">
        <label>Progress:</label>
        <span>${percentage.toFixed(1)}%</span>
      </div>
      <div class="campaign-info">
        <label>Creator:</label>
        <span style="font-size: 12px;">${creatorDisplay}</span>
      </div>
      <div class="campaign-info">
        <label>Time Remaining:</label>
        <span style="font-size: 12px;">${remainingSeconds} seconds</span>
      </div>
    </div>
  `;
}

function showAlert(message, type = "info") {
  const container = document.getElementById("alertContainer");
  const alertId = "alert-" + Date.now();

  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type}">
      <span>${message}</span>
      <button class="alert-close" onclick="document.getElementById('${alertId}').remove();">✕</button>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", alertHTML);

  setTimeout(() => {
    const element = document.getElementById(alertId);
    if (element) element.remove();
  }, 8000);
}

function enableAllControls() {
  document.getElementById("createCampaignForm").style.opacity = "1";
  document.getElementById("contributeForm").style.opacity = "1";
  document.getElementById("manageForm").style.opacity = "1";

  Array.from(document.querySelectorAll("input, button")).forEach((el) => {
    if (el.id !== "connectBtn") el.disabled = false;
  });
}

function disableAllControls() {
  document.getElementById("createCampaignForm").style.opacity = "0.5";
  document.getElementById("contributeForm").style.opacity = "0.5";
  document.getElementById("manageForm").style.opacity = "0.5";

  Array.from(document.querySelectorAll("input, button")).forEach((el) => {
    el.disabled = true;
  });
}


