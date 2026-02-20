// SPDX-License-Identifier: MIT
//
// P7: Protocol income, reserve injection, bad debt coverage (03 §1, 07). We receive tokens; the owner may withdraw. Bad debt path is documented in 05-liquidation-design.
// End-State DAO: set owner = Timelock for governance-controlled allocations (see docs/19, runbooks/treasury-and-budget).
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    /// @notice 07 alignment: per-asset reserve factor (basis points) for display/off-chain; set by owner.
    mapping(address => uint256) public reserveFactorByAsset;

    constructor() Ownable() {}

    /// @notice Sets the reserve factor for an asset so that display and off-chain tools stay consistent with the Pool. Only Owner.
    function setReserveFactor(address asset, uint256 factor) external onlyOwner {
        require(factor <= 10000, "reserve factor max 100%");
        reserveFactorByAsset[asset] = factor;
    }

    /// @notice Withdraw tokens to recipient (only owner).
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero to");
        IERC20(token).safeTransfer(to, amount);
    }
}
