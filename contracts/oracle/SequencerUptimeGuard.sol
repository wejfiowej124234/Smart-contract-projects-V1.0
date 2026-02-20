// SPDX-License-Identifier: MIT
//
// 07/04: Placeholder for L2 sequencer uptime check (e.g. Arbitrum Sequencer). We’ll fill this in when we deploy to L2.
// When sequencer is down, price/oracle calls should revert to avoid stale data.
pragma solidity ^0.8.19;

/// @notice Stub: L2 sequencer uptime guard. Implement isSequencerUp() / getPrice() for target L2.
contract SequencerUptimeGuard {
    error NotImplemented();

    /// @notice Stub: revert until L2 sequencer check is implemented.
    function isSequencerUp() external pure returns (bool) {
        revert NotImplemented();
    }
}
