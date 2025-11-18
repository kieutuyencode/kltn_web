import Decimal from "decimal.js";
import { formatUnits, parseUnits } from "ethers";

export const fromUnits = (
  value: string | number | bigint,
  decimals: number = 18
) => new Decimal(formatUnits(value, decimals));

export const toUnits = (
  value: string | number | Decimal,
  decimals: number = 18
) => parseUnits(new Decimal(value).toFixed(decimals), decimals);
