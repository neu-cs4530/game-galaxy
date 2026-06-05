import { useNavigate } from "react-router-dom";

interface RoomLinkProps {
  sprite: string;
  route: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

/**
 * links this component to a room in GameNite
 * @param sprite - the image to be rendered
 * @param route - the location to which the component should take the user.
 * @param top - the y coordinate of the top left of the sprite, as a % of the total img size
 * @param left - the x coordinate of the top left of the sprite, as a % of the total img size
 * @param width - the width of the sprite, as a % of the total img size
 * @param height - the height of the sprite, as a % of the total img size
 */
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
