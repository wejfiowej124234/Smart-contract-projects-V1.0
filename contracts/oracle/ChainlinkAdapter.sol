// SPDX-License-Identifier: MIT
//
// P6: Read Chainlink aggregator; validate heartbeat, minAnswer, maxAnswer (09 §2.1).
pragma solidity ^0.8.19;

interface IAggregatorV3 {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract ChainlinkAdapter {
    IAggregatorV3 public immutable aggregator;
    uint256 public immutable heartbeat;
    int256 public immutable minAnswer;
    int256 public immutable maxAnswer;

    constructor(
        address _aggregator,
        uint256 _heartbeat,
        int256 _minAnswer,
        int256 _maxAnswer
    ) {
        require(_aggregator != address(0), "zero aggregator");
        aggregator = IAggregatorV3(_aggregator);
        heartbeat = _heartbeat;
        minAnswer = _minAnswer;
        maxAnswer = _maxAnswer;
    }

    /// @return price Price in 8 decimals (uint256). Reverts if stale or out of bounds.
    function getPrice() external view returns (uint256 price) {
        (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
        require(answer >= minAnswer && answer <= maxAnswer, "price out of bounds");
        require(block.timestamp - updatedAt <= heartbeat, "stale price");
        return answer >= 0 ? uint256(answer) : 0;
    }
}
