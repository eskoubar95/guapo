import { mergeShipmondoProductsByCode } from "../lib/merge-shipmondo-product-lists";
import type { ShipmondoProduct } from "../types";

describe("mergeShipmondoProductsByCode", () => {
  it("merges by code with later lists winning", () => {
    const a: ShipmondoProduct[] = [{ code: "A", name: "first" }];
    const b: ShipmondoProduct[] = [{ code: "B" }, { code: "A", name: "second" }];
    const out = mergeShipmondoProductsByCode([a, b]);
    expect(out).toHaveLength(2);
    const byCode = new Map(out.map((p) => [p.code, p]));
    expect(byCode.get("A")?.name).toBe("second");
    expect(byCode.get("B")).toBeDefined();
  });
});
