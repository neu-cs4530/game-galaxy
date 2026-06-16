import { AccessoryShopDisplay } from "../components/AccessoryShopDisplay";
import useAccessory from "../hooks/useAccessory";
import useRoomPresence from "../hooks/useRoomPresence";

/**
 * renders the shop with all accessories available for purchase.
 */
export default function Shop() {
  useRoomPresence("shop");
  const { accessories, err } = useAccessory();

  if (err) {
    return <div className="error-message">{err}</div>;
  }
  return <AccessoryShopDisplay accessories={accessories} size={250} />;
}
