// SPDX-License-Identifier: MIT
//
// variableDebtToken (P5): borrow debt token; balance grows with borrowIndex. Only Pool can mint/burn. No transfer.
pragma solidity ^0.8.19;

import {WadRayMath} from "../libs/WadRayMath.sol";

interface IPoolWithBorrowIndex {
    function getBorrowIndex() external view returns (uint256);
}

contract VariableDebtToken {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    address public immutable pool;

    mapping(address => uint256) private _scaledBalanceOf;
    uint256 private _totalScaledBorrow;

    event Mint(address indexed user, uint256 amount, uint256 scaledAmount);
    event Burn(address indexed user, uint256 amount, uint256 scaledAmount);

    constructor(string memory name_, string memory symbol_, uint8 decimals_, address pool_) {
        require(pool_ != address(0), "zero pool");
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        pool = pool_;
    }

    modifier onlyPool() {
        require(msg.sender == pool, "only pool");
        _;
    }

    function name() external view returns (string memory) { return _name; }
    function symbol() external view returns (string memory) { return _symbol; }
    function decimals() external view returns (uint8) { return _decimals; }

    function getBorrowIndex() internal view returns (uint256) {
        return IPoolWithBorrowIndex(pool).getBorrowIndex();
    }

    function scaledBalanceOf(address account) external view returns (uint256) {
        return _scaledBalanceOf[account];
    }

    function totalScaledBorrow() external view returns (uint256) {
        return _totalScaledBorrow;
    }

    function balanceOf(address account) public view returns (uint256) {
        uint256 index = getBorrowIndex();
        if (index == 0) return 0;
        return WadRayMath.rayMul(_scaledBalanceOf[account], index);
    }

    function totalSupply() external view returns (uint256) {
        uint256 index = getBorrowIndex();
        if (index == 0) return 0;
        return WadRayMath.rayMul(_totalScaledBorrow, index);
    }

    function mint(address user, uint256 amount) external onlyPool {
        require(user != address(0), "mint to zero");
        if (amount == 0) return;
        uint256 index = getBorrowIndex();
        require(index != 0, "zero index");
        uint256 scaledAmount = WadRayMath.rayDiv(amount, index);
        _scaledBalanceOf[user] += scaledAmount;
        _totalScaledBorrow += scaledAmount;
        emit Mint(user, amount, scaledAmount);
    }

    function burn(address user, uint256 amount) external onlyPool {
        if (amount == 0) return;
        uint256 index = getBorrowIndex();
        require(index != 0, "zero index");
        uint256 scaledAmount = WadRayMath.rayDiv(amount, index);
        require(_scaledBalanceOf[user] >= scaledAmount, "burn exceeds balance");
        unchecked {
            _scaledBalanceOf[user] -= scaledAmount;
            _totalScaledBorrow -= scaledAmount;
        }
        emit Burn(user, amount, scaledAmount);
    }
}
