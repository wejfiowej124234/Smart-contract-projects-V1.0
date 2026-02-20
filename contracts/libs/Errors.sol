// SPDX-License-Identifier: MIT
//
// Unified custom errors for all core, oracle, and token contracts. We use a single library so that revert reasons are consistent for auditing and for frontend error mapping.
pragma solidity ^0.8.19;

library Errors {
    // Common
    error ZeroAddress();
    error ZeroAmount();
    error NotConfigurator();
    error NotLiquidation();
    error NotPauser();
    error NotOwner();
    error AssetMustBePoolToken();
    error ReserveAlreadySet();
    error ReservePaused();
    error ReserveFactorMax();
    error ZeroStrategy();
    error ZeroAToken();
    error ZeroVariableDebtToken();

    // Supply / Withdraw / Borrow / Repay
    error AmountExceedsBorrow();
    error AmountExceedsSupply();
    error InsufficientSupply();
    error InsufficientLiquidity();
    error ExceedsBorrowingLimit();
    error WithdrawalWouldMakePositionUnhealthy();

    // Liquidation
    error NotLiquidatable();
    error ZeroRepay();
    error NoDebt();
    error ExceedsCloseFactor();
    error ExceedsDebt();
    error SeizeExceedsSupply();
    error ATokenPathRequired();
    error CloseFactorZero();
    error CloseFactorMax();
    error LTVZero();
    error LiquidationThresholdZero();
    error LiquidationBonusMax();
    error OraclePriceZero();

    // 07: setUserUseReserveAsCollateral (single-asset)
    error CannotDisableCollateral();

    // 07: FlashLoan
    error FlashLoanCallbackFailed();
    error FlashLoanRepayFailed();
}
