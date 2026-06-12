import type { Avatar } from "@gamenite/shared";

interface AvatarLobbyDisplayProps {
  avatar: Avatar;
  top: string;
  left: string;
  size: string;
  onClick?: () => void;
}

/**
 * returns a component to render the given avatar in the lobby with the relevant accessories and color.
 * @param avatar - the avatar being rendered
 * @param top - how far should the avatar be from the top of the screen (measured in %)
 * @param left - how far should the avatar be from the left of the screen (measured in %)
 * @param size - the size in which the avatar should be scaled (measured in %)
 * @param onClick - what to do when the avatar is clicked
 */
export default function AvatarLobbyDisplay({
  avatar = { color: "blue", accessories: {} },
  top = "10%",
  left = "10%",
  size = "10%",
  onClick,
}: AvatarLobbyDisplayProps) {
  const equipped = Object.entries(avatar.accessories)
    .filter(([, isWearing]) => isWearing)
    .map(([accessoryId]) => accessoryId);
  return (
    <div
      onClick={onClick}
      style={{ position: "absolute", top, left, width: size, height: size, cursor: "pointer" }}
    >
      <img
        src={`/sprites/avatar/colors/${avatar.color}.png`}
        style={{ position: "absolute", width: size, height: size }}
      />
      <img
        src="/sprites/avatar/avatarOutline.png"
        style={{ position: "absolute", width: size, height: size }}
      />
      {equipped.map((accessoryId) => (
        <img
          key={accessoryId}
          src={`/sprites/accessories/${accessoryId}.png`}
          style={{ position: "absolute", width: size, height: size }}
        />
      ))}
    </div>
  );
}
