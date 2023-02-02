// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Enumerable is ERC721Enumerable {
    uint private _count;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {
        _count = 1;
    }

    function mint() external {
        _mint(msg.sender, _count);
        _count++;
    }
}
