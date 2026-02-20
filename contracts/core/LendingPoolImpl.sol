// File: contracts/core/LendingPoolImpl.sol
// SPDX-License-Identifier: MIT
//
// Lending pool implementation used behind a transparent proxy (P1). P3: only PAUSER can pause; Owner grants/revokes PAUSER.
// P4: LTV/LT/strategy are set by the Configurator so that only a single privileged contract can change risk parameters.
// P5: when aToken and variableDebtToken are set, supply/withdraw/borrow/repay use them for interest accrual.
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeTransfer} from "../libs/SafeTransfer.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IInterestRateStrategy} from "../interfaces/IInterestRateStrategy.sol";
import {ReserveLogic} from "./ReserveLogic.sol";
import {IOracleRouter} from "../interfaces/IOracleRouter.sol";
import {RiskEngine} from "./RiskEngine.sol";
import {Errors} from "../libs/Errors.sol";
import {PoolEvents} from "../libs/Events.sol";
import {IFlashLoanReceiver} from "../interfaces/IFlashLoanReceiver.sol";

interface IAToken {
    function totalSupply() external view returns (uint256);
    function totalScaledSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function mint(address user, uint256 amount) external;
    function burn(address user, uint256 amount) external;
}

interface IVariableDebtToken {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function mint(address user, uint256 amount) external;
    function burn(address user, uint256 amount) external;
}

contract LendingPoolImpl is Initializable, Ownable, Pausable, ReentrancyGuard, PoolEvents {
    IERC20 public token;

    // Market state
    uint256 public totalSupply;
    uint256 public totalBorrow;
    uint256 public utilizationRate;
    uint256 public supplyRate;
    uint256 public borrowRate;

    // User positions
    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 collateralValue;
        uint256 healthFactor;
    }

    mapping(address => UserPosition) public positions;
    mapping(address => uint256) public userSupply;
    mapping(address => uint256) public userBorrow;

    // P2: interest rate strategy (append storage for proxy layout)
    IInterestRateStrategy public interestRateStrategy;

    // P3: PAUSER role (append storage); Admin = owner, grants/revokes PAUSER
    mapping(address => bool) private _pausers;

    // P4: Configurator-only config; reserve list for multi-asset call path (single asset for now)
    address public configurator;
    uint256 public ltvRatio;       // e.g. 75 = 75%
    uint256 public liquidationThreshold; // e.g. 80 = 80%
    address[] public reserveList;

    // P5: aToken/variableDebtToken + index (append storage)
    uint256 public liquidityIndex; // ray 1e27
    uint256 public borrowIndex;    // ray 1e27
    uint256 public lastUpdateTimestamp;
    address public aToken;
    address public variableDebtToken;

    // P6: optional oracle for collateralValue/debtValue/HF (append storage)
    address public oracleRouter;

    // P7: liquidation (append storage)
    address public liquidationContract;
    uint256 public closeFactor;       // e.g. 50 = 50%
    uint256 public liquidationBonus;  // e.g. 5 = 5%

    // 07 alignment: per-reserve pause (single asset: one entry)
    mapping(address => bool) public reservePaused;

    // 07 alignment: protocol income (reserve factor in basis points, e.g. 1000 = 10%); treasury address
    uint256 public reserveFactor;   // basis points, 0 = no protocol cut
    address public treasuryAddress;

    // Constants
    uint256 public constant UTILIZATION_MULTIPLIER = 20;
    uint256 public constant RAY = 1e27;
    /// @notice Flash loan fee in basis points (e.g. 9 = 0.09%). We charge this to discourage flash-loan abuse while allowing legitimate use.
    uint256 public constant FLASH_LOAN_FEE_BPS = 9;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _token, address _owner, address _strategy, address _configurator) public initializer {
        if (_token == address(0)) revert Errors.ZeroAddress();
        if (_owner == address(0)) revert Errors.ZeroAddress();
        if (_strategy == address(0)) revert Errors.ZeroAddress();
        if (_configurator == address(0)) revert Errors.ZeroAddress();
        token = IERC20(_token);
        interestRateStrategy = IInterestRateStrategy(_strategy);
        configurator = _configurator;
        ltvRatio = 75;
        liquidationThreshold = 80;
        closeFactor = 50;
        liquidationBonus = 5;
        reserveList.push(_token);
        ( , supplyRate, borrowRate) = ReserveLogic.updateRates(0, 0, interestRateStrategy);
        _transferOwnership(_owner);
    }

    /// @notice Sets the Configurator address. Only the Owner may call this so that reserve and risk settings remain under strict access control.
    function setConfigurator(address _configurator) external onlyOwner {
        if (_configurator == address(0)) revert Errors.ZeroAddress();
        configurator = _configurator;
    }

    modifier onlyConfigurator() {
        if (msg.sender != configurator) revert Errors.NotConfigurator();
        _;
    }

    modifier onlyLiquidation() {
        if (msg.sender != liquidationContract) revert Errors.NotLiquidation();
        _;
    }

    /// @notice Initializes the single reserve (asset, LTV, LT, interest rate strategy). Restricted to Configurator. We require ltv and lt > 0 to avoid division-by-zero and to prevent the entire book from being liquidatable (Final Gate B10/B7).
    function initReserve(address asset, uint256 ltv, uint256 lt, address strategy) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (ltv == 0) revert Errors.LTVZero();
        if (lt == 0) revert Errors.LiquidationThresholdZero();
        if (reserveList.length != 0 && reserveList[0] != asset) revert Errors.ReserveAlreadySet();
        if (reserveList.length == 0) reserveList.push(asset);
        ltvRatio = ltv;
        liquidationThreshold = lt;
        interestRateStrategy = IInterestRateStrategy(strategy);
    }

    /// @notice P4: Set LTV for reserve; only Configurator.
    /// Final Gate B10: ltv > 0 to avoid div-by-zero in calculateMaxWithdraw.
    function setReserveLTV(address asset, uint256 ltv) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (ltv == 0) revert Errors.LTVZero();
        ltvRatio = ltv;
    }

    /// @notice P4: Set liquidation threshold; only Configurator.
    /// Final Gate B7: lt > 0 so not everyone is liquidatable.
    function setReserveLiquidationThreshold(address asset, uint256 lt) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (lt == 0) revert Errors.LiquidationThresholdZero();
        liquidationThreshold = lt;
    }

    /// @notice 07 alignment: Pause/unpause a reserve; only Configurator. Single-asset: only pool token.
    function setReservePause(address asset, bool paused) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        reservePaused[asset] = paused;
    }

    /// @notice 07 alignment: Set reserve factor (basis points, e.g. 1000 = 10%); only Configurator. Reduces depositor rate by this share.
    function setReserveFactor(address asset, uint256 value) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (value > 10000) revert Errors.ReserveFactorMax();
        reserveFactor = value;
    }

    /// @notice 07 alignment: Set treasury for protocol income; only Owner. Zero address not allowed (audit M2).
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert Errors.ZeroAddress();
        treasuryAddress = _treasury;
    }

    /// @notice P4: Set interest rate strategy for reserve; only Configurator.
    function setReserveInterestRateStrategy(address asset, address strategy) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (strategy == address(0)) revert Errors.ZeroStrategy();
        interestRateStrategy = IInterestRateStrategy(strategy);
    }

    /// @notice P5: Set aToken (only Owner); when first set, liquidityIndex = 1e27.
    function setAToken(address _aToken) external onlyOwner {
        if (_aToken == address(0)) revert Errors.ZeroAToken();
        aToken = _aToken;
        if (liquidityIndex == 0) {
            liquidityIndex = RAY;
            lastUpdateTimestamp = block.timestamp;
        }
    }

    /// @notice P5: Set variableDebtToken (only Owner); when first set, borrowIndex = 1e27.
    function setVariableDebtToken(address _variableDebtToken) external onlyOwner {
        if (_variableDebtToken == address(0)) revert Errors.ZeroVariableDebtToken();
        variableDebtToken = _variableDebtToken;
        if (borrowIndex == 0) {
            borrowIndex = RAY;
            if (lastUpdateTimestamp == 0) lastUpdateTimestamp = block.timestamp;
        }
    }

    /// @notice P6: Set oracle router (only Owner). When set, getUserPosition/updateUserPosition use price for collateralValue/HF.
    function setOracleRouter(address _oracleRouter) external onlyOwner {
        oracleRouter = _oracleRouter;
    }

    /// @notice P7: Set liquidation contract (only Owner). Only this contract can call executeLiquidation.
    function setLiquidationContract(address _liquidationContract) external onlyOwner {
        liquidationContract = _liquidationContract;
    }

    /// @notice P7: Set closeFactor (only Configurator). e.g. 50 = 50% of debt max per liquidation.
    /// Final Gate B5: closeFactor > 0 and <= 100 so liquidations are possible and bounded.
    function setReserveCloseFactor(address asset, uint256 _closeFactor) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (_closeFactor == 0) revert Errors.CloseFactorZero();
        if (_closeFactor > 100) revert Errors.CloseFactorMax();
        closeFactor = _closeFactor;
    }

    /// @notice P7: Set liquidation bonus (only Configurator). e.g. 5 = 5% bonus to liquidator.
    /// Final Gate B6: bonus <= 100 (100%) so liquidations do not always revert SeizeExceedsSupply.
    function setReserveLiquidationBonus(address asset, uint256 _liquidationBonus) external onlyConfigurator {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (_liquidationBonus > 100) revert Errors.LiquidationBonusMax();
        liquidationBonus = _liquidationBonus;
    }

    /// @notice P5: For aToken/debtToken to read index (ray).
    function getLiquidityIndex() external view returns (uint256) {
        return liquidityIndex == 0 ? RAY : liquidityIndex;
    }

    function getBorrowIndex() external view returns (uint256) {
        return borrowIndex == 0 ? RAY : borrowIndex;
    }

    /// @notice 07 alignment: Normalized income (liquidity index in ray).
    function getNormalizedIncome() external view returns (uint256) {
        return ReserveLogic.getNormalizedIncome(liquidityIndex);
    }

    /// @notice 07 alignment: Normalized debt (borrow index in ray).
    function getNormalizedDebt() external view returns (uint256) {
        return ReserveLogic.getNormalizedDebt(borrowIndex);
    }

    /// @notice 07 alignment: Set whether user uses reserve as collateral. Single-asset: asset must be pool token; useAsCollateral false => revert.
    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external view {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (!useAsCollateral) revert Errors.CannotDisableCollateral();
        // useAsCollateral == true: no-op (single asset is always collateral); multi-asset would update UserConfiguration
    }

    /// @notice P5: Cumulate liquidityIndex and borrowIndex; then refresh totalSupply/totalBorrow and rates.
    /// 07: depositor liquidity index uses effective supply rate = supplyRate * (10000 - reserveFactor) / 10000.
    /// 07: mintToTreasury path — protocol share of supply interest is minted as aToken to treasury.
    function cumulateIndexes() internal {
        if (aToken == address(0) || variableDebtToken == address(0)) return;
        uint256 timeDelta = block.timestamp - lastUpdateTimestamp;
        if (timeDelta == 0) return;
        uint256 indexOld = liquidityIndex;
        uint256 effectiveSupplyRate = (supplyRate * (10000 - reserveFactor)) / 10000;
        liquidityIndex = ReserveLogic.cumulateToLiquidityIndex(liquidityIndex, effectiveSupplyRate, timeDelta);
        borrowIndex = ReserveLogic.cumulateToBorrowIndex(borrowIndex, borrowRate, timeDelta);
        lastUpdateTimestamp = block.timestamp;
        uint256 totalScaled = IAToken(aToken).totalScaledSupply();
        totalSupply = IAToken(aToken).totalSupply();
        totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
        // 07: mint protocol share to treasury (aToken claim; underlying backed when borrowers repay)
        if (reserveFactor != 0 && treasuryAddress != address(0)) {
            uint256 toTreasury = ReserveLogic.computeProtocolAccrued(totalScaled, indexOld, liquidityIndex, reserveFactor);
            if (toTreasury != 0) {
                IAToken(aToken).mint(treasuryAddress, toTreasury);
            }
        }
        (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
    }

    /// @notice P5: Check if using aToken path.
    function _useATokenPath() internal view returns (bool) {
        return aToken != address(0) && variableDebtToken != address(0);
    }

    /// @notice Pauses the pool. Only an account with the PAUSER role may call this; the Owner grants or revokes that role so that emergency pause is controlled without transferring ownership.
    function pause() external onlyPauser {
        _pause();
    }

    function unpause() external onlyPauser {
        _unpause();
    }

    modifier onlyPauser() {
        if (!_pausers[msg.sender]) revert Errors.NotPauser();
        _;
    }

    /// @notice Grants the PAUSER role to an account so it can call pause/unpause. Only Owner.
    function grantPauser(address account) external onlyOwner {
        if (account == address(0)) revert Errors.ZeroAddress();
        _pausers[account] = true;
    }

    /// @notice Revokes the PAUSER role so the account can no longer pause. Only Owner.
    function revokePauser(address account) external onlyOwner {
        _pausers[account] = false;
    }

    /// @notice Returns whether the account has the PAUSER role.
    function isPauser(address account) external view returns (bool) {
        return _pausers[account];
    }

    function supply(uint256 amount) external whenNotPaused nonReentrant {
        if (reservePaused[address(token)]) revert Errors.ReservePaused();
        if (amount == 0) revert Errors.ZeroAmount();
        SafeTransfer.safeTransferFrom(token, msg.sender, address(this), amount);

        if (_useATokenPath()) {
            cumulateIndexes();
            IAToken(aToken).mint(msg.sender, amount);
            totalSupply = IAToken(aToken).totalSupply();
            totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
            (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
            updateUserPosition(msg.sender);
        } else {
            userSupply[msg.sender] += amount;
            totalSupply += amount;
            updateRates();
            updateUserPosition(msg.sender);
        }

        emit Supplied(msg.sender, amount, block.timestamp);
    }

    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        if (reservePaused[address(token)]) revert Errors.ReservePaused();
        if (amount == 0) revert Errors.ZeroAmount();

        if (_useATokenPath()) {
            cumulateIndexes();
            if (IAToken(aToken).balanceOf(msg.sender) < amount) revert Errors.InsufficientSupply();
            uint256 supplied = IAToken(aToken).balanceOf(msg.sender);
            uint256 borrowed = IVariableDebtToken(variableDebtToken).balanceOf(msg.sender);
            uint256 newSupply = supplied - amount;
            uint256 maxBorrow = (newSupply * ltvRatio) / 100;
            if (borrowed > maxBorrow) revert Errors.WithdrawalWouldMakePositionUnhealthy();

            IAToken(aToken).burn(msg.sender, amount);
            totalSupply = IAToken(aToken).totalSupply();
            totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
            (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
            SafeTransfer.safeTransfer(token, msg.sender, amount);
            updateUserPosition(msg.sender);
        } else {
            if (userSupply[msg.sender] < amount) revert Errors.InsufficientSupply();
            uint256 newSupply = userSupply[msg.sender] - amount;
            uint256 borrowed = userBorrow[msg.sender];
            uint256 maxBorrow = (newSupply * ltvRatio) / 100;
            if (borrowed > maxBorrow) revert Errors.WithdrawalWouldMakePositionUnhealthy();

            userSupply[msg.sender] = newSupply;
            totalSupply -= amount;
            SafeTransfer.safeTransfer(token, msg.sender, amount);
            updateRates();
            updateUserPosition(msg.sender);
        }

        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    function borrow(uint256 amount) external whenNotPaused nonReentrant {
        if (reservePaused[address(token)]) revert Errors.ReservePaused();
        if (amount == 0) revert Errors.ZeroAmount();
        if (token.balanceOf(address(this)) < amount) revert Errors.InsufficientLiquidity();

        if (_useATokenPath()) {
            uint256 supplied = IAToken(aToken).balanceOf(msg.sender);
            uint256 borrowed = IVariableDebtToken(variableDebtToken).balanceOf(msg.sender);
            uint256 maxBorrowable = (supplied * ltvRatio) / 100;
            if (borrowed + amount > maxBorrowable) revert Errors.ExceedsBorrowingLimit();

            cumulateIndexes();
            IVariableDebtToken(variableDebtToken).mint(msg.sender, amount);
            totalSupply = IAToken(aToken).totalSupply();
            totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
            (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
            SafeTransfer.safeTransfer(token, msg.sender, amount);
            updateUserPosition(msg.sender);
        } else {
            uint256 maxBorrow = (userSupply[msg.sender] * ltvRatio) / 100;
            if (userBorrow[msg.sender] + amount > maxBorrow) revert Errors.ExceedsBorrowingLimit();

            userBorrow[msg.sender] += amount;
            totalBorrow += amount;
            SafeTransfer.safeTransfer(token, msg.sender, amount);
            updateRates();
            updateUserPosition(msg.sender);
        }

        emit Borrowed(msg.sender, amount, block.timestamp);
    }

    function repay(uint256 amount) external whenNotPaused nonReentrant {
        if (reservePaused[address(token)]) revert Errors.ReservePaused();
        if (amount == 0) revert Errors.ZeroAmount();

        if (_useATokenPath()) {
            if (IVariableDebtToken(variableDebtToken).balanceOf(msg.sender) < amount) revert Errors.AmountExceedsBorrow();
            SafeTransfer.safeTransferFrom(token, msg.sender, address(this), amount);

            cumulateIndexes();
            IVariableDebtToken(variableDebtToken).burn(msg.sender, amount);
            totalSupply = IAToken(aToken).totalSupply();
            totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
            (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
            updateUserPosition(msg.sender);
        } else {
            if (userBorrow[msg.sender] < amount) revert Errors.AmountExceedsBorrow();
            SafeTransfer.safeTransferFrom(token, msg.sender, address(this), amount);
            userBorrow[msg.sender] -= amount;
            totalBorrow -= amount;
            updateRates();
            updateUserPosition(msg.sender);
        }

        emit Repaid(msg.sender, amount, block.timestamp);
    }

    function updateRates() internal {
        (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
    }

    function updateUserPosition(address user) internal {
        uint256 supplied;
        uint256 borrowed;
        if (_useATokenPath()) {
            supplied = IAToken(aToken).balanceOf(user);
            borrowed = IVariableDebtToken(variableDebtToken).balanceOf(user);
        } else {
            supplied = userSupply[user];
            borrowed = userBorrow[user];
        }

        uint256 collateralValue;
        uint256 healthFactor;

        if (oracleRouter != address(0)) {
            uint256 price = IOracleRouter(oracleRouter).getPrice(address(token));
            if (price == 0) revert Errors.OraclePriceZero();
            collateralValue = (supplied * price) / 1e18;
            uint256 debtValue = (borrowed * price) / 1e18;
            healthFactor = debtValue == 0 ? type(uint256).max : (collateralValue * liquidationThreshold) / debtValue;
        } else {
            collateralValue = supplied;
            if (borrowed == 0) {
                healthFactor = type(uint256).max;
            } else {
                uint256 maxBorrowable = (supplied * ltvRatio) / 100;
                healthFactor = (maxBorrowable * 100) / borrowed;
            }
        }

        positions[user] = UserPosition({
            supplied: supplied,
            borrowed: borrowed,
            collateralValue: collateralValue,
            healthFactor: healthFactor
        });
    }

    function getUserPosition(address user) external view returns (
        uint256 supplied,
        uint256 borrowed,
        uint256 collateralValue,
        uint256 healthFactor
    ) {
        if (_useATokenPath()) {
            supplied = IAToken(aToken).balanceOf(user);
            borrowed = IVariableDebtToken(variableDebtToken).balanceOf(user);
            if (oracleRouter != address(0)) {
                uint256 price = IOracleRouter(oracleRouter).getPrice(address(token));
                if (price == 0) revert Errors.OraclePriceZero();
                collateralValue = (supplied * price) / 1e18;
                uint256 debtValue = (borrowed * price) / 1e18;
                healthFactor = debtValue == 0 ? type(uint256).max : (collateralValue * liquidationThreshold) / debtValue;
            } else {
                uint256 maxBorrowable = (supplied * ltvRatio) / 100;
                collateralValue = supplied;
                healthFactor = borrowed == 0 ? type(uint256).max : (maxBorrowable * 100) / borrowed;
            }
            return (supplied, borrowed, collateralValue, healthFactor);
        }
        UserPosition memory position = positions[user];
        return (
            position.supplied,
            position.borrowed,
            position.collateralValue,
            position.healthFactor
        );
    }

    function getPoolInfo() external view returns (
        uint256 _totalSupply,
        uint256 _totalBorrow,
        uint256 _utilizationRate,
        uint256 _supplyRate,
        uint256 _borrowRate
    ) {
        if (_useATokenPath()) {
            uint256 ts = IAToken(aToken).totalSupply();
            uint256 tb = IVariableDebtToken(variableDebtToken).totalSupply();
            uint256 util = ts == 0 ? 0 : (tb * 100) / ts;
            ( , uint256 sRate, uint256 bRate) = ReserveLogic.updateRates(ts, tb, interestRateStrategy);
            return (ts, tb, util, sRate, bRate);
        }
        return (
            totalSupply,
            totalBorrow,
            utilizationRate,
            supplyRate,
            borrowRate
        );
    }

    /// @notice 07 alignment: Reserve data for given asset (single-asset: only pool token).
    function getReserveData(address asset) external view returns (
        uint256 ltv,
        uint256 lt,
        uint256 liquidityIndex_,
        uint256 borrowIndex_,
        uint256 lastUpdate,
        address strategy
    ) {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        return (
            ltvRatio,
            liquidationThreshold,
            liquidityIndex,
            borrowIndex,
            lastUpdateTimestamp,
            address(interestRateStrategy)
        );
    }

    /// @notice 07 alignment: User account data (Aave-style naming). Same unit as oracle/collateral.
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateral,
        uint256 totalDebt,
        uint256 availableBorrows,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        (, uint256 borrowed, uint256 collateralValue, uint256 hf) = this.getUserPosition(user);
        healthFactor = hf;
        uint256 debtValue = oracleRouter != address(0)
            ? (borrowed * IOracleRouter(oracleRouter).getPrice(address(token))) / 1e18
            : borrowed;
        totalCollateral = collateralValue;
        totalDebt = debtValue;
        availableBorrows = this.calculateMaxBorrow(user);
        if (oracleRouter != address(0) && availableBorrows > 0) {
            uint256 price = IOracleRouter(oracleRouter).getPrice(address(token));
            availableBorrows = (availableBorrows * price) / 1e18;
        }
        currentLiquidationThreshold = liquidationThreshold;
        ltv = ltvRatio;
    }

    function calculateMaxWithdraw(address user) external view returns (uint256) {
        uint256 supplied;
        uint256 borrowed;
        if (_useATokenPath()) {
            supplied = IAToken(aToken).balanceOf(user);
            borrowed = IVariableDebtToken(variableDebtToken).balanceOf(user);
        } else {
            supplied = userSupply[user];
            borrowed = userBorrow[user];
        }

        if (borrowed == 0) return supplied;

        uint256 minRequiredSupply = (borrowed * 100) / ltvRatio;

        if (supplied <= minRequiredSupply) return 0;
        return supplied - minRequiredSupply;
    }

    function calculateMaxBorrow(address user) external view returns (uint256) {
        uint256 supplied;
        uint256 borrowed;
        if (_useATokenPath()) {
            supplied = IAToken(aToken).balanceOf(user);
            borrowed = IVariableDebtToken(variableDebtToken).balanceOf(user);
        } else {
            supplied = userSupply[user];
            borrowed = userBorrow[user];
        }
        uint256 maxBorrowable = (supplied * ltvRatio) / 100;

        if (borrowed >= maxBorrowable) return 0;
        return maxBorrowable - borrowed;
    }

    /// @notice 07 alignment: Validate borrow amount for user (view). True if amount <= max additional borrow.
    function validateBorrow(address user, uint256 amount) external view returns (bool) {
        return amount <= this.calculateMaxBorrow(user);
    }

    /// @notice 07 alignment: Validate withdraw amount for user (view). True if amount <= max withdraw.
    function validateWithdraw(address user, uint256 amount) external view returns (bool) {
        return amount <= this.calculateMaxWithdraw(user);
    }

    /// @notice P7: Returns true when borrower's health factor < 100 (scale 100). Uses RiskEngine.isLiquidatable.
    function isLiquidatable(address borrower) external view returns (bool) {
        if (!_useATokenPath()) return false;
        (, uint256 borrowed, uint256 collateralValue, ) = this.getUserPosition(borrower);
        if (borrowed == 0) return false;
        uint256 debtValue = oracleRouter != address(0)
            ? (borrowed * IOracleRouter(oracleRouter).getPrice(address(token))) / 1e18
            : borrowed;
        return RiskEngine.isLiquidatable(collateralValue, debtValue, liquidationThreshold);
    }

    /// @notice P7: Execute liquidation; only callable by liquidationContract. Liquidator pays repayAmount, receives collateral + bonus.
    function executeLiquidation(address borrower, address liquidator, uint256 repayAmount) external onlyLiquidation whenNotPaused nonReentrant {
        if (!_useATokenPath()) revert Errors.ATokenPathRequired();
        if (repayAmount == 0) revert Errors.ZeroRepay();
        if (!this.isLiquidatable(borrower)) revert Errors.NotLiquidatable();
        (, uint256 borrowed, , ) = this.getUserPosition(borrower);
        if (borrowed == 0) revert Errors.NoDebt();
        uint256 maxRepay = (closeFactor * borrowed) / 100;
        if (repayAmount > maxRepay) revert Errors.ExceedsCloseFactor();
        if (repayAmount > borrowed) revert Errors.ExceedsDebt();

        SafeTransfer.safeTransferFrom(token, liquidator, address(this), repayAmount);

        cumulateIndexes();
        IVariableDebtToken(variableDebtToken).burn(borrower, repayAmount);
        uint256 collateralToSeize = (repayAmount * (100 + liquidationBonus)) / 100;
        uint256 borrowerSupply = IAToken(aToken).balanceOf(borrower);
        if (collateralToSeize > borrowerSupply) revert Errors.SeizeExceedsSupply();
        IAToken(aToken).burn(borrower, collateralToSeize);
        SafeTransfer.safeTransfer(token, liquidator, collateralToSeize);

        totalSupply = IAToken(aToken).totalSupply();
        totalBorrow = IVariableDebtToken(variableDebtToken).totalSupply();
        (utilizationRate, supplyRate, borrowRate) = ReserveLogic.updateRates(totalSupply, totalBorrow, interestRateStrategy);
        updateUserPosition(borrower);

        emit Liquidated(borrower, liquidator, repayAmount, collateralToSeize);
    }

    /// @notice 07: Execute flash loan — transfer asset to receiver, callback, reclaim amount + fee. Single-asset: only pool token.
    function executeFlashLoan(
        address asset,
        uint256 amount,
        address receiverAddress,
        bytes calldata data
    ) external whenNotPaused nonReentrant {
        if (asset != address(token)) revert Errors.AssetMustBePoolToken();
        if (amount == 0) revert Errors.ZeroAmount();
        if (receiverAddress == address(0)) revert Errors.ZeroAddress();
        uint256 fee = (amount * FLASH_LOAN_FEE_BPS) / 10000;
        uint256 balanceBefore = token.balanceOf(address(this));
        SafeTransfer.safeTransfer(token, receiverAddress, amount);
        bool ok = IFlashLoanReceiver(receiverAddress).executeOperation(asset, amount, fee, msg.sender, data);
        if (!ok) revert Errors.FlashLoanCallbackFailed();
        SafeTransfer.safeTransferFrom(token, receiverAddress, address(this), amount + fee);
        if (token.balanceOf(address(this)) < balanceBefore + fee) revert Errors.FlashLoanRepayFailed();
        emit FlashLoan(receiverAddress, asset, amount, fee);
    }
}
