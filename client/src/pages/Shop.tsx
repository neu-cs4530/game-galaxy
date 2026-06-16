import { AccessoryShopDisplay } from "@gamegalaxy/client/src/components/AccessoryShopDisplay";
import useAccessory from "@gamegalaxy/client/src/hooks/useAccessory";
import useRoomPresence from "@gamegalaxy/client/src/hooks/useRoomPresence";

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
