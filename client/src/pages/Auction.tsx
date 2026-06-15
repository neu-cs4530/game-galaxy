import { useEffect, useMemo, useState } from "react";
import type { AuctionListing } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import useAccessory from "../hooks/useAccessory.ts";
import useAuctions from "../hooks/useAuctions.ts";
import { getUserById } from "../services/userService.ts";

const ACCESSORY_SIZE = 160;

/**
 * Renders auction
 */
export default function Auction() {
  const { user } = useLoginContext();
  const { listings, err } = useAuctions();

  // Check which listings were made by the user and which were made by others
  // This code avoids having to make unique paths for all users
  const myListings = listings.filter((l) => l.seller.username === user.username);
  const otherListings = listings.filter((l) => l.seller.username !== user.username);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      <h1>Auction</h1>
      {err && <p className="error-message">{err}</p>}

      <div>
        <h2>Sell an item</h2>
        <SellForm myListings={myListings} />
      </div>

      <div>
        <h2>Your listings</h2>
        {myListings.length === 0 ? (
          <p>You have no items up for auction.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {myListings.map((listing) => (
              <MyListingCard key={listing.auctionId} listing={listing} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2>Items for sale</h2>
        {otherListings.length === 0 ? (
          <p>No items are currently up for auction.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {otherListings.map((listing) => (
              <ForSaleCard key={listing.auctionId} listing={listing} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Small sprite + name shown on each listing card */
function AccessoryThumbnail({ accessoryId, name }: { accessoryId: string; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <img
        src={`/sprites/display/${accessoryId}-display.png`}
        //TODO IN UI OVERHALL: make alternate, centered versions of the images to put here so that everything looks nicer
        style={{ width: ACCESSORY_SIZE, height: ACCESSORY_SIZE }}
      />
      <b>{name}</b>
    </div>
  );
}

/** Form for listing one of your owned accessories for auction */
function SellForm({ myListings }: { myListings: AuctionListing[] }) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const { accessories: catalog } = useAccessory();

  const [ownedIds, setOwnedIds] = useState<string[]>(() => Object.keys(user.avatar.accessories));

  useEffect(() => {
    getUserById(user.username)
      .then((u) => setOwnedIds(Object.keys(u.avatar.accessories)))
      .catch(() => {});
  }, [user.username]);

  const listedIds = useMemo(
    () => new Set(myListings.map((l) => l.accessory.accessoryId)),
    [myListings],
  );

  // Owned accessories the user isn't already auctioning
  const sellable = ownedIds.filter((id) => !listedIds.has(id));

  const [accessoryId, setAccessoryId] = useState("");
  const [startingPrice, setStartingPrice] = useState(0);

  const nameOf = (id: string) => catalog.find((a) => a.accessoryId === id)?.name ?? id;
  const costOf = (id: string) => catalog.find((a) => a.accessoryId === id)?.cost;

  const originalCost = costOf(accessoryId || sellable[0]);

  const handleSell = () => {
    const id = accessoryId || sellable[0];
    if (!id) return;
    socket.emit("auctionCreate", { auth, payload: { accessoryId: id, startingPrice } });
    setAccessoryId("");
    setStartingPrice(0);
  };

  if (sellable.length === 0) {
    return <p>You have no items available to auction.</p>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <select value={accessoryId || sellable[0]} onChange={(e) => setAccessoryId(e.target.value)}>
        {sellable.map((id) => (
          <option key={id} value={id}>
            {nameOf(id)}
          </option>
        ))}
      </select>
      <label>
        Starting price:{" "}
        <input
          type="number"
          min={0}
          max={originalCost !== undefined ? originalCost - 1 : undefined}
          value={startingPrice}
          onChange={(e) => {
            const value = Number(e.target.value);
            const upperBound = originalCost !== undefined ? originalCost - 1 : Infinity;
            setStartingPrice(Math.min(Math.max(value, 0), upperBound));
          }}
          style={{ width: "6rem" }}
        />
      </label>
      <button className="primary narrow" onClick={handleSell}>
        List for sale
      </button>
    </div>
  );
}

/** A listing owned by the current user, showing offers they can accept */
function MyListingCard({ listing }: { listing: AuctionListing }) {
  const { socket } = useLoginContext();
  const auth = useAuth();

  const handleAccept = (offerId: string) => {
    socket.emit("auctionAccept", { auth, payload: { auctionId: listing.auctionId, offerId } });
  };

  return (
    <li style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "1rem" }}>
      <AccessoryThumbnail
        accessoryId={listing.accessory.accessoryId}
        name={listing.accessory.name}
      />
      <p>Starting price: {listing.startingPrice} coins</p>
      {listing.offers.length === 0 ? (
        <p>No offers yet.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {listing.offers.map((offer) => (
            <li
              key={offer.offerId}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span>
                <b>{offer.bidder.display}</b> offers <b>{offer.price}</b> coins
                {offer.message ? ` - "${offer.message}"` : ""}
              </span>
              <button className="primary narrow" onClick={() => handleAccept(offer.offerId)}>
                Accept
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Another player's listing, with a form to make an offer */
function ForSaleCard({ listing }: { listing: AuctionListing }) {
  const { socket } = useLoginContext();
  const auth = useAuth();
  const [price, setPrice] = useState(listing.startingPrice);
  const [message, setMessage] = useState("");

  const handleOffer = () => {
    if (price <= 0) return;
    socket.emit("auctionOffer", {
      auth,
      payload: { auctionId: listing.auctionId, price, message: message || undefined },
    });
    setMessage("");
  };

  return (
    <li style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "1rem" }}>
      <AccessoryThumbnail
        accessoryId={listing.accessory.accessoryId}
        name={listing.accessory.name}
      />
      <p>
        Seller: {listing.seller.display} | Starting price: {listing.startingPrice} coins
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <label>
          Your offer:{" "}
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ width: "6rem" }}
          />
        </label>
        <input
          type="text"
          placeholder="Optional message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flex: 1, minWidth: "10rem" }}
        />
        <button className="primary narrow" onClick={handleOffer}>
          Make offer
        </button>
      </div>
    </li>
  );
}
