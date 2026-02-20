// SPDX-License-Identifier: MIT
//
// Linear rate strategy matching pre-P2 formula: supplyRate = BASE_RATE + utilization/10,
// borrowRate = BASE_RATE + 2 + utilization/5. Utilization in 0..100 (percent).
pragma solidity ^0.8.19;

import {IInterestRateStrategy} from "../interfaces/IInterestRateStrategy.sol";

contract LinearRateStrategy is IInterestRateStrategy {
    uint256 public constant BASE_RATE = 2; // 2% base

    function getSupplyRate(uint256 utilizationPercent) external pure override returns (uint256 supplyRatePercent) {
        if (utilizationPercent == 0) return BASE_RATE;
        return BASE_RATE + (utilizationPercent / 10);
    }

    function getBorrowRate(uint256 utilizationPercent) external pure override returns (uint256 borrowRatePercent) {
        if (utilizationPercent == 0) return BASE_RATE + 2;
        return BASE_RATE + 2 + (utilizationPercent / 5);
    }
}
