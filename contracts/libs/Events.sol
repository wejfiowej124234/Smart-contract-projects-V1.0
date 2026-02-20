// SPDX-License-Identifier: MIT
//
// 07 alignment: Unified event definitions for Pool (audit & frontend).
// Inherit this in LendingPoolImpl and emit in supply/withdraw/borrow/repay/executeLiquidation.
pragma solidity ^0.8.19;

abstract contract PoolEvents {
    event Supplied(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event Borrowed(address indexed user, uint256 amount, uint256 timestamp);
    event Repaid(address indexed user, uint256 amount, uint256 timestamp);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 repayAmount, uint256 collateralSeized);
    event FlashLoan(address indexed receiver, address indexed asset, uint256 amount, uint256 fee);
}
