import GameTable from "../components/gameTable";
import LobbyDisplay from "../components/LobbyDisplay";
import RoomLink from "../components/RoomLink";
import useAuth from "../hooks/useAuth";
import ChatPanel from "../components/ChatPanel";
import AvatarDisplayLobby from "../components/AvatarLobby";
import useSocketsForLobbyPlayers from "../hooks/useSocketsForLobbyPlayers";

// Where each player's avatar is placed in the lobby, in join order. Add an
// entry here to make room for more simultaneous players.
const LOBBY_AVATAR_POSITIONS = [
  { top: "60%", left: "15%" },
  { top: "64%", left: "11%" },
  { top: "68%", left: "7%" },
  { top: "65%", left: "20%" },
  { top: "69%", left: "16%" },
  { top: "73%", left: "12%" },
];

export default function Lobby() {
  const username = useAuth().username;
  const { players } = useSocketsForLobbyPlayers("lobby");
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
      <div style={{ position: "relative", width: "60%" }}>
        <LobbyDisplay />
        {players.map((player, index) => {
          const position =
            LOBBY_AVATAR_POSITIONS[index] ??
            LOBBY_AVATAR_POSITIONS[LOBBY_AVATAR_POSITIONS.length - 1];
          return (
            <AvatarDisplayLobby
              key={`${player.username}-${index}`}
              avatar={player.avatar}
              top={position.top}
              left={position.left}
              size="30%"
            />
          );
        })}
        <RoomLink
          sprite="/sprites/lobby/Shop_frame1.png"
          route={`/profile/${username}`}
          top="18%"
          left="22%"
          width="10%"
          height="10%"
        />
        <RoomLink
          sprite="/sprites/lobby/Closet_frame1.png"
          route={`/profile/${username}`}
          top="14%"
          left="35%"
          width="8%"
          height="12"
        />
        <RoomLink
          sprite="/sprites/lobby/Forum_frame1.png"
          route="/forum"
          top="18%"
          left="53%"
          width="10%"
          height="13%"
        />
        <GameTable
          sprite="/sprites/lobby/Table1_frame1.png"
          top="31%"
          left="30.0%"
          width="25%"
          height="20%"
          tableId="table:nim"
        />
        <GameTable
          sprite="/sprites/lobby/Table1_frame1.png"
          top="45%"
          left="56%"
          width="25%"
          height="20%"
          tableId="table:guess"
        />
      </div>
      <div style={{ position: "relative", width: "40%" }}>
        <ChatPanel chatId="lobby"></ChatPanel>
      </div>
    </div>
  );
}
