import { useState, useEffect } from "react";
import { AccessoryClosetDisplay } from "@gamegalaxy/client/src/components/AccessoryClosetDisplay.tsx";
import AvatarDisplay from "@gamegalaxy/client/src/components/Avatar.tsx";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import { getUserById } from "@gamegalaxy/client/src/services/userService.ts";
import type { Avatar } from "@gamegalaxy/shared";
import { ColorPicker } from "@gamegalaxy/client/src/components/ColorPicker.tsx";
import useRoomPresence from "@gamegalaxy/client/src/hooks/useRoomPresence.ts";

/**
 * render the accessories owned by this user, and allow them to wear/ remove accessories and change color.
 */
export default function Closet() {
  useRoomPresence("closet");
  const { user } = useLoginContext();
  const [accessories, setAccessories] = useState(user.avatar.accessories);
  const [avatar, setAvatar] = useState<Avatar>(user.avatar);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getUserById(user.username)
      .then((u) => {
        setAccessories(u.avatar.accessories);
        setAvatar(u.avatar);
      })
      .catch((e) => setErr(`${e}`));
  }, [user.username]);

  const handleToggle = (accessoryId: string, isWearing: boolean) => {
    setAccessories((prev) => ({ ...prev, [accessoryId]: isWearing }));
    setAvatar((prev) => ({
      ...prev,
      accessories: { ...prev.accessories, [accessoryId]: isWearing },
    }));
  };

  const handleColorChange = (color: string) => {
    setAvatar((prev) => ({ ...prev, color }));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "2rem" }}>
        {err && <p className="error-message">{err}</p>}
        <AvatarDisplay avatar={avatar} size={250} />
        <AccessoryClosetDisplay accessories={accessories} size={200} onToggle={handleToggle} />
      </div>
      <div>
        <ColorPicker onColorChange={handleColorChange} />
      </div>
    </div>
  );
}
