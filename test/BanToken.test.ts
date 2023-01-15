import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, utils } from "ethers";

describe("BanToken", function () {
  let banToken: Contract;
  let user1: Signer;
  let user2: Signer;
  let admin: Signer;

  let userAddress1: String;
  let userAddress2: String;

  before(async function () {
    const BanToken = await ethers.getContractFactory("BanToken");
    banToken = await BanToken.deploy("BanToken", "BAN");
    await banToken.deployed();
    [admin, user1, user2] = await ethers.getSigners();
    userAddress1 = await user1.getAddress();
    userAddress2 = await user2.getAddress();
  });

  it("Should deploy the BanToken contract successfully", async () => {
    const codeSize = await ethers.provider
      .getCode(banToken.address)
      .then((code) => {
        return code.length;
      });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should successfully restrict an address when called by the owner", async () => {
    expect(await banToken.isRestricted(userAddress1)).to.equal(false);
    await banToken.connect(admin).restrictAddress(userAddress1);
    expect(await banToken.isRestricted(userAddress1)).to.equal(true);
  });

  it("Should fail to restrict an address when called by a non-admin user", async () => {
    await expect(
      banToken.connect(user1).restrictAddress(userAddress2)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should fail to un-restrict an address when called by a non-admin user", async () => {
    await expect(
      banToken.connect(user1).unRestrictAddress(userAddress2)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should successfully un-restrict an address when called by the owner", async () => {
    expect(await banToken.isRestricted(userAddress1)).to.equal(true);
    await banToken.connect(admin).unRestrictAddress(userAddress1);
    expect(await banToken.isRestricted(userAddress1)).to.equal(false);
  });

  it("Should successfully transfer tokens to an unrestricted address", async () => {
    expect(await banToken.balanceOf(userAddress1)).to.equal(0);
    await banToken.transfer(userAddress1, utils.parseEther("1000"));
    expect(await banToken.balanceOf(userAddress1)).to.equal(
      utils.parseEther("1000")
    );
  });

  it("Should successfully restrict an address when called by the owner", async () => {
    await banToken.connect(admin).restrictAddress(userAddress1);
    expect(await banToken.isRestricted(userAddress1)).to.equal(true);
  });

  it("Should fail to transfer tokens from a restricted address", async () => {
    await expect(
      banToken.connect(user1).transfer(userAddress2, utils.parseEther("1000"))
    ).to.be.revertedWith("Restricted 'from' address.");
  });

  it("Should fail to transfer tokens to a restricted address", async () => {
    await expect(
      banToken.connect(user2).transfer(userAddress1, utils.parseEther("1000"))
    ).to.be.revertedWith("Restricted 'to' address.");
  });
});
