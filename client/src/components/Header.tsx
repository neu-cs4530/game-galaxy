import { useState, useEffect } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { useLocation, useNavigate } from "react-router-dom";
import { LobbyButton } from "./LobbyButton.tsx";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { socket, user, reset } = useLoginContext();
  const [coins, setCoins] = useState(user.balance);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    socket.on("balanceUpdated", ({ balance }) => {
      setCoins(balance);
    });
    return () => {
      socket.off("balanceUpdated");
    };
  }, [socket]);

  return (
    <div id="header" className="header">
      <div className="title">GameNite!</div>
      <div>Coins: {coins}</div>
      <div>User: {user.display}</div>
      <button
        className="narrowcenter secondary"
        onClick={async () => {
          reset();
          await navigate("/login");
        }}
      >
        Log Out
      </button>
      {location.pathname !== "/" && <LobbyButton />}
    </div>
  );
}
