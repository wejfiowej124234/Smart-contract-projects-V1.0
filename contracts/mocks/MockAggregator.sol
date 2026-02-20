// SPDX-License-Identifier: MIT
//
// Mock Chainlink-style price feed (P6). For local/test when no real Chainlink.
// 15 §1 price oracle row; §2.A: setPrice, decimals 8, setUpdatedAt for stale test.
pragma solidity ^0.8.19;

contract MockAggregator {
    int256 private _price;
    uint256 private _updatedAt;
    uint8 public constant decimals = 8;

    constructor(int256 initialPrice) {
        _price = initialPrice;
        _updatedAt = block.timestamp;
    }

    function setPrice(int256 newPrice) external {
        _price = newPrice;
        _updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 timestamp) external {
        _updatedAt = timestamp;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, _price, _updatedAt, _updatedAt, 1);
    }
}
