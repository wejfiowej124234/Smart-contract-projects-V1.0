// SPDX-License-Identifier: MIT
//
// 07: Flash loan receiver callback. Pool calls this after sending asset to receiver; receiver must repay amount + fee.
pragma solidity ^0.8.19;

interface IFlashLoanReceiver {
    /// @notice Called by Pool after sending asset to this contract. Must approve Pool for (amount + fee) and return true.
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata data
    ) external returns (bool);
}
