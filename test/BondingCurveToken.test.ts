import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, utils } from "ethers";

describe("BondingCurveToken", function () {
  let bondingCurveToken: Contract;
  let user1: Signer;
  const slope: number = 1000;

  let userAddress1: String;

  function sum(n: number): number {
    return (n / 2) * (1 + n);
  }

  function calculatePriceForBuy(
    tokensToBuy: number,
    totalSupply: number,
    slope: number
  ): number {
    return (
      (slope *
        (tokensToBuy * (tokensToBuy + 1) + 2 * totalSupply * tokensToBuy)) /
      2
    );
  }

  before(async function () {
    const BondingCurveToken = await ethers.getContractFactory(
      "BondingCurveToken"
    );
    bondingCurveToken = await BondingCurveToken.deploy(
      "BondingCurveToken",
      "BCT",
      slope
    );
    await bondingCurveToken.deployed();
    [, user1] = await ethers.getSigners();
    userAddress1 = await user1.getAddress();
  });

  it("Should deploy the BondingCurveToken contract successfully", async () => {
    const codeSize = await ethers.provider
      .getCode(bondingCurveToken.address)
      .then((code) => {
        return code.length;
      });
    expect(codeSize).to.be.greaterThan(100);
  });

  it("Should allow a user to buy tokens", async () => {
    const balanceBefore = await bondingCurveToken.balanceOf(userAddress1);
    const price = await bondingCurveToken.calculatePriceForBuy(10);
    await bondingCurveToken.connect(user1).buy(10, { value: price });
    const balanceAfter = await bondingCurveToken.balanceOf(userAddress1);
    expect(balanceAfter.sub(balanceBefore)).to.equal(10);
  });

  it("Should allow a user to sell tokens at a 10% loss", async () => {
    const balanceBefore = await bondingCurveToken.balanceOf(userAddress1);
    expect(balanceBefore).to.equal(10);

    await bondingCurveToken.connect(user1).sell(10);

    const balanceAfter = await bondingCurveToken.balanceOf(userAddress1);
    expect(balanceAfter).to.equal(0);
  });

  it("Should fail when buying tokens with insufficient ether", async () => {
    const price = await bondingCurveToken.calculatePriceForBuy(10);
    await expect(
      bondingCurveToken.connect(user1).buy(10, { value: price - 1 })
    ).to.be.revertedWith("Not enough Ether to buy tokens");
  });

  it("Should fail when selling more tokens than the user has", async () => {
    await expect(bondingCurveToken.connect(user1).sell(11)).to.be.revertedWith(
      "Not enough tokens to sell"
    );
  });

  it("Should correctly calculate the price for buying tokens", async () => {
    const price = await bondingCurveToken.calculatePriceForBuy(10);
    const expectedPrice = slope * sum(10);

    expect(price).to.equal(expectedPrice);
  });

  it("Should correctly calculate the price for selling tokens", async () => {
    await bondingCurveToken.connect(user1).buy(10, {
      value: utils.parseEther("1"),
    });
    const price = await bondingCurveToken.calculatePriceForSell(10);
    const expectedPrice = slope * sum(10);

    expect(price).to.equal(expectedPrice);
  });

  it("Should correctly calculate the price for selling tokens if higher than totalSupply", async () => {
    const price = await bondingCurveToken.calculatePriceForSell(100000000);
    const expectedPrice = slope * sum(10);

    expect(price).to.equal(expectedPrice);
  });

  it("Should return the current price", async () => {
    const totalSupply = await bondingCurveToken.totalSupply();
    const price = await bondingCurveToken.getCurrentPrice();

    expect(price).to.equal(totalSupply.mul(slope));
  });

  it("Should sell 10 tokens at 10% loss", async () => {
    await bondingCurveToken.connect(user1).sell(10);
  });

  it("Should withdraw the lost ETH", async () => {
    await bondingCurveToken.withdraw();
  });

  it("Should not able withdraw if nothing to withdraw", async () => {
    await expect(bondingCurveToken.withdraw()).to.be.revertedWith(
      "No ETH to withdraw"
    );
  });

  it("Should not able withdraw if nothing to withdraw", async () => {
    await expect(
      bondingCurveToken.connect(user1).withdraw()
    ).to.be.revertedWith("Ownable: caller is not the owner'");
  });

  it("Should correctly calculate the price for buying 10,000 tokens", async () => {
    const price = await bondingCurveToken.calculatePriceForBuy(10000);
    const expectedPrice = calculatePriceForBuy(10000, 0, slope);
    expect(price).to.equal(expectedPrice);
  });

  it("Should correctly buy 10,000 tokens", async () => {
    const price = await bondingCurveToken.calculatePriceForBuy(10000);
    const balanceBefore = await bondingCurveToken.balanceOf(userAddress1);
    await bondingCurveToken.connect(user1).buy(10000, {
      value: price,
    });
    const balanceAfter = await bondingCurveToken.balanceOf(userAddress1);
    expect(balanceAfter.sub(balanceBefore)).to.equal(10000);
  });

  it("Should correctly calculate the price for selling tokens", async () => {
    const price = await bondingCurveToken.calculatePriceForSell(1);
    const totalSupply = await bondingCurveToken.totalSupply();

    expect(price).to.equal(totalSupply.mul(slope));
  });
});
