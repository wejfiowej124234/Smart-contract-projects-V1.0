// SPDX-License-Identifier: MIT
/**
 * Mock target for governance integration tests: single storage slot + setter (and a reverting setter for failure tests).
 */
pragma solidity ^0.8.19;

contract MockGovernanceTarget {
    uint256 public value;

    function setValue(uint256 v) external {
        value = v;
    }

    /// @dev Always reverts; used to test execution failure isolation (full batch revert).
    function setValueRevert(uint256) external pure {
        revert("MockGovernanceTarget: setValueRevert");
    }
}
