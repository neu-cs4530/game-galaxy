import { describe, expect, it } from "vitest";
import { sortBySuit } from "../../src/games/mahjong/mahjongTiles.ts";

describe("sortBySuit", () => {
  it("should sort tiles by suit and value", () => {
    const input = ["3b", "1d", "2c", "9d", "5b", "4c"];
    const expected = ["3b", "5b", "2c", "4c", "1d", "9d"];
    expect(sortBySuit(input)).toStrictEqual(expected);
  });

  it("should handle duplicate tiles", () => {
    const input = ["3b", "1d", "3b", "2c", "1d", "2d"];
    const expected = ["3b", "3b", "2c", "1d", "1d", "2d"];
    expect(sortBySuit(input)).toStrictEqual(expected);
  });

  it("should handle non-suit tiles", () => {
    const input = ["rd", "ew", "3b", "1d", "2c", "3b", "rd", "nw"];
    const expected = ["3b", "3b", "2c", "1d", "ew", "nw", "rd", "rd"];
    expect(sortBySuit(input)).toStrictEqual(expected);
  });

  it("should handle empty array", () => {
    expect(sortBySuit([])).toStrictEqual([]);
  });
});
