// SPDX-License-Identifier: MIT
//
// P7: Entry point for liquidators. liquidationCall(borrower, repayAmount) checks liquidatability then calls the pool's executeLiquidation.
// Close factor and liquidation bonus are enforced by the pool (03 §1, 07). The liquidator must approve the pool for repayAmount.
pragma solidity ^0.8.19;

interface ILendingPoolLiquidation {
    function isLiquidatable(address borrower) external view returns (bool);
    function getUserPosition(address user) external view returns (
        uint256 supplied,
        uint256 borrowed,
        uint256 collateralValue,
        uint256 healthFactor
    );
    function executeLiquidation(address borrower, address liquidator, uint256 repayAmount) external;
}

contract Liquidation {
    ILendingPoolLiquidation public immutable pool;

    constructor(address _pool) {
        require(_pool != address(0), "zero pool");
        pool = ILendingPoolLiquidation(_pool);
    }

    /// @notice Liquidates up to repayAmount of the borrower's debt and transfers collateral to the liquidator. Reverts if the position is not liquidatable or repayAmount is invalid.
    /// @param borrower Borrower whose position is underwater (HF < 100).
    /// @param repayAmount Debt to repay; liquidator must approve the pool for this amount.
    function liquidationCall(address borrower, uint256 repayAmount) external {
        require(pool.isLiquidatable(borrower), "not liquidatable");
        (, uint256 borrowed, , ) = pool.getUserPosition(borrower);
        require(repayAmount > 0 && repayAmount <= borrowed, "invalid repayAmount");
        pool.executeLiquidation(borrower, msg.sender, repayAmount);
    }
}
