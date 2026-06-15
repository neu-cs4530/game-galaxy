import { useState, useEffect } from "react";
import { AccessoryClosetDisplay } from "../components/AccessoryClosetDisplay";
import AvatarDisplay from "../components/Avatar";
import useLoginContext from "../hooks/useLoginContext";
import { getUserById } from "../services/userService.ts";
import type { Avatar } from "@gamenite/shared";
import { ColorPicker } from "../components/ColorPicker.tsx";
import useRoomPresence from "../hooks/useRoomPresence.ts";

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
