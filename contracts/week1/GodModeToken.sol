// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title GodModeToken
contract GodModeToken is ERC20, Ownable {
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, 100_000_000 * 1E18);
    }

    /**
     * @dev Transfers tokens from one address to another address.
     * @dev If the msg.sender is the owner, it can transfer between any addresses, regardless of the restriction.
     * @param from The address to transfer tokens from.
     * @param to The address to transfer tokens to.
     * @param amount The amount of tokens to be transferred.
     * @return true if the transfer was successful.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        if (msg.sender != owner()) {
            super.transferFrom(from, to, amount);
        } else {
            _transfer(from, to, amount);
        }
        return true;
    }
}
