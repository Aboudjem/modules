import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, utils } from "ethers";

describe("GodModeToken", function () {
  let godModeToken: Contract;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let admin: Signer;

  let userAddress1: String;
  let userAddress2: String;
  let userAddress3: String;
  let adminAddress: String;

  before(async function () {
    const GodModeToken = await ethers.getContractFactory("GodModeToken");
    godModeToken = await GodModeToken.deploy("GodModeToken", "GOD");
    await godModeToken.deployed();
    [admin, user1, user2, user3] = await ethers.getSigners();
    userAddress1 = await user1.getAddress();
    userAddress2 = await user2.getAddress();
    userAddress3 = await user3.getAddress();
    adminAddress = await admin.getAddress();
  });

  it("Should deploy the GodModeToken contract successfully", async () => {
    const codeSize = await ethers.provider
      .getCode(godModeToken.address)
      .then((code) => {
        return code.length;
      });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should transfer 1000 GOD tokens to user1", async () => {
    expect(await godModeToken.balanceOf(userAddress1)).to.equal("0");
    await godModeToken.transfer(userAddress1, utils.parseEther("1000"));
    expect(await godModeToken.balanceOf(userAddress1)).to.equal(
      utils.parseEther("1000")
    );
  });

  it("Should transferFrom user1 to user2", async () => {
    expect(await godModeToken.balanceOf(userAddress1)).to.equal(
      utils.parseEther("1000")
    );
    expect(await godModeToken.balanceOf(userAddress2)).to.equal("0");

    await godModeToken
      .connect(user1)
      .approve(userAddress2, utils.parseEther("500"));
    await godModeToken
      .connect(user2)
      .transferFrom(userAddress1, userAddress2, utils.parseEther("400"));

    expect(await godModeToken.allowance(userAddress1, userAddress2)).to.equal(
      utils.parseEther("100")
    );
  });

  it("Should fail transferFrom user2 to user3", async () => {
    expect(await godModeToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("400")
    );
    expect(await godModeToken.balanceOf(userAddress3)).to.equal("0");

    await expect(
      godModeToken
        .connect(user2)
        .transferFrom(userAddress2, userAddress3, utils.parseEther("100"))
    ).to.be.revertedWith("ERC20: insufficient allowance");

    expect(await godModeToken.allowance(userAddress2, userAddress3)).to.equal(
      utils.parseEther("0")
    );
  });

  it("Should transferFrom user2 to user3 with GOD Mode enabled (admin)", async () => {
    expect(await godModeToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("400")
    );
    expect(await godModeToken.balanceOf(userAddress3)).to.equal("0");
    expect(await godModeToken.allowance(userAddress2, adminAddress)).to.equal(
      utils.parseEther("0")
    );

    await godModeToken.transferFrom(
      userAddress2,
      userAddress3,
      utils.parseEther("50")
    );

    expect(await godModeToken.balanceOf(userAddress2)).to.equal(
      utils.parseEther("350")
    );
    expect(await godModeToken.balanceOf(userAddress3)).to.equal(
      utils.parseEther("50")
    );
  });
});
