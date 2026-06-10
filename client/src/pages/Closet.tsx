import { useState, useEffect } from "react";
import { AccessoryClosetDisplay } from "../components/AccessoryClosetDisplay";
import AvatarDisplay from "../components/Avatar";
import useLoginContext from "../hooks/useLoginContext";
import { getUserById } from "../services/userService.ts";
import type { Avatar } from "@gamenite/shared";

/**
 * render the accessories owned by this user, and allow them to wear/ remove accessories.
 */
export default function Closet() {
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

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      {err && <p className="error-message">{err}</p>}
      <AvatarDisplay avatar={avatar} size={250} />
      <AccessoryClosetDisplay accessories={accessories} size={100} onToggle={handleToggle} />
    </div>
  );
}
