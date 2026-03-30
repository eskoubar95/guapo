import {
  formatWeightIntervalLabel,
  mergePriceBandsWithWeightIntervals,
} from "../lib/merge-price-bands-weight-intervals";

describe("mergePriceBandsWithWeightIntervals", () => {
  it("maps intervals to max_grams and preserves amounts by max_grams", () => {
    const intervals = [
      { from_weight: 0, to_weight: 2000 },
      { from_weight: 2001, to_weight: 5000 },
    ];
    const existing = [
      { max_grams: 2000, amount_minor: 1000 },
      { max_grams: 5000, amount_minor: 2000 },
    ];
    const out = mergePriceBandsWithWeightIntervals(intervals, existing);
    expect(out).toEqual([
      { max_grams: 2000, amount_minor: 1000 },
      { max_grams: 5000, amount_minor: 2000 },
    ]);
  });

  it("defaults missing amounts to 0", () => {
    const out = mergePriceBandsWithWeightIntervals([{ from_weight: 0, to_weight: 1000 }], []);
    expect(out).toEqual([{ max_grams: 1000, amount_minor: 0 }]);
  });
});

describe("formatWeightIntervalLabel", () => {
  it("shows kg for large gram ranges", () => {
    expect(formatWeightIntervalLabel({ from_weight: 0, to_weight: 2000 })).toMatch(/kg/);
  });
});
