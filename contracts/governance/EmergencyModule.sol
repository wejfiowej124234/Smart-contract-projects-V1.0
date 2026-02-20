// SPDX-License-Identifier: MIT
//
// P9: Emergency pause module. Only the Guardian may call emergencyPause(pool); the pool must grant the PAUSER role to this contract so that the Guardian can pause without holding pool ownership.
pragma solidity ^0.8.19;

interface IPausable {
    function pause() external;
}

/// @title EmergencyModule
/// @notice Allows the Guardian to pause the lending pool in an emergency. The pool must grant PAUSER to this contract at deployment.
contract EmergencyModule {
    address public immutable guardian;

    event EmergencyPauseCalled(address indexed pool, address indexed caller);

    constructor(address guardian_) {
        require(guardian_ != address(0), "zero guardian");
        guardian = guardian_;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "not guardian");
        _;
    }

    /// @notice Pauses the given pool. Restricted to Guardian so that only a designated multisig or EOA can trigger emergency pause.
    function emergencyPause(address pool) external onlyGuardian {
        require(pool != address(0), "zero pool");
        IPausable(pool).pause();
        emit EmergencyPauseCalled(pool, msg.sender);
    }
}
