import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, utils } from "ethers";
import { HOUR, increaseTime } from "../utils/helpers";

describe("NFT", function () {
  let nft: Contract;
  let token: Contract;
  let staking: Contract;
  let user1: Signer;
  let user2: Signer;

  let userAddress1: string;
  let userAddress2: string;
  let minterRoleHash: string;

  before(async function () {
    [, user1, user2] = await ethers.getSigners();
    userAddress1 = await user1.getAddress();
    userAddress2 = await user2.getAddress();

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy("NFT", "NFT");
    await nft.deployed();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("NFT", "NFT");
    await token.deployed();

    const StakingNFT = await ethers.getContractFactory("StakingNFT");
    staking = await StakingNFT.deploy(nft.address, token.address);
    await staking.deployed();

    minterRoleHash = await token.MINTER_ROLE();
  });

  it("Should deploy the NFT contract successfully", async () => {
    const codeSize = await ethers.provider.getCode(nft.address).then((code) => {
      return code.length;
    });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should add minter Role to staking contract", async () => {
    expect(await token.hasRole(minterRoleHash, await staking.address)).to.equal(
      false
    );
    await token.grantRole(minterRoleHash, await staking.address);
    expect(await token.hasRole(minterRoleHash, await staking.address)).to.equal(
      true
    );
  });

  it("Should mint an NFT with tokenID 0", async () => {
    await nft.connect(user1).mint();
    expect(await nft.ownerOf("0")).to.be.equal(userAddress1);
  });

  it("Should mint an NFT with tokenID 1", async () => {
    await nft.connect(user2).mint();
    expect(await nft.ownerOf("1")).to.be.equal(userAddress2);
  });

  it("Should deposit an NFT to the StakingNFT contract", async () => {
    await nft
      .connect(user2)
      ["safeTransferFrom(address,address,uint256)"](
        userAddress2,
        staking.address,
        "1"
      );
  });

  it("Should approve an NFT to the StakingNFT contract", async () => {
    await nft.connect(user1).approve(staking.address, "0");
  });

  it("Should deposit an NFT to the StakingNFT contract", async () => {
    await staking.connect(user1).deposit("0");
  });

  it("Should calculate rewards for user2 after increasing time by 1hour ", async () => {
    await increaseTime(HOUR);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("10", "18")
    );
  });

  it("Should calculate rewards for user2 after increasing time by another hour", async () => {
    await increaseTime(HOUR);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("20", "18")
    );
  });

  it("Should calculate rewards for user2 after increasing time per 22 hours to make 1day", async () => {
    await increaseTime(22 * HOUR);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("240", "18")
    );
  });

  it("Should calculate rewards for user2 after increasing time per 0.5 hours", async () => {
    await increaseTime(HOUR / 2);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("240", "18")
    );
  });

  it("Should not be able to claim rewards for user2 from another address", async () => {
    await expect(staking.claimRewards(1)).to.be.revertedWith(
      "You're not the owner"
    );
  });

  it("Should claim rewards for user2", async () => {
    expect(await token.balanceOf(userAddress2)).to.be.equal(
      utils.parseUnits("0", "18")
    );
    await staking.connect(user2).claimRewards(1);
    expect(await token.balanceOf(userAddress2)).to.be.equal(
      utils.parseUnits("240", "18")
    );
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("0", "18")
    );
  });

  it("Should calculate rewards for user2 after increasing time per 0.5 hours", async () => {
    await increaseTime(HOUR / 2);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("10", "18")
    );
  });

  it("Should calculate rewards for user2 after increasing time per 1 hour", async () => {
    await increaseTime(HOUR);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("20", "18")
    );
  });

  it("Should not be able withdraw token 1 from user1", async () => {
    await expect(staking.withdraw(1)).to.be.revertedWith(
      "You're not the owner"
    );
  });

  it("Should withdraw token 1 from user1", async () => {
    const balanceBefore = await token.balanceOf(userAddress2);
    expect(balanceBefore).to.be.equal(utils.parseUnits("240", "18"));
    const pendingRewards = await staking.calculateRewards(1);
    await staking.connect(user2).withdraw(1);
    const balanceAfter = await token.balanceOf(userAddress2);

    expect(balanceAfter).to.be.equal(balanceBefore.add(pendingRewards));

    expect(await nft.ownerOf(1)).to.be.equal(userAddress2);
  });

  it("Should not returns any rewards if no nft deposited", async () => {
    await increaseTime(HOUR);
    expect(await staking.calculateRewards(1)).to.be.equal(
      utils.parseUnits("0", "18")
    );
  });
});
