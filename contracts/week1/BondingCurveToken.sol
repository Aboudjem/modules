// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BondingCurveToken is ERC20, Ownable {
    uint256 private _loss;

    uint256 private immutable _slope;

    // The percentage of loss when selling tokens (using two decimals)
    uint256 private constant _LOSS_FEE_PERCENTAGE = 1000;

    /**
     * @dev Constructor to initialize the contract.
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     * @param slope_ The slope of the bonding curve.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint slope_
    ) ERC20(name_, symbol_) {
        _slope = slope_;
    }

    /**
     * @dev Allows a user to buy tokens.
     * @param _amount The number of tokens to buy.
     */
    function buy(uint256 _amount) external payable {
        uint price = _calculatePriceForBuy(_amount);
        require(msg.value >= price, "Not enough Ether to buy tokens");
        _mint(msg.sender, _amount);
        payable(msg.sender).transfer(msg.value - price);
    }

    /**
     * @dev Allows a user to sell tokens at a 10% loss.
     * @param _amount The number of tokens to sell.
     */
    function sell(uint256 _amount) external {
        require(balanceOf(msg.sender) >= _amount, "Not enough tokens to sell");
        uint256 _price = _calculatePriceForSell(_amount);
        uint tax = _calculateLoss(_price);
        _burn(msg.sender, _amount);
        _loss += tax;

        payable(msg.sender).transfer(_price - tax);
    }

    /**
     * @dev Allows the owner to withdraw the lost ETH.
     */
    function withdraw() external onlyOwner {
        require(_loss > 0, "No ETH to withdraw");
        uint amount = _loss;
        _loss = 0;
        payable(owner()).transfer(amount);
    }

    /**
     * @dev Returns the current price of the token based on the bonding curve formula.
     * @return The current price of the token in wei.
     */
    function getCurrentPrice() external view returns (uint) {
        return _slope * totalSupply();
    }

    /**
     * @dev Returns the price for buying a specified number of tokens.
     * @param _tokensToBuy The number of tokens to buy.
     * @return The price in wei.
     */
    function calculatePriceForBuy(
        uint256 _tokensToBuy
    ) external view returns (uint256) {
        return _calculatePriceForBuy(_tokensToBuy);
    }

    /**
     * @dev Returns the price for selling a specified number of tokens.
     * @param _tokensToSell The number of tokens to sell.
     * @return The price in wei.
     */
    function calculatePriceForSell(
        uint256 _tokensToSell
    ) external view returns (uint256) {
        return _calculatePriceForSell(_tokensToSell);
    }

    /**
     * @dev Calculates the price for buying a certain number of tokens based on the bonding curve formula.
     * @param _tokensToBuy The number of tokens to buy.
     * @return The price in wei for the specified number of tokens.
     */
    function _calculatePriceForBuy(
        uint256 _tokensToBuy
    ) private view returns (uint256) {
        return
            (_slope *
                (_tokensToBuy *
                    (_tokensToBuy + 1) +
                    2 *
                    totalSupply() *
                    _tokensToBuy)) / 2;
    }

    /**
     * @dev Calculates the price for selling a certain number of tokens based on the bonding curve formula.
     * @param _tokensToSell The number of tokens to sell.
     * @return The price in wei for the specified number of tokens
     */
    function _calculatePriceForSell(
        uint256 _tokensToSell
    ) private view returns (uint256) {
        if (_tokensToSell > totalSupply()) {
            _tokensToSell = totalSupply();
        }
        return
            _slope *
            ((_tokensToSell *
                (totalSupply() + totalSupply() - _tokensToSell + 1)) / 2);
    }

    /**
     * @dev Calculates the loss for selling a certain number of tokens.
     * @param amount The price of the tokens being sold.
     * @return The loss in wei.
     */
    function _calculateLoss(uint256 amount) private pure returns (uint256) {
        return (amount * _LOSS_FEE_PERCENTAGE) / (1E4);
    }
}
