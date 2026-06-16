import type { Accessory } from "@gamegalaxy/shared";
import { BuyButton } from "@gamegalaxy/client/src/components/BuyButton";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext";
import { useEffect, useState } from "react";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth";

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
  const [ownedAccessories, setOwnedAccessories] = useState(user.avatar.accessories);
  const [balance, setBalance] = useState(user.balance);

  useEffect(() => {
    const handleBalanceUpdated = ({ balance }: { balance: number }) => {
      setBalance(balance);
    };
    socket.on("balanceUpdated", handleBalanceUpdated);
    return () => {
      socket.off("balanceUpdated", handleBalanceUpdated);
    };
  }, [socket]);

  const handleBuy = (accessoryId: string) => {
    socket.emit("shopBuyAccessory", { auth, payload: accessoryId });
    setOwnedAccessories((prev) => ({ ...prev, [accessoryId]: false }));
  };

  const accessoryList = accessories.map((accessory) => (
    <li key={accessory.accessoryId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <img
        src={`/sprites/display/${accessory.accessoryId}-display.png`}
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
            cost={accessory.cost}
            balance={balance}
          />
        </p>
      </div>
    </li>
  ));
  return <ul>{accessoryList}</ul>;
}
