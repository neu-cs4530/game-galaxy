import { useState, useEffect } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { useLocation, useNavigate } from "react-router-dom";
import { LobbyButton } from "./LobbyButton.tsx";
import {
  type AuctionAcceptNotification,
  type AuctionOfferNotification,
  type ThreadEvent,
} from "@gamenite/shared";
import {
  Dropdown,
  DropdownButton,
  DropdownContent,
  DropdownItem,
  DropdownLinkItem,
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
  const [auctionNotifs, setAuctionNotifs] = useState<string[]>([]);

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

    const pushAuctionNotif = (label: string) => {
      setAuctionNotifs((prev) => {
        const updated = [...prev, label];
        return updated.length > 4 ? updated.slice(-3) : updated;
      });
    };

    const handleOfferReceived = ({ seller, accessoryName }: AuctionOfferNotification) => {
      if (seller === user.username) {
        pushAuctionNotif(`New offer on your ${accessoryName}`);
      }
    };

    const handleOfferAccepted = ({
      winner,
      accessoryName,
      newBalance,
    }: AuctionAcceptNotification) => {
      if (winner === user.username) {
        pushAuctionNotif(`Your offer on ${accessoryName} was accepted!`);
        setCoins(newBalance);
      }
    };

    socket.on("balanceUpdated", handleBalanceUpdated);
    socket.on("threadUpdate", handleThreadUpdate);
    socket.on("auctionOfferReceived", handleOfferReceived);
    socket.on("auctionOfferAccepted", handleOfferAccepted);
    return () => {
      socket.off("balanceUpdated", handleBalanceUpdated);
      socket.off("threadUpdate", handleThreadUpdate);
      socket.off("auctionOfferReceived", handleOfferReceived);
      socket.off("auctionOfferAccepted", handleOfferAccepted);
    };
  }, [socket, subscribedThreads, user.username]);

  return (
    <div id="header" className="header">
      <div className="title">GameNite!</div>
      <button
        className="narrowcenter secondary"
        onClick={() => void navigate(`/profile/${user.username}`)}
      >
        Profile
      </button>
      {location.pathname !== "/" && <LobbyButton />}
      <Dropdown>
        <DropdownButton>Recent Notifications</DropdownButton>
        <DropdownContent>
          <DropdownList>
            {recentNotifs.map(({ threadId, eventType }, idx) => (
              <DropdownItem
                key={`thread-${idx}`}
                threadId={threadId}
                eventType={eventType}
              ></DropdownItem>
            ))}
            {auctionNotifs.map((label, idx) => (
              <DropdownLinkItem key={`auction-${idx}`} to="/auction" label={label} />
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
    </div>
  );
}
