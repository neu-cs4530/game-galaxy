import { useNavigate } from "react-router-dom";

interface RoomLinkProps {
  sprite: string;
  route: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

export default function RoomLink({ sprite, route, top, left, width, height }: RoomLinkProps) {
  const navigate = useNavigate();
  return (
    <img
      src={sprite}
      style={{ position: "absolute", top, left, width, height, cursor: "pointer" }}
      onClick={() => navigate(route)}
    />
  );
}
