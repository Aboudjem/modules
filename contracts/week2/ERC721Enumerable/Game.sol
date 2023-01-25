// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Game {
    IERC721Enumerable public nft;

    constructor(address _nft) {
        nft = IERC721Enumerable(_nft);
    }

    /**
     * @dev Returns the number of prime NFT IDs held by a user
     * @param owner The address of the user
     * @return The number of prime NFT IDs held by the user
     */
    function getPrimeCount(address owner) external view returns (uint) {
        uint tokenCount = nft.balanceOf(owner);
        uint res;
        for (uint i = 0; i < tokenCount; i++) {
            uint id = nft.tokenOfOwnerByIndex(owner, i);
            if (_isPrimeNumber(id)) {
                res++;
            }
        }
        return res;
    }

    /**
     * @dev Determines if a number is prime
     * @param number The number to check
     * @return true if the number is prime, false otherwise
     */
    function _isPrimeNumber(uint number) private pure returns (bool) {
        if (number < 2) return false;
        for (uint i = 2; i < number; i++) {
            if (number % i == 0) {
                return false;
            }
        }
        return true;
    }
}
