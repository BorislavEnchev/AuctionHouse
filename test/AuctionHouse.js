const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionHouse", function () {
  const TOKEN_ID = 0;

  async function initialDeployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [seller, bidder] = await ethers.getSigners();

    const CustomTokenFactory = await ethers.getContractFactory("NFT");
    const nftContract = await CustomTokenFactory.deploy(seller);

    const AuctionHouseFactory = await ethers.getContractFactory("AuctionHouse");
    const auctionContract = await AuctionHouseFactory.deploy(seller);

    return {
      auctionContract,
      nftContract,
      seller,
      bidder,
    };
  }

  describe("Create Auction", function () {
    it("Should revert if min price is zero or less", async function () {
      const { auctionContract, seller, nftContract } = await loadFixture(initialDeployFixture);

      await expect(
        auctionContract.connect(seller).createAuction(
          TOKEN_ID, 
          await nftContract.getAddress(), 
          0, 
          0, 
          0, 
          0, 
          0, 
          0
        )).to.be.revertedWithCustomError(auctionContract, "MinPriceCannotBeZero");
    });

    it("Should revert if start time is less than the current time", async function () {
      const { auctionContract, seller, nftContract } = await loadFixture(initialDeployFixture);

      const timeNow = await time.latest();
      const next = timeNow + 2;
      time.setNextBlockTimestamp(next);

      await expect(
        auctionContract.connect(seller).createAuction(
          TOKEN_ID, 
          await nftContract.getAddress(), 
          1, 
          next - 1, 
          0, 
          0, 
          0, 
          0
        )).to.be.revertedWithCustomError(auctionContract, "InvalidStartTime");
    });

    it("Should revert if the end time is too short", async function () {
      const { auctionContract, seller, nftContract } = await loadFixture(initialDeployFixture);

      const timeNow = await time.latest();
      const next = timeNow + 2;
      time.setNextBlockTimestamp(next);
      const ONE_DAY = 60 * 60 * 24;

      await expect(
        auctionContract.connect(seller).createAuction(
          TOKEN_ID, 
          await nftContract.getAddress(), 
          1, 
          next, 
          next + ONE_DAY -1, 
          0, 
          0, 
          0
        )).to.be.revertedWithCustomError(auctionContract, "InvalidEndTime")
        .withArgs("Auction duration too short");
    });

    it("Should revert if the end time is too long", async function () {
      const { auctionContract, seller, nftContract } = await loadFixture(initialDeployFixture);

      const timeNow = await time.latest();
      const next = timeNow + 2;
      time.setNextBlockTimestamp(next);
      const SIXTY_DAYS = 60 * 60 * 60 * 24;

      await expect(
        auctionContract.connect(seller).createAuction(
          TOKEN_ID, 
          await nftContract.getAddress(), 
          1, 
          next, 
          next + SIXTY_DAYS + 1, 
          0, 
          0, 
          0
        )).to.be.revertedWithCustomError(auctionContract, "InvalidEndTime")
        .withArgs("Auction duration too long");
    });

    it("Should properly transfer NFT", async function () {
      const { auctionContract, seller, nftContract } = await loadFixture(initialDeployFixture);      
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

      expect(await nftContract.ownerOf(TOKEN_ID)).to.equal(seller.address);

      const nftContractAddress = await nftContract.getAddress();
      const auctionAddress = await auctionContract.getAddress();
      
      await nftContract.connect(seller).approve(auctionAddress, TOKEN_ID);

      const timeNow = await time.latest();
      const next = timeNow + 2;
      time.setNextBlockTimestamp(next);
      const ONE_DAY = 60 * 60 * 24;

      await expect (auctionContract.connect(seller)
      .createAuction(
        TOKEN_ID, 
        nftContractAddress, 
        1, 
        next + 1, 
        next + ONE_DAY * 30, 
        1, 
        1, 
        1
      )).to.emit(auctionContract, "AuctionCreated").withArgs(0);

      expect(await nftContract.ownerOf(TOKEN_ID)).to.equal(auctionAddress);

      const auction = await auctionContract.auctions(0);

      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.nftAddress).to.equal(nftContractAddress);
      expect(auction.minPrice).to.equal(1);
      expect(auction.startTime).to.equal(next + 1);
      expect(auction.endTime).to.equal(next + ONE_DAY * 30);
      expect(auction.minBidIncrement).to.equal(1);
      expect(auction.timeExtensionWindow).to.equal(1);
      expect(auction.timeExtensionIncrease).to.equal(1);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.highestBid).to.equal(0);
      expect(auction.highestBidder).to.equal(ZERO_ADDRESS);
      expect(auction.claimed).to.equal(false);
    });

  });
});
