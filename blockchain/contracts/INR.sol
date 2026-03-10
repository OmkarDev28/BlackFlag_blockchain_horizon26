// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract INR is ERC20, Ownable {
    constructor() ERC20("Digital INR", "INR") Ownable(msg.sender) {}

    // In a real scenario, only the Central Bank or a regulated custodian can mint.
    // For this prototype, we'll allow the owner (Clearing Corp) to mint.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
