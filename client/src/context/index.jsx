import React, { useContext, createContext } from 'react';

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
} from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { EditionMetadataWithOwnerOutputSchema, ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Sepolia } from "@thirdweb-dev/chains";
import campaignData from '../contracts/Campaign.sol/Campaign.json';
import crowdFundingData from '../contracts/CrowdFunding.sol/CrowdFunding.json';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    import.meta.env.VITE_CROWDFUNDING_CONTRACT_ADDRESS,
    crowdFundingData.abi
  );

  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    'addCampaign',
  );

  const address = useAddress();
  const connect = useMetamask();
  const sdk = new ThirdwebSDK({
    ...Sepolia,
    rpc: ['https://rpc.sepolia.org']
  });

  // PASS
  const publishCampaign = async (form) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      
      const newCampaignContract = new ethers.ContractFactory(
        campaignData.abi,
        campaignData.bytecode,
        signer
      );

      const campaignContract = await newCampaignContract.deploy(
        form.title,
        form.description,
        form.target,
        new Date(form.deadline).getTime(),
        form.image
      );

      await campaignContract.deployed();
      console.log('contract deployed', campaignContract.address);

      const crowdFundingContract = new ethers.Contract(import.meta.env.VITE_CROWDFUNDING_CONTRACT_ADDRESS, crowdFundingData.abi, signer);
      data = await crowdFundingContract.addCampaign(campaignContract.address);
      console.log("Add campaign success: ", data);
    } catch (error) {
      console.log("Add campaign error: ", error);
    }
  };

  // PASS
  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    console.log(campaigns);

    const parsedCampaigns = await Promise.all(
      campaigns.map(async (campaign, i) => {
        const campaignContract = await sdk.getContract(campaign, campaignData.abi);
        const campaignDescription = await campaignContract.call('getDescription', []);
        const campaignAmountCollected = await campaignContract.call('getAmountCollected', []);
        const campaignOwner = await campaignContract.call('owner', []);
        console.log(campaignDescription);
        console.log(campaignOwner);

        const parsedCampaign = {
          owner: campaignOwner,
          title: campaignDescription[0],
          description: campaignDescription[1],
          target: ethers.utils.formatEther(campaignDescription[2].toString()),
          deadline: campaignDescription[3].toNumber(),
          amountCollected: ethers.utils.formatEther(campaignAmountCollected.toString()),
          image: campaignDescription[4],
          pId: i,
          address: campaign,
        };
        return parsedCampaign;
      })
    );
    
    console.log(parsedCampaigns);
    return parsedCampaigns;
  };

  // PASS
  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    console.log(address);
    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    console.log(allCampaigns);
    return filteredCampaigns;
  };

  // PASS
  const donate = async (campaignAddress, amount) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    //const campaignContract = await sdk.getContract(campaignAddress, campaignData.abi);
    const campaignContract = new ethers.Contract(campaignAddress, campaignData.abi, signer);

    const ethersAmount = ethers.utils.parseEther(amount.toString());
      
    const data = await campaignContract.donate(ethersAmount, {value: ethersAmount});

    return data;
  };

  const withdraw = async (campaignAddress, amount) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const campaignContract = new ethers.Contract(campaignAddress, campaignData.abi, signer);

    const ethersAmount = ethers.utils.parseEther(amount.toString());

    let data
    try {
      data = await campaignContract.withdraw(ethersAmount);
      console.log("Withdraw success: ", data);
    } catch (error) {
      console.log("Withdraw error: ", error);
    }
    return data;
  };

  // PASS
  const getDonations = async (campaignAddress) => {
    //const campaignContract = await sdk.getContract(campaignAddress, campaignData.abi);
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const campaignContract = new ethers.Contract(campaignAddress, campaignData.abi, provider);

    const donations = await campaignContract.getDonators();

    const parsedDonations = donations.map((donation) => {
      return {
        donator: donation[0],
        donation: ethers.utils.formatEther(donation[1].toString()),
      };
    });

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        withdraw,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
