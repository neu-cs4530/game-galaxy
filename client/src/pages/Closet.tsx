import { AccessoryClosetDisplay } from "../components/AccessoryClosetDisplay";
import useAccessory from "../hooks/useAccessory";
import useLoginContext from "../hooks/useLoginContext";

/**
 * renders the closet of the user, allows the user to take off/ add accessories.
 */
export default function Closet() {
  const { user } = useLoginContext();
  const { accessories } = useAccessory();
  const ownedAccessories = accessories.filter((a) => a.accessoryId in user.avatar.accessories);

  return <AccessoryClosetDisplay accessories={ownedAccessories} size={250} />;
}
