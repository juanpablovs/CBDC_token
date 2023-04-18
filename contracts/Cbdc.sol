// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "hardhat/console.sol";

contract Cbdc is ERC20{

    address public controllingParty; // the government
    uint256 public interestRateBasisPoints = 500;
    mapping(address => bool) public blacklist; // addresses that cannot move their money
    mapping(address => uint256) private stakedTreasuryBond; // stake by buying bonds (of the government of course) to gain interest rate
    mapping(address => uint256) private stakedFromTs; // the timesstamp of when an address started to stake

    event UpdateControllingParty(address oldControllingParty, address newControllingParty);
    event UpdateInterestRate(uint256 oldInterest, uint256 newInterestRate);
    event IncreaseMoneySupply(uint256 oldMoneySupply, uint256 inflationAmount);
    event UpdateBlacklist(address criminal, bool blocked);
    event StakeTreasuryBonds(address user, uint256 amount);
    event UnstakeTreasuryBonds(address user, uint256 amount);
    event ClaimTreasuryBonds(address user, uint256 amount);


    constructor(address _controllingParty, uint256 initialSupply) ERC20("Central Bank Digital Currency", "CBDC") {
        controllingParty = _controllingParty;
        _mint(controllingParty, initialSupply);
    }
}
