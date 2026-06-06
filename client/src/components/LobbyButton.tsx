import { useNavigate } from "react-router-dom";

/**
 * button which takes the user back to the lobby
 */
export function LobbyButton() {
  const navigate = useNavigate();
  return (
    <button className="primary narrow" onClick={() => void navigate("/")}>
      Lobby
    </button>
  );
}
