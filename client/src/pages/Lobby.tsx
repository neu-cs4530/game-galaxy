import GameTable from "../components/gameTable";
import LobbyDisplay from "../components/LobbyDisplay";
import RoomLink from "../components/RoomLink";
import useAuth from "../hooks/useAuth";

export default function Lobby() {
  const username = useAuth().username;
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <LobbyDisplay />
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
  );
}
