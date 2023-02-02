// SPDX-License-Identifier: MIT License
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT is ERC721 {
    uint private _countId;

    constructor(
        string memory _name,
        string memory _symbol
    )
        ERC721(_name, _symbol) // solhint-disable-next-line no-empty-blocks
    {}

    function mint() external {
        _safeMint(msg.sender, _countId);
        _countId++;
    }
}
