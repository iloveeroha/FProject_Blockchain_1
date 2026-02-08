const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CharityChain", function () {
  let charityChain, rewardToken;
  let owner, donor1, donor2, creator;
  const TOKENS_PER_ETH = 1000;

  beforeEach(async function () {
    [owner, donor1, donor2, creator] = await ethers.getSigners();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();

    const CharityChain = await ethers.getContractFactory("CharityChain");
    const rewardTokenAddress = await rewardToken.getAddress();
    charityChain = await CharityChain.deploy(rewardTokenAddress);
    await charityChain.waitForDeployment();

    await rewardToken.setMinter(await charityChain.getAddress());
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign with correct parameters", async function () {
      const title = "Help Build Schools";
      const goalWei = ethers.parseEther("10");
      const durationSeconds = 7 * 24 * 60 * 60;

      await charityChain.connect(creator).createCampaign(
        title,
        goalWei,
        durationSeconds
      );

      const campaign = await charityChain.getCampaign(0);
      expect(campaign.id).to.equal(0);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.title).to.equal(title);
      expect(campaign.goalWei).to.equal(goalWei);
      expect(campaign.totalRaised).to.equal(0);
      expect(campaign.finalized).to.be.false;
    });

    it("Should emit CampaignCreated event", async function () {
      const title = "Test Campaign";
      const goalWei = ethers.parseEther("5");
      const durationSeconds = 24 * 60 * 60;

      await expect(
        charityChain
          .connect(creator)
          .createCampaign(title, goalWei, durationSeconds)
      )
        .to.emit(charityChain, "CampaignCreated");
    });

    it("Should reject campaign with zero goal", async function () {
      await expect(
        charityChain
          .connect(creator)
          .createCampaign("Bad Campaign", 0, 86400)
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should reject campaign with zero duration", async function () {
      const goalWei = ethers.parseEther("1");
      await expect(
        charityChain.connect(creator).createCampaign("Bad Campaign", goalWei, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Contributions and Reward Tokens", function () {
    beforeEach(async function () {
      const goalWei = ethers.parseEther("10");
      const durationSeconds = 7 * 24 * 60 * 60;
      await charityChain
        .connect(creator)
        .createCampaign("Fund Campaign", goalWei, durationSeconds);
    });

    it("Should track contribution correctly", async function () {
      const donationAmount = ethers.parseEther("1");

      await charityChain.connect(donor1).contribute(0, { value: donationAmount });

      const contribution = await charityChain.getUserContribution(0, donor1.address);
      expect(contribution).to.equal(donationAmount);
    });

    it("Should mint reward tokens proportional to contribution", async function () {
      const donationAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther((TOKENS_PER_ETH).toString());

      await charityChain.connect(donor1).contribute(0, { value: donationAmount });

      const balance = await rewardToken.balanceOf(donor1.address);
      expect(balance).to.equal(expectedTokens);
    });

    it("Should emit Contributed and RewardMinted events", async function () {
      const donationAmount = ethers.parseEther("0.5");
      const expectedTokens = Math.floor((0.5 * TOKENS_PER_ETH * Math.pow(10, 18)) / Math.pow(10, 18));

      await expect(charityChain.connect(donor1).contribute(0, { value: donationAmount }))
        .to.emit(charityChain, "Contributed")
        .and.to.emit(charityChain, "RewardMinted");
    });

    it("Should update total campaign raised", async function () {
      const donation1 = ethers.parseEther("2");
      const donation2 = ethers.parseEther("3");

      await charityChain.connect(donor1).contribute(0, { value: donation1 });
      await charityChain.connect(donor2).contribute(0, { value: donation2 });

      const campaign = await charityChain.getCampaign(0);
      expect(campaign.totalRaised).to.equal(donation1 + donation2);
    });

    it("Should reject zero contribution", async function () {
      await expect(
        charityChain.connect(donor1).contribute(0, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });

    it("Should reject contribution after deadline", async function () {
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await expect(
        charityChain
          .connect(donor1)
          .contribute(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign has ended");
    });
  });

  describe("Campaign Finalization", function () {
    beforeEach(async function () {
      const goalWei = ethers.parseEther("5");
      const durationSeconds = 24 * 60 * 60;
      await charityChain
        .connect(creator)
        .createCampaign("Fund Campaign", goalWei, durationSeconds);
    });

    it("Should finalize campaign after deadline", async function () {
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      const campaign = await charityChain.getCampaign(0);
      expect(campaign.finalized).to.be.true;
    });

    it("Should mark campaign successful if goal reached", async function () {
      const goalWei = ethers.parseEther("5");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: goalWei });

      await charityChain.finalizeCampaign(0);

      const campaign = await charityChain.getCampaign(0);
      expect(campaign.successful).to.be.true;
    });

    it("Should mark campaign unsuccessful if goal not reached", async function () {
      await charityChain
        .connect(donor1)
        .contribute(0, { value: ethers.parseEther("2") });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      const campaign = await charityChain.getCampaign(0);
      expect(campaign.successful).to.be.false;
    });

    it("Should emit Finalized event", async function () {
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await expect(charityChain.finalizeCampaign(0))
        .to.emit(charityChain, "Finalized");
    });

    it("Should not allow double finalization", async function () {
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(charityChain.finalizeCampaign(0)).to.be.revertedWith(
        "Campaign already finalized"
      );
    });
  });

  describe("Withdrawal and Refunds", function () {
    beforeEach(async function () {
      const goalWei = ethers.parseEther("5");
      const durationSeconds = 24 * 60 * 60;
      await charityChain
        .connect(creator)
        .createCampaign("Fund Campaign", goalWei, durationSeconds);
    });

    it("Should allow creator to withdraw if successful", async function () {
      const donationAmount = ethers.parseEther("5");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      const initialBalance = await ethers.provider.getBalance(creator.address);

      const tx = await charityChain.connect(creator).withdrawFunds(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(creator.address);
      const balanceIncrease = finalBalance - initialBalance + gasUsed;

      expect(balanceIncrease).to.be.closeTo(donationAmount, ethers.parseEther("0.01"));
    });

    it("Should emit Withdrawn event", async function () {
      const donationAmount = ethers.parseEther("5");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(charityChain.connect(creator).withdrawFunds(0))
        .to.emit(charityChain, "Withdrawn")
        .withArgs(0, creator.address, donationAmount);
    });

    it("Should allow refunds if campaign failed", async function () {
      const donationAmount = ethers.parseEther("2");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      const initialBalance = await ethers.provider.getBalance(donor1.address);

      const tx = await charityChain.connect(donor1).refund(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(donor1.address);
      const balanceIncrease = finalBalance - initialBalance + gasUsed;

      expect(balanceIncrease).to.be.closeTo(donationAmount, ethers.parseEther("0.01"));
    });

    it("Should emit Refunded event", async function () {
      const donationAmount = ethers.parseEther("2");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(charityChain.connect(donor1).refund(0))
        .to.emit(charityChain, "Refunded")
        .withArgs(0, donor1.address, donationAmount);
    });

    it("Should not allow refund if campaign succeeded", async function () {
      const donationAmount = ethers.parseEther("5");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(charityChain.connect(donor1).refund(0)).to.be.revertedWith(
        "Campaign was successful"
      );
    });

    it("Should not allow double refund", async function () {
      const donationAmount = ethers.parseEther("2");

      await charityChain
        .connect(donor1)
        .contribute(0, { value: donationAmount });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await charityChain.connect(donor1).refund(0);

      await expect(charityChain.connect(donor1).refund(0)).to.be.revertedWith(
        "No contribution found"
      );
    });
  });

  describe("Access Control", function () {
    it("Should only allow creator to withdraw", async function () {
      const goalWei = ethers.parseEther("5");
      const durationSeconds = 24 * 60 * 60;

      await charityChain
        .connect(creator)
        .createCampaign("Fund Campaign", goalWei, durationSeconds);

      await charityChain
        .connect(donor1)
        .contribute(0, { value: goalWei });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(
        charityChain.connect(donor2).withdrawFunds(0)
      ).to.be.revertedWith("Only creator can withdraw");
    });

    it("Should only allow contributors to refund", async function () {
      const goalWei = ethers.parseEther("5");
      const durationSeconds = 24 * 60 * 60;

      await charityChain
        .connect(creator)
        .createCampaign("Fund Campaign", goalWei, durationSeconds);

      await charityChain
        .connect(donor1)
        .contribute(0, { value: ethers.parseEther("2") });

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      await charityChain.finalizeCampaign(0);

      await expect(charityChain.connect(donor2).refund(0)).to.be.revertedWith(
        "No contribution found"
      );
    });
  });
});
