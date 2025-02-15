// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

struct Auction {
    uint256 tokenId;
    address nftAddress;
    uint256 minPrice;
    uint256 startTime;
    uint256 endTime;
    uint256 minBidIncrement;
    uint256 timeExtensionWindow;
    uint256 timeExtensionIncrease;
    address seller;
    uint256 highestBid;
    address highestBidder;
    bool claimed;
}

error MinPriceCannotBeZero();
error InvalidStartTime();
error InvalidEndTime(string message);
error InsufficientBidAmount();
error NotInBidPeriod();
error InvalidAuction();
error AuctionUnfinished();
error NotClaimer();
error AlreadyClaimed();
error NothingToClaim();
error HighestBidder();
error NoBidsMade();

contract AuctionHouse is Ownable {
    uint256 MIN_AUCTION_DURATION = 1 days;
    uint256 MAX_AUCTION_DURATION = 60 days;
    uint256 private _nextAuctionId;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 auctionId => mapping (address bidder => uint256 bid)) public bids;

    event AuctionCreated(uint256 indexed auctionId);
    event NewBid(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event NFTClaimed(uint256 indexed auctionId, address indexed claimer);
    event BidClaimed(uint256 indexed auctionId, address indexed claimer, uint256 amount);
    event RewardClaimed(uint256 indexed auctionId, address indexed claimer, uint256 amount, uint256 fee);

    constructor() Ownable(msg.sender) {}

    function createAuction(
        uint256 tokenId,
        address tokenAddress,
        uint256 minPrice, 
        uint256 startTime, 
        uint256 endTime,
        uint256 minBidIncrement,
        uint256 timeExtensionWindow,
        uint256 timeExtensionIncrease
        ) external {

        if (minPrice == 0) {
            revert MinPriceCannotBeZero();
        }
        if (startTime < block.timestamp) {
            revert InvalidStartTime();            
        }
        if (endTime < startTime + MIN_AUCTION_DURATION) {
            revert InvalidEndTime("Auction duration too short");
        }
        if (endTime > startTime + MAX_AUCTION_DURATION) {
            revert InvalidEndTime("Auction duration too long");
        }

        uint256 auctionId = _nextAuctionId++;
        auctions[auctionId] = Auction({
            tokenId: tokenId,
            nftAddress: tokenAddress,
            minPrice: minPrice, 
            startTime: startTime, 
            endTime: endTime, 
            minBidIncrement: minBidIncrement, 
            timeExtensionWindow: timeExtensionWindow, 
            timeExtensionIncrease: timeExtensionIncrease,
            seller: msg.sender,
            highestBid: 0,
            highestBidder: address(0),
            claimed: false
        });

        // The NFT needs allowance
        IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(auctionId);
    }

    function bid(uint256 auctionId) external payable {
        Auction memory auction = auctions[auctionId];

        if (auction.tokenId == 0 || auction.nftAddress == address(0)) {
            revert InvalidAuction();            
        }

        if (block.timestamp < auction.startTime || block.timestamp > auction.endTime) {
            revert NotInBidPeriod();            
        }

        uint256 newBid = bids[auctionId][msg.sender] + msg.value;
        if (newBid < auction.minPrice || 
        (auction.highestBid != 0 && newBid < auction.highestBid + auction.minBidIncrement)) 
        {
            revert InsufficientBidAmount();            
        }

        if (block.timestamp > auction.endTime - auction.timeExtensionWindow) {
            auction.endTime += auction.timeExtensionIncrease;    
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        bids[auctionId][msg.sender] = newBid;

        emit NewBid(auctionId, msg.sender, msg.value);
    }

    function claimNFT(uint256 auctionId) external auctionFinished(auctionId) {
        Auction memory auction = auctions[auctionId];

        if (msg.sender != auction.highestBidder && 
            msg.sender != auction.seller &&
            auction.highestBid != 0) {
            revert NotClaimer();
        }

        if (auction.claimed) {
            revert AlreadyClaimed();            
        }

        auction.claimed = true;

        address claimer = auction.highestBidder != address(0) ? auction.highestBidder : auction.seller;
        IERC721(auction.nftAddress).transferFrom(address(this), claimer, auction.tokenId);

        emit NFTClaimed(auctionId, claimer);
    }

    function claimBid(uint256 auctionId) external payable {
        Auction memory auction = auctions[auctionId];
        uint256 userBids = bids[auctionId][msg.sender];

        if (auction.highestBidder == msg.sender) {
            revert HighestBidder();
        }

        if (userBids == 0) {
            revert NothingToClaim();
        }

        bids[auctionId][msg.sender] = 0;

        _trasferETH(payable(msg.sender), userBids);

        emit BidClaimed(auctionId, msg.sender, userBids);
    }

    function claimReward(uint256 auctionId) 
    external auctionFinished(auctionId) {
        Auction memory auction = auctions[auctionId];
        uint256 reward = auction.highestBid;

        if (reward == 0) {
            revert NoBidsMade();
        }
        if (msg.sender != auction.seller) {
            revert NotClaimer();            
        }
        auction.highestBid = 0;

        uint256 fee = reward / 100;
        if (fee > 0) {
            _trasferETH(payable(owner()), fee);
            reward -= fee;
        }

        _trasferETH(payable(auction.seller), reward);

        emit RewardClaimed(auctionId, auction.seller, reward, fee);
    }

    function _trasferETH(address payable to, uint256 amount) private {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Transfer failed.");
    }

    modifier auctionFinished(uint256 auctionId) {
        if (block.timestamp < auctions[auctionId].endTime) {
            revert AuctionUnfinished();            
        }
        _;
    }
}
