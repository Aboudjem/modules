import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("NFT", function () {
  let nft: Contract;
  let game: Contract;
  let accounts: Signer[];

  before(async function () {
    accounts = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("Enumerable");
    nft = await NFT.deploy("NftEnum", "ENUM");
    await nft.deployed();

    const Game = await ethers.getContractFactory("Game");
    game = await Game.deploy(nft.address);
    await game.deployed();
  });

  it("Should successfully deploy the NFT contract", async () => {
    const codeSize = await ethers.provider.getCode(nft.address).then((code) => {
      return code.length;
    });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should mint 10 NFTs with token IDs ranging from 1 to 10", async () => {
    for (let i = 0; i < 10; i++) {
      await nft.connect(accounts[i]).mint();
      expect(await nft.ownerOf(i + 1)).to.equal(await accounts[i].getAddress());
    }
  });

  it("Should mint an additional 10 NFTs with token IDs ranging from 11 to 20", async () => {
    for (let i = 0; i < 10; i++) {
      await nft.connect(accounts[i]).mint();
      expect(await nft.ownerOf(i + 11)).to.equal(
        await accounts[i].getAddress()
      );
    }
  });

  it("Should return the number of prime NFT IDs held by user 0, including ID 11", async () => {
    const res = await game
      .connect(accounts[0])
      .getPrimeCount(await accounts[0].getAddress());
    expect(res).to.equal(1);
  });

  it("Should return the number of prime NFT IDs held by user 1, including ID 2", async () => {
    const res = await game
      .connect(accounts[1])
      .getPrimeCount(await accounts[1].getAddress());
    expect(res).to.equal(1);
  });

  it("Should return the number of prime NFT IDs held by user 2, including IDs 3 and 13", async () => {
    const res = await game
      .connect(accounts[2])
      .getPrimeCount(await accounts[2].getAddress());
    expect(res).to.equal(2);
  });

  it("Should return the number of prime NFT IDs held by user 3", async () => {
    const res = await game
      .connect(accounts[3])
      .getPrimeCount(await accounts[3].getAddress());
    expect(res).to.equal(0);
  });

  it("Should return the number of prime NFT IDs held by user 4, including ID 5", async () => {
    const res = await game
      .connect(accounts[4])
      .getPrimeCount(await accounts[4].getAddress());
    expect(res).to.equal(1);
  });

  it("Should return the number of prime NFT IDs held by user 5", async () => {
    const res = await game
      .connect(accounts[5])
      .getPrimeCount(await accounts[5].getAddress());
    expect(res).to.equal(0);
  });

  it("Should return the number of prime NFT IDs held by user 6, including IDs 7 and 17", async () => {
    const res = await game
      .connect(accounts[6])
      .getPrimeCount(await accounts[6].getAddress());
    expect(res).to.equal(2);
  });

  it("Should return the number of prime NFT IDs held by user 7", async () => {
    const res = await game
      .connect(accounts[7])
      .getPrimeCount(await accounts[7].getAddress());
    expect(res).to.equal(0);
  });

  it("Should return the number of prime NFT IDs held by user 8, including ID 19", async () => {
    const res = await game
      .connect(accounts[8])
      .getPrimeCount(await accounts[8].getAddress());
    expect(res).to.equal(1);
  });

  it("Should return the number of prime NFT IDs held by user 9", async () => {
    const res = await game
      .connect(accounts[9])
      .getPrimeCount(await accounts[9].getAddress());
    expect(res).to.equal(0);
  });
});
