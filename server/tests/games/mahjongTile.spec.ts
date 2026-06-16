import { describe, expect, it } from "vitest";
import {
  createDeck,
  getSuit,
  getValue,
  nextTile,
  removeOne,
  shuffle,
  sortBySuit,
} from "../../src/games/mahjong/mahjongTiles.ts";

describe("getSuit", () => {
  it("should return the correct suit for suit tiles", () => {
    expect(getSuit("4d")).toStrictEqual("d");
    expect(getSuit("8c")).toStrictEqual("c");
    expect(getSuit("1b")).toStrictEqual("b");
  });

  it("should return null for non-suit tiles", () => {
    expect(getSuit("f2")).toStrictEqual(null);
    expect(getSuit("ew")).toStrictEqual(null);
    expect(getSuit("rd")).toStrictEqual(null);
  });
});

describe("getValue", () => {
  it("should return the correct value for suit tiles", () => {
    expect(getValue("4d")).toStrictEqual(4);
    expect(getValue("8c")).toStrictEqual(8);
    expect(getValue("1b")).toStrictEqual(1);
    expect(getValue("9d")).toStrictEqual(9);
  });

  it("should return the correct value for flower and season tiles", () => {
    expect(getValue("f1")).toStrictEqual(1);
    expect(getValue("f4")).toStrictEqual(4);
    expect(getValue("s2")).toStrictEqual(2);
    expect(getValue("s3")).toStrictEqual(3);
  });

  it("should return null for honour tiles", () => {
    expect(getValue("ew")).toStrictEqual(null);
    expect(getValue("rd")).toStrictEqual(null);
    expect(getValue("nw")).toStrictEqual(null);
    expect(getValue("sw")).toStrictEqual(null);
  });
});

describe("nextTile", () => {
  it("should return the next tile in sequence for suit tiles", () => {
    expect(nextTile("1d")).toStrictEqual("2d");
    expect(nextTile("4c")).toStrictEqual("5c");
    expect(nextTile("8b")).toStrictEqual("9b");
  });

  it("should return null for 9s since there is no next tile", () => {
    expect(nextTile("9d")).toStrictEqual(null);
    expect(nextTile("9c")).toStrictEqual(null);
    expect(nextTile("9b")).toStrictEqual(null);
  });

  it("should return null for non-suit tiles", () => {
    expect(nextTile("ew")).toStrictEqual(null);
    expect(nextTile("rd")).toStrictEqual(null);
    expect(nextTile("f1")).toStrictEqual(null);
  });
});

describe("removeOne", () => {
  it("should remove the first occurrence of a tile", () => {
    expect(removeOne(["1d", "2d", "3d"], "2d")).toStrictEqual(["1d", "3d"]);
    expect(removeOne(["1d", "1d", "1d"], "1d")).toStrictEqual(["1d", "1d"]);
  });

  it("should return the array unchanged if the tile is not present", () => {
    expect(removeOne(["1d", "2d", "3d"], "4d")).toStrictEqual(["1d", "2d", "3d"]);
    expect(removeOne([], "1d")).toStrictEqual([]);
  });
});

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

describe("createDeck", () => {
  it("should contain exactly 144 tiles", () => {
    expect(createDeck()).toHaveLength(144);
  });

  it("should contain exactly 4 copies of each suit tile", () => {
    const deck = createDeck();
    for (const suit of ["d", "b", "c"]) {
      for (let v = 1; v <= 9; v++) {
        expect(deck.filter((t) => t === `${v}${suit}`)).toHaveLength(4);
      }
    }
  });

  it("should contain exactly 4 copies of each wind and dragon", () => {
    const deck = createDeck();
    for (const tile of ["ew", "sw", "ww", "nw", "rd", "gd", "wd"]) {
      expect(deck.filter((t) => t === tile)).toHaveLength(4);
    }
  });

  it("should contain exactly 1 copy of each flower and season tile", () => {
    const deck = createDeck();
    for (const tile of ["f1", "f2", "f3", "f4", "s1", "s2", "s3", "s4"]) {
      expect(deck.filter((t) => t === tile)).toHaveLength(1);
    }
  });
});

describe("shuffle", () => {
  it("should return an array with the same tiles in any order", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(deck.length);
    expect(shuffled.sort()).toStrictEqual(deck.sort());
  });
});
