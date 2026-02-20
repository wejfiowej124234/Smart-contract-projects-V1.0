// SPDX-License-Identifier: MIT
//
// P6: Central oracle router. getPrice(asset) and getPrices(assets) delegate to the configured feed per asset (e.g. ChainlinkAdapter or PriceBoundGuard).
// Prices are returned in 8 decimals for consistency with the risk engine (03 §2, 07).
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceSource {
    function getPrice() external view returns (uint256);
}

contract OracleRouter is Ownable {
    mapping(address => address) public feeds; // asset => IPriceSource (ChainlinkAdapter or PriceBoundGuard)

    event FeedSet(address indexed asset, address indexed source);

    constructor() Ownable() {}

    function setFeed(address asset, address source) external onlyOwner {
        require(asset != address(0), "zero asset");
        feeds[asset] = source;
        emit FeedSet(asset, source);
    }

    /// @notice Returns the price of the asset in 8 decimals. Reverts if no feed is set or the underlying source reverts, so that callers do not use stale or zero prices.
    /// @param asset Token address for which a feed is configured.
    /// @return price Price in 8 decimals.
    function getPrice(address asset) external view returns (uint256 price) {
        address source = feeds[asset];
        require(source != address(0), "no feed");
        return IPriceSource(source).getPrice();
    }

    function getPrices(address[] calldata assets) external view returns (uint256[] memory prices) {
        prices = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            address source = feeds[assets[i]];
            require(source != address(0), "no feed");
            prices[i] = IPriceSource(source).getPrice();
        }
        return prices;
    }
}
