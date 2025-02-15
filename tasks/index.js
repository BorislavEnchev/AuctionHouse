const { task } = require("hardhat/config");

task("deploy", "Deploy NFT and AuctionHouse contracts")
    .addParam("owner", "Initial owner of the contract")
    .setAction(async (taskArgs, hre) => {
        const [deployer] = await hre.ethers.getSigners();
        console.log(`\nDeploying contracts with the account: ${await deployer.getAddress()}`);

        // Deploy NFT contract
        const NFT = await hre.ethers.getContractFactory("NFT");
        const nft = await NFT.deploy(taskArgs.owner);
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();
        console.log(`NFT deployed to: ${await nft.getAddress()}`);

        // Deploy AuctionHouse contract
        const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
        const auctionHouse = await AuctionHouse.deploy();
        await auctionHouse.waitForDeployment();
        const auctionHouseAddress = await auctionHouse.getAddress();
        console.log(`AuctionHouse deployed to: ${await auctionHouse.getAddress()}`);

        // Verify contracts if on Sepolia network
        if (hre.network.name === "sepolia") {
            console.log("Verifying contracts on Sepolia network...");

            // Verify NFT contract
            try {
                await hre.run("verify:verify", {
                    address: nftAddress,
                    constructorArguments: [taskArgs.owner],
                });
                console.log("NFT verified successfully!");
            } catch (error) {
                console.log("Error verifying NFT contract:", error);                
            }            

            // Verify AuctionHouse contract
            try {
                await hre.run("verify:verify", {
                    address: auctionHouseAddress,
                    constructorArguments: [],
                });
                console.log("AuctionHouse verified successfully!");
            } catch (error) {
                console.log("Error verifying AuctionHouse contract:", error);                
            }

            console.log("\nDeployment summary:");
            console.log("-------------------");
            console.log("NFT deployed to:", nftAddress);
            console.log("AuctionHouse deployed to:", auctionHouseAddress);
        }
    });