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
export default function AvatarDisplay({ avatar, size = 128 }: AvatarDisplayProps) {
  const equipped = avatar.accessories.filter((a) => a.isWearing);

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
      {equipped.map((a) => (
        <img
          key={a.accessoryId}
          src={`/sprites/accessories/${a.accessoryId}.png`}
          style={{ position: "absolute", width: size, height: size }}
        />
      ))}
    </div>
  );
}
