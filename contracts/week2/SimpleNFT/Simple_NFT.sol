// SPDX-License-Identifier: MIT
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyToken is ERC721 {
    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721("CuteBears", "CBRS") {}

    function mint(uint256 tokenId) public {
        require(tokenId != 0, "Cannot mint tokenId 0");
        require(tokenId < 11, "Cannot mint more than 10");
        _safeMint(_msgSender(), tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://Qmd1xNNxDFZaJ9bzMMRNtZTVF5saC1h1ybvQD4VuzyfGqi/";
    }
}
