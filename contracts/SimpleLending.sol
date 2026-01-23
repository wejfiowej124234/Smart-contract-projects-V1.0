// File: contracts/SimpleLending.sol
// SPDX-License-Identifier: MIT
//
// CN：SimpleLending 是一个“单币种”借贷示例合约：同一个 token 既用于 supply 也用于 borrow。
//     本作业中我们选择 USD8 作为借贷 token；WETH 仅用于前端余额展示。
// EN: SimpleLending is a single-asset lending example: the same token is used for supply and borrow.
//     In this assignment we use USD8 as the lending token; WETH is display-only in the frontend.
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleLending is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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
    
    // Constants
    uint256 public constant LTV_RATIO = 75; // 75%
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80%
    uint256 public constant BASE_RATE = 2; // 2% base
    uint256 public constant UTILIZATION_MULTIPLIER = 20; // Additional rate based on utilization
    
    event Supplied(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event Borrowed(address indexed user, uint256 amount, uint256 timestamp);
    event Repaid(address indexed user, uint256 amount, uint256 timestamp);
    
    constructor(address _token) {
        require(_token != address(0), "Token address is zero");
        token = IERC20(_token);
        supplyRate = BASE_RATE;
        borrowRate = BASE_RATE + 2; // Borrow rate is higher
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Supply tokens to the protocol
    function supply(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        userSupply[msg.sender] += amount;
        totalSupply += amount;
        
        updateRates();
        updateUserPosition(msg.sender);
        
        emit Supplied(msg.sender, amount, block.timestamp);
    }
    
    // Withdraw supplied tokens
    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(userSupply[msg.sender] >= amount, "Insufficient supply");
        
        // Check health factor after withdrawal
        uint256 newSupply = userSupply[msg.sender] - amount;
        uint256 borrowed = userBorrow[msg.sender];
        uint256 maxBorrow = (newSupply * LTV_RATIO) / 100;
        
        require(borrowed <= maxBorrow, "Withdrawal would make position unhealthy");
        
        userSupply[msg.sender] = newSupply;
        totalSupply -= amount;
        
        token.safeTransfer(msg.sender, amount);
        updateRates();
        updateUserPosition(msg.sender);
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }
    
    // Borrow tokens
    function borrow(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        // Check borrowing capacity
        uint256 maxBorrow = (userSupply[msg.sender] * LTV_RATIO) / 100;
        require(userBorrow[msg.sender] + amount <= maxBorrow, "Exceeds borrowing limit");
        
        userBorrow[msg.sender] += amount;
        totalBorrow += amount;
        
        token.safeTransfer(msg.sender, amount);
        updateRates();
        updateUserPosition(msg.sender);
        
        emit Borrowed(msg.sender, amount, block.timestamp);
    }
    
    // Repay borrowed tokens
    function repay(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(userBorrow[msg.sender] >= amount, "Amount exceeds borrow");
        
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        userBorrow[msg.sender] -= amount;
        totalBorrow -= amount;
        
        updateRates();
        updateUserPosition(msg.sender);
        
        emit Repaid(msg.sender, amount, block.timestamp);
    }
    
    // Update interest rates based on utilization
    function updateRates() internal {
        if (totalSupply == 0) {
            utilizationRate = 0;
            supplyRate = BASE_RATE;
            borrowRate = BASE_RATE + 2;
        } else {
            utilizationRate = (totalBorrow * 100) / totalSupply;
            supplyRate = BASE_RATE + (utilizationRate / 10);
            borrowRate = BASE_RATE + 2 + (utilizationRate / 5);
        }
    }
    
    // Update user's position and health factor
    function updateUserPosition(address user) internal {
        uint256 supplied = userSupply[user];
        uint256 borrowed = userBorrow[user];
        
        uint256 collateralValue = supplied;
        uint256 healthFactor;
        
        if (borrowed == 0) {
            healthFactor = type(uint256).max; // Infinite health
        } else {
            uint256 maxBorrowable = (supplied * LTV_RATIO) / 100;
            healthFactor = (maxBorrowable * 100) / borrowed;
        }
        
        positions[user] = UserPosition({
            supplied: supplied,
            borrowed: borrowed,
            collateralValue: collateralValue,
            healthFactor: healthFactor
        });
    }
    
    // View functions
    function getUserPosition(address user) external view returns (
        uint256 supplied,
        uint256 borrowed,
        uint256 collateralValue,
        uint256 healthFactor
    ) {
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
        return (
            totalSupply,
            totalBorrow,
            utilizationRate,
            supplyRate,
            borrowRate
        );
    }
    
    function calculateMaxWithdraw(address user) external view returns (uint256) {
        uint256 supplied = userSupply[user];
        uint256 borrowed = userBorrow[user];
        
        if (borrowed == 0) return supplied;
        
        // Calculate maximum withdrawable amount while keeping health factor > 100%
        uint256 minRequiredSupply = (borrowed * 100) / LTV_RATIO;
        
        if (supplied <= minRequiredSupply) return 0;
        return supplied - minRequiredSupply;
    }
    
    function calculateMaxBorrow(address user) external view returns (uint256) {
        uint256 supplied = userSupply[user];
        uint256 borrowed = userBorrow[user];
        uint256 maxBorrowable = (supplied * LTV_RATIO) / 100;
        
        if (borrowed >= maxBorrowable) return 0;
        return maxBorrowable - borrowed;
    }
}