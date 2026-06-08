import type { Avatar } from "@gamenite/shared";

interface AvatarDisplayProps {
  avatar: Avatar;
  size: number;
}

/**
 * returns a component to render the given avatar with the relevant accessories and color.
 * @param avatar - the avatar being rendered
 * @param size - the size in which it should be scaled.
 */
export default function AvatarDisplay({
  avatar = { color: "blue", accessories: { "face-01": true } },
  size = 128,
}: AvatarDisplayProps) {
  const equipped = Object.entries(avatar.accessories)
    .filter(([, isWearing]) => isWearing)
    .map(([accessoryId]) => accessoryId);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
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
