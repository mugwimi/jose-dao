const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JoseDAO Governance System", function () {
  let token, dao, owner, voter1, voter2, voter3, stranger;

  const INITIAL_SUPPLY = 100_000n;
  const toWei = (n) => ethers.parseEther(String(n));
  const ONE_DAY = 24 * 60 * 60;
  const THREE_DAYS = 3 * ONE_DAY;

  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, stranger] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GovernanceToken");
    token = await Token.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    const DAO = await ethers.getContractFactory("JoseDAO");
    dao = await DAO.deploy(await token.getAddress());
    await dao.waitForDeployment();

    // Distribute tokens for voting tests
    await token.transfer(voter1.address, toWei(20000)); // 20%
    await token.transfer(voter2.address, toWei(15000)); // 15%
    await token.transfer(voter3.address, toWei(5000));  // 5%
  });

  // ── Deployment ────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets the governance token correctly", async function () {
      expect(await dao.governanceToken()).to.equal(await token.getAddress());
    });

    it("starts with zero proposals", async function () {
      expect(await dao.proposalCount()).to.equal(0n);
    });

    it("has correct voting period", async function () {
      expect(await dao.VOTING_PERIOD()).to.equal(BigInt(THREE_DAYS));
    });

    it("has correct timelock delay", async function () {
      expect(await dao.TIMELOCK_DELAY()).to.equal(BigInt(ONE_DAY));
    });

    it("has correct quorum percent", async function () {
      expect(await dao.QUORUM_PERCENT()).to.equal(10n);
    });
  });

  // ── Creating proposals ───────────────────────────────────────────────────
  describe("Creating proposals", function () {
    it("token holder can create a proposal", async function () {
      await dao.connect(voter1).createProposal("Increase treasury", "Move funds to staking");
      expect(await dao.proposalCount()).to.equal(1n);
    });

    it("emits ProposalCreated event", async function () {
      await expect(
        dao.connect(voter1).createProposal("Test proposal", "Description here")
      ).to.emit(dao, "ProposalCreated");
    });

    it("stores proposal data correctly", async function () {
      await dao.connect(voter1).createProposal("My Proposal", "My Description");
      const proposal = await dao.proposals(1);
      expect(proposal.title).to.equal("My Proposal");
      expect(proposal.description).to.equal("My Description");
      expect(proposal.proposer).to.equal(voter1.address);
    });

    it("non-token-holder cannot create a proposal", async function () {
      await expect(
        dao.connect(stranger).createProposal("Bad proposal", "Should fail")
      ).to.be.revertedWith("Must hold governance tokens to propose");
    });

    it("rejects empty title", async function () {
      await expect(
        dao.connect(voter1).createProposal("", "Description")
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("sets correct start and end time", async function () {
      const tx = await dao.connect(voter1).createProposal("Title", "Desc");
      const block = await ethers.provider.getBlock(tx.blockNumber);
      const proposal = await dao.proposals(1);
      expect(proposal.startTime).to.equal(BigInt(block.timestamp));
      expect(proposal.endTime).to.equal(BigInt(block.timestamp) + BigInt(THREE_DAYS));
    });

    it("proposal starts in Active state", async function () {
      await dao.connect(voter1).createProposal("Title", "Desc");
      expect(await dao.getProposalState(1)).to.equal(0); // Active
    });
  });

  // ── Voting ────────────────────────────────────────────────────────────────
  describe("Voting", function () {
    beforeEach(async function () {
      await dao.connect(voter1).createProposal("Vote test", "Description");
    });

    it("token holder can vote for", async function () {
      await dao.connect(voter1).castVote(1, true);
      const proposal = await dao.proposals(1);
      expect(proposal.votesFor).to.equal(toWei(20000));
    });

    it("token holder can vote against", async function () {
      await dao.connect(voter2).castVote(1, false);
      const proposal = await dao.proposals(1);
      expect(proposal.votesAgainst).to.equal(toWei(15000));
    });

    it("vote weight equals token balance", async function () {
      await dao.connect(voter1).castVote(1, true);
      expect(await dao.voteWeight(1, voter1.address)).to.equal(toWei(20000));
    });

    it("emits VoteCast event", async function () {
      await expect(dao.connect(voter1).castVote(1, true))
        .to.emit(dao, "VoteCast")
        .withArgs(1, voter1.address, true, toWei(20000));
    });

    it("marks voter as hasVoted", async function () {
      await dao.connect(voter1).castVote(1, true);
      expect(await dao.hasVoted(1, voter1.address)).to.equal(true);
    });

    it("cannot vote twice", async function () {
      await dao.connect(voter1).castVote(1, true);
      await expect(
        dao.connect(voter1).castVote(1, true)
      ).to.be.revertedWith("Already voted");
    });

    it("cannot vote with zero token balance", async function () {
      await expect(
        dao.connect(stranger).castVote(1, true)
      ).to.be.revertedWith("No voting power");
    });

    it("cannot vote on non-existent proposal", async function () {
      await expect(
        dao.connect(voter1).castVote(99, true)
      ).to.be.revertedWith("Proposal does not exist");
    });

    it("cannot vote after voting period ends", async function () {
      await increaseTime(THREE_DAYS + 1);
      await expect(
        dao.connect(voter1).castVote(1, true)
      ).to.be.revertedWith("Voting has ended");
    });

    it("accumulates votes from multiple voters", async function () {
      await dao.connect(voter1).castVote(1, true);
      await dao.connect(voter2).castVote(1, true);
      const proposal = await dao.proposals(1);
      expect(proposal.votesFor).to.equal(toWei(35000));
    });
  });

  // ── Proposal state transitions ──────────────────────────────────────────
  describe("Proposal states", function () {
    beforeEach(async function () {
      await dao.connect(voter1).createProposal("State test", "Description");
    });

    it("is Active during voting period", async function () {
      expect(await dao.getProposalState(1)).to.equal(0); // Active
    });

    it("is Defeated if quorum not met", async function () {
      await dao.connect(voter3).castVote(1, true); // only 5% — below 10% quorum
      await increaseTime(THREE_DAYS + 1);
      expect(await dao.getProposalState(1)).to.equal(1); // Defeated
    });

    it("is Defeated if against votes win", async function () {
      await dao.connect(voter1).castVote(1, false); // 20% against
      await dao.connect(voter2).castVote(1, true);  // 15% for
      await increaseTime(THREE_DAYS + 1);
      expect(await dao.getProposalState(1)).to.equal(1); // Defeated
    });

    it("is Succeeded if quorum met and for-votes win", async function () {
      await dao.connect(voter1).castVote(1, true); // 20% for — meets 10% quorum
      await increaseTime(THREE_DAYS + 1);
      expect(await dao.getProposalState(1)).to.equal(2); // Succeeded
    });
  });

  // ── Queue and execute ────────────────────────────────────────────────────
  describe("Queue and execute", function () {
    beforeEach(async function () {
      await dao.connect(voter1).createProposal("Execute test", "Description");
      await dao.connect(voter1).castVote(1, true);
      await dao.connect(voter2).castVote(1, true);
      await increaseTime(THREE_DAYS + 1);
    });

    it("can queue a succeeded proposal", async function () {
      await dao.queueProposal(1);
      const proposal = await dao.proposals(1);
      expect(proposal.queuedAt).to.be.greaterThan(0n);
    });

    it("emits ProposalQueued event", async function () {
      await expect(dao.queueProposal(1)).to.emit(dao, "ProposalQueued");
    });

    it("cannot queue twice", async function () {
      await dao.queueProposal(1);
      await expect(dao.queueProposal(1)).to.be.revertedWith("Already queued");
    });

    it("cannot execute before timelock passes", async function () {
      await dao.queueProposal(1);
      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Timelock has not passed");
    });

    it("can execute after timelock passes", async function () {
      await dao.queueProposal(1);
      await increaseTime(ONE_DAY + 1);
      await dao.executeProposal(1);
      const proposal = await dao.proposals(1);
      expect(proposal.executed).to.equal(true);
    });

    it("emits ProposalExecuted event", async function () {
      await dao.queueProposal(1);
      await increaseTime(ONE_DAY + 1);
      await expect(dao.executeProposal(1)).to.emit(dao, "ProposalExecuted");
    });

    it("cannot execute twice", async function () {
      await dao.queueProposal(1);
      await increaseTime(ONE_DAY + 1);
      await dao.executeProposal(1);
      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Already executed");
    });

    it("cannot execute without queueing first", async function () {
      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Proposal not queued");
    });
  });

  // ── Cancel proposal ──────────────────────────────────────────────────────
  describe("Cancel proposal", function () {
    beforeEach(async function () {
      await dao.connect(voter1).createProposal("Cancel test", "Description");
    });

    it("proposer can cancel their own proposal", async function () {
      await dao.connect(voter1).cancelProposal(1);
      const proposal = await dao.proposals(1);
      expect(proposal.canceled).to.equal(true);
    });

    it("emits ProposalCanceled event", async function () {
      await expect(dao.connect(voter1).cancelProposal(1))
        .to.emit(dao, "ProposalCanceled");
    });

    it("non-proposer cannot cancel", async function () {
      await expect(
        dao.connect(voter2).cancelProposal(1)
      ).to.be.revertedWith("Only proposer can cancel");
    });

    it("canceled proposal cannot be voted on", async function () {
      await dao.connect(voter1).cancelProposal(1);
      await expect(
        dao.connect(voter2).castVote(1, true)
      ).to.be.revertedWith("Proposal canceled");
    });

    it("canceled proposal state is Defeated", async function () {
      await dao.connect(voter1).cancelProposal(1);
      expect(await dao.getProposalState(1)).to.equal(1); // Defeated
    });
  });

  // ── Quorum calculation ───────────────────────────────────────────────────
  describe("Quorum", function () {
    it("calculates quorum as 10% of total supply", async function () {
      const totalSupply = await token.totalSupply();
      const expectedQuorum = totalSupply / 10n;
      expect(await dao.getQuorumRequired()).to.equal(expectedQuorum);
    });
  });
});