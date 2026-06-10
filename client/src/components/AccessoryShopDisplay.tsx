import type { Accessory } from "@gamenite/shared";
import { BuyButton } from "./BuyButton";
import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";

interface AccessoryDisplayProps {
  accessories: Accessory[];
  size: number;
}

/**
 * renders the list of accessories available for purchase
 */
export function AccessoryShopDisplay({ accessories = [], size = 100 }: AccessoryDisplayProps) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const ownedAccessories = user.avatar.accessories;

  const handleBuy = (accessoryId: string) => {
    socket.emit("shopBuyAccessory", { auth, payload: accessoryId });
  };

  const accessoryList = accessories.map((accessory) => (
    <li key={accessory.accessoryId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <img
        src={`/sprites/accessories/${accessory.accessoryId}.png`}
        style={{ width: size, height: size }}
      />
      <div>
        <p>
          <b>{accessory.name}</b>
        </p>
        <p>
          <b>Cost:</b>
          {accessory.cost}
        </p>
        <p>
          <BuyButton
            accessoryId={accessory.accessoryId}
            owned={accessory.accessoryId in ownedAccessories}
            onBuy={handleBuy}
          />
        </p>
      </div>
    </li>
  ));
  return <ul>{accessoryList}</ul>;
}
