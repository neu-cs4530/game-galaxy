import useAuth from "../hooks/useAuth";
import useLoginContext from "../hooks/useLoginContext";

interface WearButtonProps {
  accessoryId: string;
  isWearing: boolean;
  onToggle: (accessoryId: string, isWearing: boolean) => void;
}

/**
 * button to allow user to wear/remove an accessory.
 * Toggles between the two depending on if the accessory is currently worn.
 */
export function WearButton({ accessoryId, isWearing, onToggle }: WearButtonProps) {
  const { socket } = useLoginContext();
  const auth = useAuth();

  const handleClick = () => {
    if (isWearing) {
      socket.emit("removeAccessory", { auth, payload: accessoryId });
    } else {
      socket.emit("wearAccessory", { auth, payload: accessoryId });
    }
    onToggle(accessoryId, !isWearing);
  };

  return (
    <button className="primary narrow" onClick={handleClick}>
      {isWearing ? "Take Off" : "Wear"}
    </button>
  );
}
