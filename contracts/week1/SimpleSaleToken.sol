// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title SimpleSaleToken
contract SimpleSaleToken is ERC20, Ownable {
    mapping(address => bool) private _restricted;

    uint private _rate;

    event AddressRestrictionUpdated(address indexed _addr, bool _restricted);
    event ConversionRateUpdated(uint oldRate, uint newRate);

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        _mint(address(this), 22_000_000 * 1E18);
        _rate = 10000;
    }

    /**
     * @dev Buy tokens from the contract
     * payable function
     */
    function buy() external payable {
        require(msg.value > 0, "Ether to send must be > 0");
        uint amount = msg.value * _rate;
        require(
            balanceOf(address(this)) > amount,
            "Not enough to buy from contract"
        );

        _transfer(address(this), msg.sender, amount);
    }

    /**
     * @dev Set the conversion rate between ether and tokens
     * @param _newRate The new conversion rate
     */
    function setConversionRate(uint _newRate) external onlyOwner {
        uint oldRate = _rate;
        _rate = _newRate;
        emit ConversionRateUpdated(oldRate, _rate);
    }

    /**
     * @dev Restricts the specified address from sending and receiving tokens.
     * @param _addr The address to be restricted.
     * require onlyOwner can call this function
     */
    function restrictAddress(address _addr) external onlyOwner {
        _restricted[_addr] = true;
        emit AddressRestrictionUpdated(_addr, true);
    }

    /**
     * @dev Un-restricts the specified address, allowing it to send and receive tokens.
     * @param _addr The address to be un-restricted.
     * require onlyOwner can call this function
     */
    function unRestrictAddress(address _addr) external onlyOwner {
        _restricted[_addr] = false;
        emit AddressRestrictionUpdated(_addr, false);
    }

    /**
     * @dev Returns whether the specified address is restricted or not.
     * @param _addr The address to check the restriction status of.
     * @return bool Returns true if the address is restricted, false otherwise.
     */
    function isRestricted(address _addr) external view returns (bool) {
        return _restricted[_addr];
    }

    /**
     * @dev Get the conversion rate between ether and tokens
     * @return The current conversion rate
     */
    function getConversionRate() external view returns (uint) {
        return _rate;
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

    /*
     * @dev checks if the 'from' and 'to' addresses are restricted before allowing the transfer to occur.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256
    ) internal virtual override {
        require(!_restricted[from], "Restricted 'from' address.");
        require(!_restricted[to], "Restricted 'to' address.");
    }
}
