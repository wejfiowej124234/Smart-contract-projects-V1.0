// SPDX-License-Identifier: MIT
//
// WadRayMath (P5): ray (1e27) mul/div for index accrual. Per 09 §2.5.
pragma solidity ^0.8.19;

library WadRayMath {
    uint256 internal constant RAY = 1e27;
    uint256 internal constant halfRAY = RAY / 2;

    function rayMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) return 0;
        require(a <= (type(uint256).max - halfRAY) / b, "WadRay: overflow");
        return (a * b + halfRAY) / RAY;
    }

    function rayDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "WadRay: div by zero");
        uint256 halfB = b / 2;
        require(a <= (type(uint256).max - halfB) / RAY, "WadRay: overflow");
        return (a * RAY + halfB) / b;
    }

    /// @notice Cumulate index: newIndex = index * (1 + ratePerSecondRay * timeDelta)
    /// @param index Current index (ray)
    /// @param ratePerSecondRay Rate in ray per second (e.g. supplyRate% per year -> ray per sec)
    /// @param timeDelta Seconds elapsed
    function cumulateIndex(uint256 index, uint256 ratePerSecondRay, uint256 timeDelta) internal pure returns (uint256) {
        if (timeDelta == 0) return index;
        // index * (1 + rate * timeDelta) = index + index * rate * timeDelta / RAY
        uint256 accrued = rayMul(rayMul(index, ratePerSecondRay), timeDelta);
        require(index <= type(uint256).max - accrued, "WadRay: index overflow");
        return index + accrued;
    }
}
