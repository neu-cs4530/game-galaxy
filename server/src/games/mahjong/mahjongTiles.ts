import { type MahjongTile } from "@gamenite/shared/src/games/mahjong.types.ts";

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const SUITS = ["d", "b", "c"] as const; // dots, bamboo, characters
const WINDS = ["ew", "sw", "ww", "nw"] as const;
const DRAGONS = ["rd", "gd", "wd"] as const;
const FLOWERS = ["f1", "f2", "f3", "f4", "s1", "s2", "s3", "s4"] as const;

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/**
 * Returns true when the tile is a numbered suit tile (dots, bamboo, or
 * characters). Honours and flowers return false.
 * @input tile - tile string
 * @returns boolean - true if the tile is a suit tile, false otherwise
 */
function isSuitTile(tile: MahjongTile): boolean {
  return (
    tile.length === 2 &&
    ((tile[1] === "d" && !isNaN(parseInt(tile[0]))) || tile[1] === "b" || tile[1] === "c") &&
    !isNaN(parseInt(tile[0]))
  );
}

/**
 * Return the suit character ('d', 'b', or 'c') of a suit tile, or null.
 * @input tile - tile string
 * @returns suit character or null
 */
export function getSuit(tile: MahjongTile): string | null {
  return isSuitTile(tile) ? tile[1] : null;
}

/**
 * Return the numeric face value (1–9) of a suit tile a flower/season tile (1-4), or null.
 * @input tile - tile string
 * @returns integer value or null
 */
export function getValue(tile: MahjongTile): number | null {
  if (isSuitTile(tile)) return parseInt(tile[0]);
  if (isFlower(tile)) return parseInt(tile[1]);
  return null;
}

/**
 * Return the next tile in sequence (same suit, value + 1), or null if
 * the tile is not a suit tile or is already a 9.
 * @input tile - tile string
 * @returns next tile string or null
 */
export function nextTile(tile: MahjongTile): MahjongTile | null {
  const suit = getSuit(tile);
  const value = getValue(tile);
  if (suit === null || value === null || value === 9) return null;
  return `${value + 1}${suit}`;
}

/**
 * Returns true if the tile is a flower or season bonus tile.
 * @input tile - tile string
 * @returns boolean
 */
export function isFlower(tile: MahjongTile): boolean {
  return (
    tile.length === 2 && (tile.startsWith("f") || (tile.startsWith("s") && !tile.endsWith("w")))
  );
}

export function isDragon(tile: MahjongTile): boolean {
  return tile === "rd" || tile === "gd" || tile === "wd";
}

export function isWind(tile: MahjongTile): boolean {
  return tile === "ew" || tile === "sw" || tile === "ww" || tile === "nw";
}

/**
 * Remove the first occurrence of a tile from an array.
 * Returns the array unchanged if the tile is not present.
 * @input arr - tile array
 * @input tile - tile to remove
 * @returns new array with one occurrence removed
 */
export function removeOne(arr: MahjongTile[], tile: MahjongTile): MahjongTile[] {
  const i = arr.indexOf(tile);
  return i < 0 ? arr : [...arr.slice(0, i), ...arr.slice(i + 1)];
}

export function sortBySuit(tiles: MahjongTile[]): MahjongTile[] {
  const suitTiles: MahjongTile[] = [];
  const otherTiles: MahjongTile[] = [];

  // divide into suit and non-suit tiles
  for (const tile of tiles) {
    if (isSuitTile(tile)) suitTiles.push(tile);
    else otherTiles.push(tile);
  }

  // sort suit tiles by suit then value
  suitTiles.sort((a, b) => {
    const suitA = getSuit(a)!;
    const suitB = getSuit(b)!;
    if (suitA !== suitB) return suitA.localeCompare(suitB);
    return getValue(a)! - getValue(b)!;
  });

  // sort non-suit tiles into winds and dragons, then concatenate everything
  const windTiles = otherTiles.filter(isWind).sort();
  const dragonTiles = otherTiles.filter(isDragon).sort();
  return [...suitTiles, ...windTiles, ...dragonTiles];
}

// ─────────────────────────────────────────────────
// Deck creation and shuffling
// ─────────────────────────────────────────────────

/**
 * Build a complete 144-tile Hong Kong Mahjong deck:
 * - 3 suits × 9 values × 4 copies = 108 suit tiles
 * - 4 winds × 4 copies            =  16 honour tiles
 * - 3 dragons × 4 copies          =  12 honour tiles
 * - 8 flower/season tiles × 1     =   8 bonus tiles
 * @input none
 * @returns unshuffled array of 144 tile strings
 */
export function createDeck(): MahjongTile[] {
  const tiles: MahjongTile[] = [];
  for (const suit of SUITS) {
    for (let v = 1; v <= 9; v++) {
      for (let i = 0; i < 4; i++) tiles.push(`${v}${suit}`);
    }
  }
  for (const wind of WINDS) {
    for (let i = 0; i < 4; i++) tiles.push(wind);
  }
  for (const dragon of DRAGONS) {
    for (let i = 0; i < 4; i++) tiles.push(dragon);
  }
  for (const flower of FLOWERS) {
    tiles.push(flower);
  }
  return tiles; // 144 tiles total
}

/**
 * Fisher-Yates shuffle.
 * @input arr - array of any type
 * @returns new shuffled copy
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
