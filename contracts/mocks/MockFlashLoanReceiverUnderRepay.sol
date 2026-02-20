// SPDX-License-Identifier: MIT
//
// Mock for audit L1: approves less than amount+fee so Pool reverts FlashLoanRepayFailed.
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFlashLoanReceiver} from "../interfaces/IFlashLoanReceiver.sol";

contract MockFlashLoanReceiverUnderRepay is IFlashLoanReceiver {
    /// @notice Approves only amount (missing fee) so pool balance check fails.
    function executeOperation(
        address asset,
        uint256 amount,
        uint256,
        address,
        bytes calldata
    ) external override returns (bool) {
        IERC20(asset).approve(msg.sender, amount);
        return true;
    }
}
