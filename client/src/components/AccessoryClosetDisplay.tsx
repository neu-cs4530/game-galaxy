import useAccessory from "../hooks/useAccessory";
import { WearButton } from "./WearButton";

interface AccessoryDisplayProps {
  accessories: Record<string, boolean>;
  size: number;
  onToggle: (accessoryid: string, isWearing: boolean) => void;
}

/**
 * display all the accessories owned by this user.
 */
export function AccessoryClosetDisplay({
  accessories = {},
  size = 100,
  onToggle,
}: AccessoryDisplayProps) {
  const { accessories: catalog } = useAccessory();
  const accessoryList = Object.entries(accessories).map(([accessoryId, isWearing]) => {
    const catalogItem = catalog.find((a) => a.accessoryId === accessoryId);
    return (
      <li key={accessoryId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src={`/sprites/display/${accessoryId}-display.png`}
          style={{ width: size, height: size }}
        />
        <div>
          <p>
            <b>{catalogItem?.name ?? accessoryId}</b>
          </p>
          <WearButton accessoryId={accessoryId} isWearing={isWearing} onToggle={onToggle} />
        </div>
      </li>
    );
  });
  return <ul>{accessoryList}</ul>;
}
