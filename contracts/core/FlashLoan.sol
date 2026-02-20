// SPDX-License-Identifier: MIT
//
// 07 optional: Flash loan placeholder. executeFlashLoan (transfer out → callback → reclaim + fee) to be implemented.
pragma solidity ^0.8.19;

/// @notice Placeholder for 07 FlashLoan (executeFlashLoan; fee, whitelist, cap). Revert until implemented.
contract FlashLoan {
    error NotImplemented();

    /// @notice Execute flash loan: lend asset to receiver, callback, reclaim amount + fee. 07 optional.
    function executeFlashLoan(
        address /* asset */,
        uint256 /* amount */,
        address /* receiver */,
        bytes calldata /* data */
    ) external virtual {
        revert NotImplemented();
    }
}
