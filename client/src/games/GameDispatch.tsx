import type { SafeUserInfo, TaggedGameView } from "@gamegalaxy/shared";
import NimGame from "@gamegalaxy/client/src/games/NimGame.tsx";
import GuessGame from "@gamegalaxy/client/src/games/GuessGame.tsx";
import type { JSX } from "react";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth.ts";
import MahjongGame from "@gamegalaxy/client/src/games/MahjongGame.tsx";

interface GameDispatchProps {
  userPlayerIndex: number;
  players: SafeUserInfo[];
  gameId: string;
  view: TaggedGameView;
}

export default function GameDispatch({
  userPlayerIndex,
  gameId,
  players,
  view,
}: GameDispatchProps): JSX.Element {
  const { socket } = useLoginContext();
  const auth = useAuth();

  function makeMove(move: unknown) {
    socket.emit("gameMakeMove", { auth, payload: { gameId, move } });
  }

  const childProps = { userPlayerIndex, players, makeMove };
  switch (view.type) {
    case "nim":
      return <NimGame {...{ ...childProps, view: view.view }} />;
    case "guess":
      return <GuessGame {...{ ...childProps, view: view.view }} />;
    case "mahjong":
      return <MahjongGame {...{ ...childProps, view: view.view }} />;
  }
}
