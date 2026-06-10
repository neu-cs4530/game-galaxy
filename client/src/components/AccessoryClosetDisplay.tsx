import type { Accessory } from "@gamenite/shared";

interface AccessoryDisplayProps {
  accessories: Accessory[];
  size: number;
}

/**
 * renders the list of accessories owned by the user.
 */
export function AccessoryClosetDisplay({ accessories = [], size = 100 }: AccessoryDisplayProps) {
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
      </div>
    </li>
  ));
  return <ul>{accessoryList}</ul>;
}
