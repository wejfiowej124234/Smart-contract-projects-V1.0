// SPDX-License-Identifier: MIT
//
// P7: Pure view helpers for health factor, liquidatability, and max borrow/withdraw. The pool and liquidation contract both use this library so that thresholds and limits are computed consistently (03 §1, 07).
pragma solidity ^0.8.19;

library RiskEngine {
    /// @param collateralValue Collateral value (token units or 8 decimals when oracle)
    /// @param debtValue Debt value (same unit as collateralValue)
    /// @param liquidationThreshold Percent e.g. 80 = 80%
    /// @return healthFactor Scaled by 100 (e.g. 160 = 1.6). Returns type(uint256).max when there is no debt so that the position is never considered liquidatable.
    function calculateHealthFactor(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 liquidationThreshold
    ) internal pure returns (uint256 healthFactor) {
        if (debtValue == 0) return type(uint256).max;
        return (collateralValue * liquidationThreshold) / debtValue;
    }

    /// @return True if the position is liquidatable: debt > 0 and (collateralValue * LT) < (debtValue * 100).
    function isLiquidatable(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 liquidationThreshold
    ) internal pure returns (bool) {
        if (debtValue == 0) return false;
        return (collateralValue * liquidationThreshold) < (debtValue * 100);
    }

    /// @param ltvPercent e.g. 75 = 75%
    function getMaxBorrow(uint256 collateralValue, uint256 ltvPercent) internal pure returns (uint256) {
        return (collateralValue * ltvPercent) / 100;
    }

    /// @return Maximum withdrawable amount such that after withdrawal the health factor would be at least 100, so that the position remains safe.
    function getMaxWithdraw(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 ltvPercent
    ) internal pure returns (uint256) {
        if (debtValue == 0) return collateralValue;
        uint256 minRequired = (debtValue * 100) / ltvPercent;
        if (collateralValue <= minRequired) return 0;
        return collateralValue - minRequired;
    }
}
