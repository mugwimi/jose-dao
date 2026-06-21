// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./GovernanceToken.sol";

/**
 * @title JoseDAO
 * @author Jose
 * @notice On-chain governance — token holders create and vote on proposals
 * @dev Token-weighted voting with quorum, voting period, and timelock execution
 */
contract JoseDAO {

    GovernanceToken public governanceToken;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant TIMELOCK_DELAY = 1 days;
    uint256 public constant QUORUM_PERCENT = 10; // 10% of total supply must vote

    enum ProposalState { Active, Defeated, Succeeded, Queued, Executed, Expired }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        uint256 queuedAt;
        bool executed;
        bool canceled;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteWeight;

    event ProposalCreated(
        uint256 id,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalQueued(uint256 indexed proposalId, uint256 queuedAt);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor(address _governanceToken) {
        governanceToken = GovernanceToken(_governanceToken);
    }

    /**
     * @notice Create a new proposal — must hold governance tokens
     */
    function createProposal(
        string memory _title,
        string memory _description
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) > 0,
            "Must hold governance tokens to propose"
        );
        require(bytes(_title).length > 0, "Title cannot be empty");

        proposalCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            title: _title,
            description: _description,
            votesFor: 0,
            votesAgainst: 0,
            startTime: startTime,
            endTime: endTime,
            queuedAt: 0,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalCount, msg.sender, _title, startTime, endTime);
        return proposalCount;
    }

    /**
     * @notice Vote on a proposal — weight is based on token balance
     */
    function castVote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id > 0, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting has ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(!proposal.canceled, "Proposal canceled");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[_proposalId][msg.sender] = true;
        voteWeight[_proposalId][msg.sender] = weight;

        if (_support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /**
     * @notice Queue a successful proposal for execution after timelock
     */
    // ✅ Fixed — check "already queued" first
function queueProposal(uint256 _proposalId) external {
    Proposal storage proposal = proposals[_proposalId];

    require(proposal.id > 0, "Proposal does not exist");
    require(block.timestamp > proposal.endTime, "Voting still active");
    require(proposal.queuedAt == 0, "Already queued");
    require(getProposalState(_proposalId) == ProposalState.Succeeded, "Proposal did not succeed");

    proposal.queuedAt = block.timestamp;
    emit ProposalQueued(_proposalId, block.timestamp);
}
    /**
     * @notice Execute a queued proposal after timelock delay passes
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.queuedAt > 0, "Proposal not queued");
        require(
            block.timestamp >= proposal.queuedAt + TIMELOCK_DELAY,
            "Timelock has not passed"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");

        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }

    /**
     * @notice Proposer can cancel their own proposal before it ends
     */
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.proposer == msg.sender, "Only proposer can cancel");
        require(!proposal.executed, "Already executed");

        proposal.canceled = true;
        emit ProposalCanceled(_proposalId);
    }

    /**
     * @notice Get the current state of a proposal
     */
    function getProposalState(uint256 _proposalId) public view returns (ProposalState) {
        Proposal memory proposal = proposals[_proposalId];
        require(proposal.id > 0, "Proposal does not exist");

        if (proposal.canceled) return ProposalState.Defeated;
        if (proposal.executed) return ProposalState.Executed;

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 quorumRequired = (governanceToken.totalSupply() * QUORUM_PERCENT) / 100;

        if (totalVotes < quorumRequired) {
            return ProposalState.Defeated;
        }

        if (proposal.votesFor <= proposal.votesAgainst) {
            return ProposalState.Defeated;
        }

        if (proposal.queuedAt == 0) {
            return ProposalState.Succeeded;
        }

        if (block.timestamp < proposal.queuedAt + TIMELOCK_DELAY) {
            return ProposalState.Queued;
        }

        return ProposalState.Succeeded;
    }

    /**
     * @notice Get quorum required for current token supply
     */
    function getQuorumRequired() external view returns (uint256) {
        return (governanceToken.totalSupply() * QUORUM_PERCENT) / 100;
    }

    /**
     * @notice Get all proposal IDs
     */
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
}