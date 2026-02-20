// SPDX-License-Identifier: MIT
//
// ReserveLogic library (P2/P5): utilization, rate update, index cumulation.
pragma solidity ^0.8.19;

import {IInterestRateStrategy} from "../interfaces/IInterestRateStrategy.sol";
import {WadRayMath} from "../libs/WadRayMath.sol";

library ReserveLogic {
    uint256 internal constant SECONDS_PER_YEAR = 365 * 24 * 3600;
    uint256 internal constant RAY = 1e27;

    /// @notice 07: Normalized income (liquidity index in ray). Caller passes current index.
    function getNormalizedIncome(uint256 liquidityIndex) internal pure returns (uint256) {
        return liquidityIndex == 0 ? RAY : liquidityIndex;
    }

    /// @notice 07: Normalized debt (borrow index in ray). Caller passes current index.
    function getNormalizedDebt(uint256 borrowIndex) internal pure returns (uint256) {
        return borrowIndex == 0 ? RAY : borrowIndex;
    }

    /// @notice 07: Protocol accrued amount from supply interest (reserveFactor share). Pure view for mintToTreasury path.
    /// @param totalSupply Total scaled supply (or wei) at time of index update
    /// @param indexOld Previous liquidity index (ray)
    /// @param indexNew New liquidity index (ray)
    /// @param reserveFactorBps Reserve factor in basis points (e.g. 1000 = 10%)
    function computeProtocolAccrued(
        uint256 totalSupply,
        uint256 indexOld,
        uint256 indexNew,
        uint256 reserveFactorBps
    ) internal pure returns (uint256 amount) {
        if (indexNew <= indexOld || reserveFactorBps == 0) return 0;
        uint256 delta = indexNew - indexOld;
        amount = (totalSupply * delta) / RAY;
        amount = (amount * reserveFactorBps) / 10000;
    }

    /// @notice Compute utilization in percent (0..100). totalSupply 0 => 0.
    function getUtilization(uint256 totalSupply, uint256 totalBorrow) internal pure returns (uint256 utilizationPercent) {
        if (totalSupply == 0) return 0;
        return (totalBorrow * 100) / totalSupply;
    }

    /// @notice Get utilization and rates from strategy; caller writes to state.
    function updateRates(
        uint256 totalSupply,
        uint256 totalBorrow,
        IInterestRateStrategy strategy
    ) internal view returns (uint256 util, uint256 supplyRate, uint256 borrowRate) {
        util = getUtilization(totalSupply, totalBorrow);
        supplyRate = strategy.getSupplyRate(util);
        borrowRate = strategy.getBorrowRate(util);
    }

    /// @notice P5: Convert rate (percent per year, e.g. 2 = 2%) to ray per second.
    function ratePercentPerYearToRayPerSecond(uint256 ratePercent) internal pure returns (uint256) {
        return (ratePercent * 1e27) / (100 * SECONDS_PER_YEAR);
    }

    /// @notice P5: Cumulate liquidity index. index and rate in ray; ratePercent is annual percent.
    function cumulateToLiquidityIndex(uint256 index, uint256 ratePercent, uint256 timeDelta) internal pure returns (uint256) {
        uint256 ratePerSecondRay = ratePercentPerYearToRayPerSecond(ratePercent);
        return WadRayMath.cumulateIndex(index, ratePerSecondRay, timeDelta);
    }

    /// @notice P5: Cumulate borrow index.
    function cumulateToBorrowIndex(uint256 index, uint256 ratePercent, uint256 timeDelta) internal pure returns (uint256) {
        uint256 ratePerSecondRay = ratePercentPerYearToRayPerSecond(ratePercent);
        return WadRayMath.cumulateIndex(index, ratePerSecondRay, timeDelta);
    }
}
