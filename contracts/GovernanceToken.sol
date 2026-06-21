// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title GovernanceToken
 * @author Jose
 * @notice ERC-20 token with on-chain voting power for JoseDAO
 * @dev Extends ERC20Votes — tracks voting power as token balance changes
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {

    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    constructor(uint256 initialSupply)
        ERC20("JoseGovernance", "JGOV")
        ERC20Permit("JoseGovernance")
    {
        require(
            initialSupply * 10 ** 18 <= MAX_SUPPLY,
            "Initial supply exceeds max supply"
        );
        _mint(msg.sender, initialSupply * 10 ** 18);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}