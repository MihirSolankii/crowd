const { ethers } = require("hardhat");

async function waitForConfirmations(txHash, confirmations) {
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  const initialBlock = receipt.blockNumber;
  
  while (true) {
    const currentBlock = await ethers.provider.getBlockNumber();
    if (currentBlock >= initialBlock + confirmations) {
      break;
    }
    // Wait for a second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  try {
    // Get the deployer's account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy the CrowdFunding contract
    const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    
    // Contract constructor parameters
    const owner = deployer.address;
    const name = "Example Campaign";
    const description = "This is an example crowdfunding campaign";
    const goal = ethers.parseEther("1000"); // 1 ETH goal
    const durationInDays = 30;

    const crowdFunding = await CrowdFunding.deploy(
      owner,
      name,
      description,
      goal,
      durationInDays
    );

    // Wait for deployment to complete
    await crowdFunding.waitForDeployment();
    const contractAddress = await crowdFunding.getAddress();
    console.log("CrowdFunding deployed to:", contractAddress);

    // Get deployment transaction hash
    const deployTxReceipt = await crowdFunding.deploymentTransaction().wait();
    const deployTxHash = deployTxReceipt.hash;

    // Add some initial tiers
    const tier1 = await crowdFunding.addTier("Bronze", ethers.parseEther("0.1"));
    await tier1.wait();
    
    const tier2 = await crowdFunding.addTier("Silver", ethers.parseEther("0.3"));
    await tier2.wait();
    
    const tier3 = await crowdFunding.addTier("Gold", ethers.parseEther("0.5"));
    await tier3.wait();
    const tier4 = await crowdFunding.addTier("Gold", ethers.parseEther("0.001"));
    await tier4.wait();


    console.log("Initial tiers added successfully");

    // Verify contract on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("Waiting for block confirmations...");
      // Wait for 6 block confirmations
      await waitForConfirmations(deployTxHash, 6);
      
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          owner,
          name,
          description,
          goal,
          durationInDays
        ],
      });
      console.log("Contract verified on Etherscan");
    }

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });