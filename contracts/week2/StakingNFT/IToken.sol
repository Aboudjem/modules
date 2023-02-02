// SPDX-License-Identifier: MIT License
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IToken is IERC20 {
    function mint(address to, uint amount) external;

    function decimals() external view returns (uint8);
}
