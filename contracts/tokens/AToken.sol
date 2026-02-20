// SPDX-License-Identifier: MIT
//
// aToken (P5): supply receipt token; balance grows with liquidityIndex. Only Pool can mint/burn.
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {WadRayMath} from "../libs/WadRayMath.sol";

interface IPoolWithIndex {
    function getLiquidityIndex() external view returns (uint256);
}

contract AToken is IERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    address public immutable pool;

    mapping(address => uint256) private _scaledBalanceOf;
    uint256 private _totalScaledSupply;
    mapping(address => mapping(address => uint256)) private _allowances;

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

    function getLiquidityIndex() internal view returns (uint256) {
        return IPoolWithIndex(pool).getLiquidityIndex();
    }

    /// @notice Scaled balance (for index math); balanceOf = scaledBalanceOf * index / RAY
    function scaledBalanceOf(address account) external view returns (uint256) {
        return _scaledBalanceOf[account];
    }

    function totalScaledSupply() external view returns (uint256) {
        return _totalScaledSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        uint256 index = getLiquidityIndex();
        if (index == 0) return 0;
        return WadRayMath.rayMul(_scaledBalanceOf[account], index);
    }

    function totalSupply() external view returns (uint256) {
        uint256 index = getLiquidityIndex();
        if (index == 0) return 0;
        return WadRayMath.rayMul(_totalScaledSupply, index);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "insufficient allowance");
        unchecked { _allowances[from][msg.sender] = currentAllowance - amount; }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "transfer from zero");
        require(to != address(0), "transfer to zero");
        uint256 index = getLiquidityIndex();
        require(index != 0, "zero index");
        uint256 scaledAmount = WadRayMath.rayDiv(amount, index);
        require(_scaledBalanceOf[from] >= scaledAmount, "insufficient balance");
        unchecked {
            _scaledBalanceOf[from] -= scaledAmount;
            _scaledBalanceOf[to] += scaledAmount;
        }
        emit Transfer(from, to, amount);
    }

    /// @notice Only Pool: mint aToken to user (supply).
    function mint(address user, uint256 amount) external onlyPool {
        require(user != address(0), "mint to zero");
        if (amount == 0) return;
        uint256 index = getLiquidityIndex();
        require(index != 0, "zero index");
        uint256 scaledAmount = WadRayMath.rayDiv(amount, index);
        _scaledBalanceOf[user] += scaledAmount;
        _totalScaledSupply += scaledAmount;
        emit Mint(user, amount, scaledAmount);
        emit Transfer(address(0), user, amount);
    }

    /// @notice Only Pool: burn aToken from user (withdraw).
    function burn(address user, uint256 amount) external onlyPool {
        if (amount == 0) return;
        uint256 index = getLiquidityIndex();
        require(index != 0, "zero index");
        uint256 scaledAmount = WadRayMath.rayDiv(amount, index);
        require(_scaledBalanceOf[user] >= scaledAmount, "burn exceeds balance");
        unchecked {
            _scaledBalanceOf[user] -= scaledAmount;
            _totalScaledSupply -= scaledAmount;
        }
        emit Burn(user, amount, scaledAmount);
        emit Transfer(user, address(0), amount);
    }
}
