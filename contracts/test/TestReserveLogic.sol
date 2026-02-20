// SPDX-License-Identifier: MIT
// Test wrapper for ReserveLogic library (P2 unit tests).
pragma solidity ^0.8.19;

import {IInterestRateStrategy} from "../interfaces/IInterestRateStrategy.sol";
import {ReserveLogic} from "../core/ReserveLogic.sol";

contract TestReserveLogic {
    function getUtilization(uint256 totalSupply, uint256 totalBorrow) external pure returns (uint256) {
        return ReserveLogic.getUtilization(totalSupply, totalBorrow);
    }

    function updateRates(
        uint256 totalSupply,
        uint256 totalBorrow,
        IInterestRateStrategy strategy
    ) external view returns (uint256 util, uint256 supplyRate, uint256 borrowRate) {
        return ReserveLogic.updateRates(totalSupply, totalBorrow, strategy);
    }
}
