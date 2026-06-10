import { AccessoryShopDisplay } from "../components/AccessoryShopDisplay";
import useAccessory from "../hooks/useAccessory";

/**
 * renders the shop with all accessories available for purchase.
 */
export default function Shop() {
  const { accessories, err } = useAccessory();

  if (err) {
    return <div className="error-message">{err}</div>;
  }
  return <AccessoryShopDisplay accessories={accessories} size={250} />;
}
