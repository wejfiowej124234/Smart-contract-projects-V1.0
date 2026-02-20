// SPDX-License-Identifier: MIT
//
// 07/04: Placeholder for TWAP backup price source (optional). We’ll add it when we go mainnet/multi-chain.
// OracleRouter can setFeed(asset, dexTwapAdapter) when implemented; getPrice() returns TWAP in 8 decimals.
pragma solidity ^0.8.19;

/// @notice Stub: revert until DEX TWAP logic is implemented (e.g. Uniswap V3 oracle).
contract DexTwapAdapter {
    error NotImplemented();

    /// @notice Returns TWAP price in 8 decimals. Stub reverts.
    function getPrice() external pure returns (uint256) {
        revert NotImplemented();
    }
}
