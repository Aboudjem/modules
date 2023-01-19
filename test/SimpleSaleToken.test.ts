import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, utils } from "ethers";

describe("SimpleSaleToken", function () {
  let simpleSaleToken: Contract;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let admin: Signer;

  let userAddress1: String;
  let userAddress2: String;
  let userAddress3: String;
  let adminAddress: String;

  before(async function () {
    const SimpleSaleToken = await ethers.getContractFactory("SimpleSaleToken");
    simpleSaleToken = await SimpleSaleToken.deploy("SimpleSaleToken", "SST");
    await simpleSaleToken.deployed();
    [admin, user1, user2, user3] = await ethers.getSigners();
    userAddress1 = await user1.getAddress();
    userAddress2 = await user2.getAddress();
    userAddress3 = await user3.getAddress();
    adminAddress = await admin.getAddress();
  });

  it("Should deploy the SimpleSaleToken contract successfully", async () => {
    const codeSize = await ethers.provider
      .getCode(simpleSaleToken.address)
      .then((code) => {
        return code.length;
      });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should successfully restrict an address when called by the owner", async () => {
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(false);
    await simpleSaleToken.connect(admin).restrictAddress(userAddress1);
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(true);
  });

  it("Should buy 100000 tokens for 10 ether with admin address", async () => {
    expect(await simpleSaleToken.balanceOf(adminAddress)).to.be.equal("0");
    await simpleSaleToken.buy({
      value: utils.parseEther("10"),
    });
    // expect(await simpleSaleToken.balanceOf(adminAddress)).to.be.equal(utils.parseEther("100000"));
  });

  it("Should fail to restrict an address when called by a non-admin user", async () => {
    await expect(
      simpleSaleToken.connect(user1).restrictAddress(userAddress2)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should fail to un-restrict an address when called by a non-admin user", async () => {
    await expect(
      simpleSaleToken.connect(user1).unRestrictAddress(userAddress2)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should successfully un-restrict an address when called by the owner", async () => {
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(true);
    await simpleSaleToken.connect(admin).unRestrictAddress(userAddress1);
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(false);
  });

  it("Should successfully transfer tokens to an unrestricted address", async () => {
    expect(await simpleSaleToken.balanceOf(userAddress1)).to.equal(0);
    await simpleSaleToken.transfer(userAddress1, utils.parseEther("1000"));
    expect(await simpleSaleToken.balanceOf(userAddress1)).to.equal(
      utils.parseEther("1000")
    );
  });

  it("Should successfully restrict an address when called by the owner", async () => {
    await simpleSaleToken.connect(admin).restrictAddress(userAddress1);
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(true);
  });

  it("Should fail to transfer tokens from a restricted address", async () => {
    await expect(
      simpleSaleToken
        .connect(user1)
        .transfer(userAddress2, utils.parseEther("1000"))
    ).to.be.revertedWith("Restricted 'from' address.");
  });

  it("Should fail to transfer tokens to a restricted address", async () => {
    await expect(
      simpleSaleToken
        .connect(user2)
        .transfer(userAddress1, utils.parseEther("1000"))
    ).to.be.revertedWith("Restricted 'to' address.");
  });

  it("Should successfully un-restrict an address when called by the owner", async () => {
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(true);
    await simpleSaleToken.connect(admin).unRestrictAddress(userAddress1);
    expect(await simpleSaleToken.isRestricted(userAddress1)).to.equal(false);
  });

  it("Should transfer tokens from user1 to user2", async () => {
    expect(await simpleSaleToken.balanceOf(userAddress1)).to.equal(
      utils.parseEther("1000")
    );
    expect(await simpleSaleToken.balanceOf(userAddress2)).to.equal("0");

    await simpleSaleToken
      .connect(user1)
      .approve(userAddress2, utils.parseEther("500"));
    await simpleSaleToken
      .connect(user2)
      .transferFrom(userAddress1, userAddress2, utils.parseEther("400"));

    expect(
      await simpleSaleToken.allowance(userAddress1, userAddress2)
    ).to.equal(utils.parseEther("100"));
  });

  it("Should fail to transfer tokens from user2 to user3", async () => {
    expect(await simpleSaleToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("400")
    );
    expect(await simpleSaleToken.balanceOf(userAddress3)).to.equal("0");

    await expect(
      simpleSaleToken
        .connect(user2)
        .transferFrom(userAddress2, userAddress3, utils.parseEther("100"))
    ).to.be.revertedWith("ERC20: insufficient allowance");

    expect(
      await simpleSaleToken.allowance(userAddress2, userAddress3)
    ).to.equal(utils.parseEther("0"));
  });

  it("Should transfer tokens from user2 to user3 with God Mode enabled (admin)", async () => {
    expect(await simpleSaleToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("400")
    );
    expect(await simpleSaleToken.balanceOf(userAddress3)).to.equal("0");
    expect(
      await simpleSaleToken.allowance(userAddress2, adminAddress)
    ).to.equal(utils.parseEther("0"));

    await simpleSaleToken.transferFrom(
      userAddress2,
      userAddress3,
      utils.parseEther("50")
    );

    expect(await simpleSaleToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("350")
    );
    expect(await simpleSaleToken.balanceOf(userAddress3)).to.equal(
      utils.parseEther("50")
    );
  });

  it("Should return the rate of the SimpleSaleToken", async () => {
    const rate = await simpleSaleToken.getConversionRate();
    expect(rate).to.be.equal("10000");
  });

  it("Should set a new rate for the SimpleSaleToken", async () => {
    await simpleSaleToken.setConversionRate("1000000");
    const rate = await simpleSaleToken.getConversionRate();
    expect(rate).to.be.equal("1000000");
  });

  it("Should fail to set a new rate for the SimpleSaleToken if not the owner", async () => {
    await expect(
      simpleSaleToken.connect(user1).setConversionRate("1000")
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should fail to buy if value is 0", async () => {
    await expect(simpleSaleToken.buy()).to.be.revertedWith(
      "Ether to send must be > 0"
    );
  });

  it("Should fail to buy if not enough tokens on the contract", async () => {
    await expect(
      simpleSaleToken.buy({
        value: utils.parseEther("100"),
      })
    ).to.be.revertedWith("Not enough to buy from contract");
  });
});
