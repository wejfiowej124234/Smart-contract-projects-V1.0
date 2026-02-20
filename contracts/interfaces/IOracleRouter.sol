// SPDX-License-Identifier: MIT
//
// Oracle router interface (P6). Pool/RiskEngine/Liquidation use getPrice/getPrices
// for collateralValue, debtValue, HF. Price returned in 8 decimals (e.g. 1e8 = 1 unit).
pragma solidity ^0.8.19;

interface IOracleRouter {
    /// @param asset Token address
    /// @return price Price in 8 decimals (e.g. 1e8 = 1 USD per token unit)
    function getPrice(address asset) external view returns (uint256 price);

    /// @param assets Token addresses
    /// @return prices Prices in 8 decimals, same length as assets
    function getPrices(address[] calldata assets) external view returns (uint256[] memory prices);
}
