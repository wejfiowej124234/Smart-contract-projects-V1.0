// SPDX-License-Identifier: MIT
//
// PoolConfigurator (P4): only the Admin may call these functions. Routes initReserve, setReserveLTV,
// setReserveLiquidationThreshold, setReserveInterestRateStrategy to the pool so that risk parameters are changed in one place. Until P9 governance, multisig or Admin can be used.
pragma solidity ^0.8.19;

interface ILendingPoolConfigurator {
    function initReserve(address asset, uint256 ltv, uint256 lt, address strategy) external;
    function setReserveLTV(address asset, uint256 ltv) external;
    function setReserveLiquidationThreshold(address asset, uint256 lt) external;
    function setReserveInterestRateStrategy(address asset, address strategy) external;
    function setReserveCloseFactor(address asset, uint256 closeFactor) external;
    function setReserveLiquidationBonus(address asset, uint256 liquidationBonus) external;
    function setReservePause(address asset, bool paused) external;
    function setReserveFactor(address asset, uint256 reserveFactor) external;
}

contract PoolConfigurator {
    address public immutable pool;
    address public admin;

    event AdminSet(address indexed previousAdmin, address indexed newAdmin);
    event ReserveInitialized(address indexed asset, uint256 ltv, uint256 lt, address strategy);
    event ReserveLTVSet(address indexed asset, uint256 ltv);
    event ReserveLiquidationThresholdSet(address indexed asset, uint256 lt);
    event ReserveInterestRateStrategySet(address indexed asset, address strategy);
    event ReserveCloseFactorSet(address indexed asset, uint256 closeFactor);
    event ReserveLiquidationBonusSet(address indexed asset, uint256 liquidationBonus);
    event ReservePauseSet(address indexed asset, bool paused);
    event ReserveFactorSet(address indexed asset, uint256 reserveFactor);

    constructor(address _pool, address _admin) {
        require(_pool != address(0), "zero pool");
        require(_admin != address(0), "zero admin");
        pool = _pool;
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "zero admin");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminSet(oldAdmin, newAdmin);
    }

    function initReserves(address asset, uint256 ltv, uint256 lt, address strategy) external onlyAdmin {
        ILendingPoolConfigurator(pool).initReserve(asset, ltv, lt, strategy);
        emit ReserveInitialized(asset, ltv, lt, strategy);
    }

    function setLTV(address asset, uint256 ltv) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveLTV(asset, ltv);
        emit ReserveLTVSet(asset, ltv);
    }

    function setLiquidationThreshold(address asset, uint256 lt) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveLiquidationThreshold(asset, lt);
        emit ReserveLiquidationThresholdSet(asset, lt);
    }

    function setInterestRateStrategy(address asset, address strategy) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveInterestRateStrategy(asset, strategy);
        emit ReserveInterestRateStrategySet(asset, strategy);
    }

    function setCloseFactor(address asset, uint256 closeFactor) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveCloseFactor(asset, closeFactor);
        emit ReserveCloseFactorSet(asset, closeFactor);
    }

    function setLiquidationBonus(address asset, uint256 liquidationBonus) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveLiquidationBonus(asset, liquidationBonus);
        emit ReserveLiquidationBonusSet(asset, liquidationBonus);
    }

    /// @notice 07 alignment: Pause/unpause a reserve; only Admin.
    function setReservePause(address asset, bool paused) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReservePause(asset, paused);
        emit ReservePauseSet(asset, paused);
    }

    /// @notice 07 alignment: Set reserve factor (basis points); only Admin.
    function setReserveFactor(address asset, uint256 value) external onlyAdmin {
        ILendingPoolConfigurator(pool).setReserveFactor(asset, value);
        emit ReserveFactorSet(asset, value);
    }
}
