// SPDX-License-Identifier: MIT
//
// Mock for audit L1: executeOperation returns false → Pool reverts FlashLoanCallbackFailed.
pragma solidity ^0.8.19;

import {IFlashLoanReceiver} from "../interfaces/IFlashLoanReceiver.sol";

contract MockFlashLoanReceiverReturnFalse is IFlashLoanReceiver {
    function executeOperation(
        address,
        uint256,
        uint256,
        address,
        bytes calldata
    ) external pure override returns (bool) {
        return false;
    }
}
