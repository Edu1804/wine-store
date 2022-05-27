const { expect } = require("chai");
//const { ethers } = require("hardhat");
//import {ethers} from 'ethers';

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed(); //deploy the NFTMarket contract
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed(); //deploy the NFT contract
    const nftContractAddress = nft.address;

    //get the listing price
    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();

    //set an auction price
    const auctionPrice = ethers.utils.parseUnits("100", "ether");

    await nft.createToken("https://www.mytokenlocation.com");
    await nft.createToken("https://www.mytokenlocation2.com");

    //adding extra values
    const barricaTime=5;
    const harvestYear=1967;
    const typeWine="tinto";
    let hashId=await market.createHash("marketAddress", "tokenId", barricaTime.toString(), typeWine.toString(), harvestYear.toString()).toString();

    //create 2 test nfts
    await market.createMarketItem(nftContractAddress, 1, hashId, barricaTime, harvestYear, typeWine, auctionPrice, {value: listingPrice} );

    await market.createMarketItem(nftContractAddress, 2, hashId, barricaTime, harvestYear, typeWine, auctionPrice, {value: listingPrice} );

    const [_, buyerAddress ] = await ethers.getSigners();

    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1,
       {value: auctionPrice});

       //fetch market items
       let items = await market.fetchMarketItems();

       items = await Promise.all(items.map(async i => {
        const tokenUri = await nft.tokenURI(i.tokenId);

        let items = {
          price: i.price.toString(),
          tokenId: i.tokenId,
          hash: i.hashId,
          barrelTime: i.barricaTime.toString(),
          harvestYear: i.harvestYear.toString(),
          typeWine: i.typeWine.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item;
       }));

      console.log('items: ', items);

  });
});