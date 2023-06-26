// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Campaign is Ownable {
    //using SafeERC20 for IERC20;
    using Address for address payable;

    struct Donator {
        address donator;
        uint256 totalDonated;
    }

    struct Description {
        string title;  // Campaign title
        string description; // Campaign description
        uint256 target; // raise ammount
        uint256 deadline; 
        string image;
    }

    Description description;
    uint256 numberOfDonators;
    uint256 amountCollected;
    mapping (uint256=>address) id2donator;
    mapping (address => Donator) donators;

    constructor (
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) {
        require(_deadline > block.timestamp, "The deadline should be a date in future.");
        description.title = _title;
        description.description = _description;
        description.target = _target;
        description.deadline = _deadline;
        description.image = _image;
        amountCollected = 0;
    }

    receive() external payable {
        // This function is called when ETH is sent to the contract address
        // Additional logic can be added here if needed
    }

    function donate(uint256 _amount) external payable returns (uint256) {
        require(_amount > 0, "You need to send some ether");
        require(msg.value == _amount, "Incorrect donation amount");

        Donator storage donator = donators[msg.sender];

        if (donator.totalDonated == 0) {
            id2donator[numberOfDonators] = msg.sender;
            donator.donator = msg.sender;
            donator.totalDonated = 0;
            numberOfDonators++;
        }

        donator.totalDonated += _amount;
        amountCollected += _amount;
        return _amount;
    }

    function withdraw(uint256 _amount) external returns (uint256) {
        Donator storage donator = donators[msg.sender];
        require(donator.totalDonated >= _amount, "You don't have enough tokens to withdraw");

        payable(msg.sender).transfer(_amount);

        donator.totalDonated -= _amount;
        amountCollected -= _amount;

        return _amount;
    }

    function getDonators() external view returns (Donator[] memory) {
        Donator[] memory result = new Donator[](numberOfDonators);
        for (uint256 i = 0; i < numberOfDonators; i++) {
            result[i] = donators[id2donator[i]];
        }
        return result;
    }

    function getDonator(address _donator) external view returns (Donator memory) {
        return donators[_donator];
    }

    function getAmountCollected() external view returns (uint256) {
        return amountCollected;
    }

    function getDescription() external view returns (Description memory) {
        return description;
    }
}