// SPDX-License-Identifier: MIT License
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IToken.sol";

/**
 * @title StakingNFT
 * @dev Contract for staking NFT tokens and earning rewards
 */
contract StakingNFT {
    /**
     * @dev Structure to store information about a deposit
     */
    struct Deposit {
        address owner;
        uint lastClaim;
    }

    /// @dev Reference to the ERC721 token contract
    IERC721 public immutable nft;

    /// @dev Reference to the token contract that will be used for rewards
    IToken public immutable token;

    /// Number of tokens to be rewarded per hour
    uint public constant REWARDS = 10;

    /// @dev Mapping to store deposit information for each token ID
    mapping(uint => Deposit) private _deposits;

    /**
     * @dev Constructor to initialize the contract with the addresses of the ERC721 and token contracts
     * @param _nft Address of the ERC721 token contract
     * @param _token Address of the token contract that will be used for rewards
     */
    constructor(address _nft, address _token) {
        nft = IERC721(_nft);
        token = IToken(_token);
    }

    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient,
     * the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        _deposits[tokenId].owner = from;
        _deposits[tokenId].lastClaim = block.timestamp;
        return this.onERC721Received.selector;
    }

    function deposit(uint tokenId) external {
        address owner = nft.ownerOf(tokenId);
        nft.safeTransferFrom(owner, address(this), tokenId);
        _deposits[tokenId].owner = owner;
        _deposits[tokenId].lastClaim = block.timestamp;
    }

    /**
     * @dev Allows the owner of a NFT to withdraw the NFT and claim the pending rewards earned for staking the NFT.
     * @param tokenId The ID of the token for which the rewards are being claimed.
     */
    function withdraw(uint256 tokenId) external {
        address to = _deposits[tokenId].owner;
        require(msg.sender == to, "You're not the owner");
        _claimRewards(tokenId, to);
        delete _deposits[tokenId];
        nft.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Allows the owner of a NFT to claim the rewards earned for staking the NFT.
     * @param tokenId The ID of the token for which the rewards are being claimed.
     */
    function claimRewards(uint256 tokenId) external {
        address to = _deposits[tokenId].owner;
        require(msg.sender == to, "You're not the owner");

        _claimRewards(tokenId, to);
    }

    /**
     * @dev Calculates the rewards earned for staking an NFT.
     * @param tokenId The ID of the token for which the rewards are being calculated.
     * @return The calculated rewards using the token's decimal.
     */
    function calculateRewards(uint256 tokenId) external view returns (uint) {
        if (_deposits[tokenId].owner == address(0)) {
            return 0;
        }
        (uint calculatedRewards, ) = _calculateRewards(tokenId);
        return calculatedRewards;
    }

    /**
     * @dev private function to claim rewards
     * @param tokenId The ID of the token for which the rewards are being claimed.
     */
    function _claimRewards(uint256 tokenId, address to) private {
        (uint amount, uint remaining) = _calculateRewards(tokenId);
        _deposits[tokenId].lastClaim = block.timestamp - remaining;

        token.mint(to, amount);
    }

    /**
     * @dev internal function to calculate rewards
     * @param tokenId The ID of the token for which the rewards are being calculated.
     * @return tuple of pending rewards and remaining time
     */
    function _calculateRewards(
        uint256 tokenId
    ) private view returns (uint, uint) {
        uint lastClaim = _deposits[tokenId].lastClaim;
        if (lastClaim == 0) return (0, 0);

        uint nbOfHours = (block.timestamp - lastClaim) / 1 hours;

        uint remaining = (block.timestamp - lastClaim) % 1 hours;

        return (nbOfHours * (REWARDS * (10 ** token.decimals())), remaining);
    }
}
