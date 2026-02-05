// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {
    address public charityChainContract;

    event MinterSet(address indexed newMinter);

    constructor() ERC20("CharityChain Reward", "CCRT") {}

    
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        charityChainContract = _minter;
        emit MinterSet(_minter);
    }

    
    function mint(address to, uint256 amount) external {
        require(msg.sender == charityChainContract, "Only CharityChain can mint");
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
    }
}
