// SPDX-License-Identifier: MIT
//
// Test wrapper for RiskEngine library (P7 unit tests).
pragma solidity ^0.8.19;

import {RiskEngine} from "../core/RiskEngine.sol";

contract TestRiskEngine {
    function calculateHealthFactor(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 liquidationThreshold
    ) external pure returns (uint256) {
        return RiskEngine.calculateHealthFactor(collateralValue, debtValue, liquidationThreshold);
    }

    function isLiquidatable(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 liquidationThreshold
    ) external pure returns (bool) {
        return RiskEngine.isLiquidatable(collateralValue, debtValue, liquidationThreshold);
    }

    function getMaxBorrow(uint256 collateralValue, uint256 ltvPercent) external pure returns (uint256) {
        return RiskEngine.getMaxBorrow(collateralValue, ltvPercent);
    }

    function getMaxWithdraw(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 ltvPercent
    ) external pure returns (uint256) {
        return RiskEngine.getMaxWithdraw(collateralValue, debtValue, ltvPercent);
    }
}
