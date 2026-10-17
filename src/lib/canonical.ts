import { keccak256, toHex, stringToBytes } from "viem";

export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`);
  return "{" + pairs.join(",") + "}";
}

export function hashCanonical(canonicalString: string): `0x${string}` {
  return keccak256(stringToBytes(canonicalString));
}