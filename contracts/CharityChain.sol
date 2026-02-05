// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RewardToken.sol";


contract CharityChain is ReentrancyGuard {

    uint256 public constant TOKENS_PER_ETH = 1000;
    uint256 public constant TOKEN_DECIMALS = 18;

    RewardToken public rewardToken;
    uint256 public campaignCount;

    struct Campaign {
        uint256 id;
        address payable creator;
        string title;
        uint256 goalWei;
        uint256 deadline;
        uint256 totalRaised;
        bool finalized;
        bool successful;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => bool)) public hasRefunded;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goalWei,
        uint256 deadline
    );

    event Contributed(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amountWei,
        uint256 tokensReceived
    );

    event Finalized(
        uint256 indexed campaignId,
        bool successful,
        uint256 totalRaised
    );

    event Withdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amountWei
    );

    event Refunded(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amountWei
    );

    event RewardMinted(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 tokenAmount
    );

    constructor(address _rewardTokenAddress) {
        require(_rewardTokenAddress != address(0), "Invalid token address");
        rewardToken = RewardToken(_rewardTokenAddress);
    }
    function createCampaign(
        string calldata _title,
        uint256 _goalWei,
        uint256 _durationSeconds
    ) external {
        require(_goalWei > 0, "Goal must be greater than 0");
        require(_durationSeconds > 0, "Duration must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");

        uint256 campaignId = campaignCount;
        uint256 deadline = block.timestamp + _durationSeconds;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: payable(msg.sender),
            title: _title,
            goalWei: _goalWei,
            deadline: deadline,
            totalRaised: 0,
            finalized: false,
            successful: false
        });

        campaignCount++;

        emit CampaignCreated(campaignId, msg.sender, _title, _goalWei, deadline);
    }

    function contribute(uint256 _campaignId) external payable nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(msg.value > 0, "Contribution must be greater than 0");

        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp <= campaign.deadline, "Campaign has ended");
        require(!campaign.finalized, "Campaign is finalized");

        contributions[_campaignId][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;

        uint256 tokensToMint = (msg.value * TOKENS_PER_ETH) / (10 ** 18);
        require(tokensToMint > 0, "Contribution too small for token reward");

        rewardToken.mint(msg.sender, tokensToMint * (10 ** TOKEN_DECIMALS));

        emit Contributed(_campaignId, msg.sender, msg.value, tokensToMint);
        emit RewardMinted(_campaignId, msg.sender, tokensToMint);
    }
