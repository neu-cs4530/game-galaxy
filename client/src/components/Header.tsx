import { useState, useEffect } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { useLocation, useNavigate } from "react-router-dom";
import { LobbyButton } from "./LobbyButton.tsx";
import { type ThreadEvent } from "@gamenite/shared";
import {
  Dropdown,
  DropdownButton,
  DropdownContent,
  DropdownItem,
  DropdownList,
} from "./Dropdown.tsx";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { socket, user, reset, subscribedThreads } = useLoginContext();
  const [coins, setCoins] = useState(user.balance);
  const navigate = useNavigate();
  const location = useLocation();
  const [recentNotifs, setRecentNotifs] = useState<ThreadEvent[]>([]);

  useEffect(() => {
    const handleThreadUpdate = ({ threadId, eventType }: ThreadEvent) => {
      if (subscribedThreads.includes(threadId)) {
        setRecentNotifs((prev) => {
          const updated = [...prev, { threadId, eventType }];
          return updated.length > 4 ? updated.slice(-3) : updated;
        });
      }
    };

    const handleBalanceUpdated = ({ balance }: { balance: number }) => {
      setCoins(balance);
    };

    socket.on("balanceUpdated", handleBalanceUpdated);
    socket.on("threadUpdate", handleThreadUpdate);
    return () => {
      socket.off("balanceUpdated", handleBalanceUpdated);
      socket.off("threadUpdate", handleThreadUpdate);
    };
  }, [socket, subscribedThreads]);

  return (
    <div id="header" className="header">
      <div className="title">GameNite!</div>
      <Dropdown>
        <DropdownButton>Recent Notifications</DropdownButton>
        <DropdownContent>
          <DropdownList>
            {recentNotifs.map(({ threadId, eventType }, idx) => (
              <DropdownItem key={idx} threadId={threadId} eventType={eventType}></DropdownItem>
            ))}
          </DropdownList>
        </DropdownContent>
      </Dropdown>
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
