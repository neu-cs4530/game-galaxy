import type { MahjongState, MahjongTile } from "@gamenite/shared/src/games/mahjong.types.ts";
import { isFlower } from "./mahjongTiles.ts";

/**
 * Draw a tile for a player from either the live wall or the dead wall.
 * If a flower tile is drawn, it is automatically added to the player's
 * flower collection and another tile is drawn from the dead wall in its
 * place (repeating until a non-flower tile is obtained).
 * @input state - current state
 * @input player - player index
 * @input fromDeadWall - whether to draw from dead wall
 * @returns updated state with the drawn tile in the player's hand
 */
export function drawForPlayer(
  state: MahjongState,
  player: number,
  fromDeadWall = false,
): MahjongState {
  const wall = [...state.wall];
  const hand = [...state.hands[player]];
  const flowers = state.flowers.map((f) => [...f]);

  // initial draw
  let drawn: MahjongTile | undefined = fromDeadWall ? wall.pop() : wall.shift();

  // keep replacing flowers from the dead wall
  while (drawn !== undefined && isFlower(drawn)) {
    flowers[player].push(drawn);
    drawn = wall.pop();
  }

  if (drawn !== undefined) hand.push(drawn);

  return {
    ...state,
    wall: wall,
    hands: state.hands.map((h, i) => (i === player ? hand : [...h])),
    flowers,
  };
}
