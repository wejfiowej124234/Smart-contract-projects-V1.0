// SPDX-License-Identifier: MIT
//
// Interest rate strategy interface (P2). Pool calls getSupplyRate/getBorrowRate
// with utilization to obtain rates; multiple implementations (linear, kink) possible.
pragma solidity ^0.8.19;

interface IInterestRateStrategy {
    /// @param utilizationPercent Utilization in 0..100 (e.g. 75 = 75%)
    function getSupplyRate(uint256 utilizationPercent) external view returns (uint256 supplyRatePercent);

    /// @param utilizationPercent Utilization in 0..100
    function getBorrowRate(uint256 utilizationPercent) external view returns (uint256 borrowRatePercent);
}
