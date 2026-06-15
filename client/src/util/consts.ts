import type { GameKey } from "@gamenite/shared";

export const gameNames: { [key in GameKey]: string } = {
  nim: "Nim",
  guess: "Number Guesser",
  mahjong4p: "Mahjong 4P",
  mahjong3p: "Mahjong 3P",
};
