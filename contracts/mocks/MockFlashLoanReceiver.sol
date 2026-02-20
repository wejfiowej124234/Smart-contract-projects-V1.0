// SPDX-License-Identifier: MIT
//
// Mock flash loan receiver for tests: approves pool for amount+fee and returns true.
// Must be funded with (amount + fee) before executeFlashLoan (pool sends amount; receiver must have fee extra).
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFlashLoanReceiver} from "../interfaces/IFlashLoanReceiver.sol";

contract MockFlashLoanReceiver is IFlashLoanReceiver {
    /// @notice In executeOperation approve the caller (pool) for amount + fee so pool can pull back.
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        address,
        bytes calldata
    ) external override returns (bool) {
        IERC20(asset).approve(msg.sender, amount + fee);
        return true;
    }
}
