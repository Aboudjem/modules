import { ethers } from "hardhat";
import { utils } from "ethers";

export function n18(amount: string) {
  return utils.parseUnits(amount, "ether");
}

export async function increaseTime(duration: number) {
  await ethers.provider.send("evm_increaseTime", [duration]);
  await ethers.provider.send("evm_mine", []);
}

export const HOUR = 3600;
export const DAY = HOUR * 24;
