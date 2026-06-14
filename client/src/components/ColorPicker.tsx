import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";

const COLORS = ["blue", "pink", "orange", "green"];

interface ColorPickerProps {
  onColorChange: (color: string) => void;
}

/**
 * renders the different color options enabling the user to change the color of their avatar.
 */
export function ColorPicker({ onColorChange }: ColorPickerProps) {
  const { socket } = useLoginContext();
  const auth = useAuth();

  const handleClick = (color: string) => {
    socket.emit("changeColor", { auth, payload: color });
    onColorChange(color);
  };

  return (
    <div>
      <div> Choose a color! </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {COLORS.map((color) => (
          <div
            key={color}
            style={{ position: "relative", width: 80, height: 80, cursor: "pointer" }}
            onClick={() => handleClick(color)}
          >
            <img
              src={`/sprites/avatar/colors/${color}.png`}
              style={{ position: "absolute", width: 80, height: 80 }}
            />
            <img
              src="/sprites/avatar/avatarOutline.png"
              style={{ position: "absolute", width: 80, height: 80 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
