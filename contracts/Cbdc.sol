// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// import "hardhat/console.sol";

/// Invalid msg.sender, must be controlling party
error NotControllingParty(string _message);
error NotToAddressZero(string _message);
error IncorrectAmountValue(string _message);
error IncorrectBalanceValue(string _message);
error IncorrectReclaimedAmount(string _message);
error BlacklistedAddress(string _message);

contract Cbdc is ERC20 {
    address public controllingParty; // the government
    uint256 public interestRateBasisPoints = 500;
    mapping(address => bool) public blacklist; // addresses that cannot move their money
    mapping(address => uint256) private stakedTreasuryBond; // stake by buying bonds (of the government of course) to gain interest rate
    mapping(address => uint256) private stakedFromTS; // the timesstamp of when an address started to stake

    event UpdateControllingParty(
        address oldControllingParty,
        address newControllingParty
    );
    event UpdateInterestRate(uint256 oldInterest, uint256 newInterestRate);
    event IncreaseMoneySupply(uint256 oldMoneySupply, uint256 inflationAmount);
    event UpdateBlacklist(address criminal, bool blocked);
    event StakeTreasuryBonds(address user, uint256 amount);
    event UnstakeTreasuryBonds(address user, uint256 amount);
    event ClaimTreasuryBonds(address user, uint256 amount);

    constructor(
        address _controllingParty,
        uint256 initialSupply
    ) ERC20("Central Bank Digital Currency", "CBDC") {
        controllingParty = _controllingParty;
        _mint(controllingParty, initialSupply);
    }

    function updateControllingParty(address newControllingParty) external {
        if (msg.sender != controllingParty) {
            revert NotControllingParty("Not the controlling party");
        }
        if (newControllingParty == address(0)) {
            revert NotToAddressZero(
                "New controlling party cannot be the zero address"
            );
        }

        address oldControllingParty = controllingParty;

        controllingParty = newControllingParty;

        // as an additional step we transfer all the coins to the new controllingparty
        _transfer(
            oldControllingParty,
            newControllingParty,
            balanceOf(oldControllingParty)
        );

        emit UpdateControllingParty(oldControllingParty, newControllingParty);
    }

    function updateInterestRate(uint256 newInterestRateBasisPoints) external {
        if (msg.sender != controllingParty) {
            revert NotControllingParty("Not the controlling party");
        }
        uint256 oldInterestRateBasisPoint = interestRateBasisPoints;
        interestRateBasisPoints = newInterestRateBasisPoints;
        emit UpdateInterestRate(
            oldInterestRateBasisPoint,
            newInterestRateBasisPoints
        );
    }

    function increaseMoneySupply(uint256 inflationAmount) external {
        if (msg.sender != controllingParty) {
            revert NotControllingParty("Not the controlling party");
        }
        uint256 oldMoneySupply = totalSupply();
        _mint(controllingParty, inflationAmount);
        emit IncreaseMoneySupply(oldMoneySupply, inflationAmount);
    }

    function updateBlacklist(address criminal, bool blacklisted) external {
        if (msg.sender != controllingParty) {
            revert NotControllingParty("Not the controlling party");
        }
        blacklist[criminal] = blacklisted;
        emit UpdateBlacklist(criminal, blacklisted);
    }

    function stakeTreasuryBonds(uint256 amount) external {
        if (amount <= 0) {
            revert IncorrectAmountValue("Amount value must be greater than 0");
        }
        if (balanceOf(msg.sender) < amount) {
            revert IncorrectBalanceValue("Balance is less than amount");
        }
        _transfer(msg.sender, address(this), amount);
        if (stakedTreasuryBond[msg.sender] > 0) claimTreasuryBonds();
        stakedFromTS[msg.sender] = block.timestamp;
        stakedTreasuryBond[msg.sender] += amount;
        emit StakeTreasuryBonds(msg.sender, amount);
    }

    function unstakeTreasuryBonds(uint256 amount) external {
        if (amount <= 0) {
            revert IncorrectAmountValue("Amount value must be greater than 0");
        }
        if (stakedTreasuryBond[msg.sender] >= amount) {
            revert IncorrectReclaimedAmount("Amount is > than staked");
        }
        claimTreasuryBonds();
        stakedTreasuryBond[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
        emit UnstakeTreasuryBonds(msg.sender, amount);
    }

    function claimTreasuryBonds() public {
        if (stakedTreasuryBond[msg.sender] > 0) {
            revert IncorrectAmountValue("Staked is <= 0");
        }
        uint256 secondsStaked = block.timestamp - stakedFromTS[msg.sender];
        uint256 rewards = stakedTreasuryBond[msg.sender] * secondsStaked * interestRateBasisPoints / (10000 * 31536000);
        stakedFromTS[msg.sender] = block.timestamp;
        _mint(msg.sender, rewards);
        emit ClaimTreasuryBonds(msg.sender, rewards);
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        if (blacklist[from]) {
            revert BlacklistedAddress("Sender address is blacklisted");
        }
        if (blacklist[to]) {
            revert BlacklistedAddress("Receiver address is blacklisted");
        }
        super._transfer(from, to, amount);
    }
}
