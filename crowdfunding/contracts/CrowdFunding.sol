// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./Campaign.sol";

contract CrowdFunding {
    mapping(uint256 => Campaign) public campaigns;

    uint256 public numberOfCampaigns = 0;

    // accept info => return campaign id
    function createCampaign(string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image) public returns (uint256) {
        Campaign campaign = new Campaign(_title, _description, _target, _deadline, _image);
        campaigns[numberOfCampaigns] = campaign;

        numberOfCampaigns++;
        
        return numberOfCampaigns - 1;
    }
}