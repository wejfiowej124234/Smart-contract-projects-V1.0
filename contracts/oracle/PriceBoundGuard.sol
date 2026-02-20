// SPDX-License-Identifier: MIT
//
// P6: Deviation threshold / circuit breaker (03 §2.2, 09 §2.1). On anomaly revert or degrade.
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceSource {
    function getPrice() external view returns (uint256);
}

/// @notice Wraps a price source; reverts if price deviates beyond maxDeviationBps from anchor (or circuit open).
contract PriceBoundGuard is IPriceSource, Ownable {
    IPriceSource public immutable source;
    uint256 public maxDeviationBps; // e.g. 1000 = 10%
    uint256 public anchorPrice;     // 0 = not set
    bool public circuitOpen;        // when true, getPrice reverts

    event AnchorUpdated(uint256 oldAnchor, uint256 newAnchor);
    event CircuitOpened();
    event CircuitClosed();
    event MaxDeviationBpsUpdated(uint256 oldBps, uint256 newBps);

    constructor(address _source, uint256 _maxDeviationBps) Ownable() {
        require(_source != address(0), "zero source");
        source = IPriceSource(_source);
        maxDeviationBps = _maxDeviationBps;
    }

    function setAnchor(uint256 _anchorPrice) external onlyOwner {
        uint256 oldAnchor = anchorPrice;
        anchorPrice = _anchorPrice;
        emit AnchorUpdated(oldAnchor, _anchorPrice);
    }

    function setMaxDeviationBps(uint256 _bps) external onlyOwner {
        uint256 old = maxDeviationBps;
        maxDeviationBps = _bps;
        emit MaxDeviationBpsUpdated(old, _bps);
    }

    function openCircuit() external onlyOwner {
        circuitOpen = true;
        emit CircuitOpened();
    }

    function closeCircuit() external onlyOwner {
        circuitOpen = false;
        emit CircuitClosed();
    }

    /// @return price Price from source. Reverts if circuit open or deviation from anchor exceeds maxDeviationBps.
    function getPrice() external view returns (uint256 price) {
        require(!circuitOpen, "circuit open");
        price = source.getPrice();
        if (anchorPrice != 0 && price != 0) {
            uint256 delta = price > anchorPrice ? price - anchorPrice : anchorPrice - price;
            require(
                (delta * 10_000) / anchorPrice <= maxDeviationBps,
                "price deviation too high"
            );
        }
        return price;
    }
}
