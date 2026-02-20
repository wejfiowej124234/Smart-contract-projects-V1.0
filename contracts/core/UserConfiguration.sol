// SPDX-License-Identifier: MIT
//
// 07 alignment: UserConfiguration library placeholder for multi-asset collateral bitmap.
// Single-asset: no bitmap needed; Pool does not use this yet. Multi-asset upgrade will wire
// isUsingAsCollateral / setUsingAsCollateral / getIsolationState and Pool.setUserUseReserveAsCollateral.
pragma solidity ^0.8.19;

library UserConfiguration {
    /// @notice Placeholder: whether user uses reserve as collateral (multi-asset bitmap).
    /// Single-asset: not used; multi-asset: bit at reserveIndex set.
    function isUsingAsCollateral(bytes32 data, uint256 reserveIndex) internal pure returns (bool) {
        return (uint256(data) >> reserveIndex) & 1 != 0;
    }

    /// @notice Placeholder: set reserve as collateral (multi-asset bitmap).
    function setUsingAsCollateral(bytes32 data, uint256 reserveIndex, bool useAsCollateral) internal pure returns (bytes32) {
        if (useAsCollateral) {
            return bytes32(uint256(data) | (1 << reserveIndex));
        }
        return bytes32(uint256(data) & ~(1 << reserveIndex));
    }

    /// @notice Placeholder: isolation state (multi-asset). Single-asset: not used.
    function getIsolationState(bytes32 data, uint256 reserveIndex) internal pure returns (bool) {
        (data);
        (reserveIndex);
        return false;
    }
}
