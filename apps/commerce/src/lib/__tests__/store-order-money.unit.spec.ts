import { describe, expect, it } from "@jest/globals";
import { toAmountMajor } from "../store-order-money";

describe("toAmountMajor", () => {
  it("passes through plain numbers (DKK major)", () => {
    expect(toAmountMajor(164.5)).toBe(164.5);
  });

  it("parses BigNumber-like raw JSON", () => {
    expect(toAmountMajor({ raw_: { value: "112.5", precision: 20 } })).toBe(112.5);
  });

  it("parses flat { value } shape", () => {
    expect(toAmountMajor({ value: "89.99" })).toBe(89.99);
  });
});
