// SPDX-License-Identifier: MIT
//
// 07 alignment: Safe transfer wrapper for ERC20 (return value check; supports non-standard tokens).
// Use for transfer/transferFrom in Pool, Liquidation, etc. OZ SafeERC20 covers more edge cases; this lib satisfies 07 naming.
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library SafeTransfer {
    /// @notice Safe transfer; reverts if call fails or returns false (when data present).
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeTransfer: transfer failed");
    }

    /// @notice Safe transferFrom; reverts if call fails or returns false (when data present).
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeTransfer: transferFrom failed");
    }
}
