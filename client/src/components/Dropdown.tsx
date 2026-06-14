import { NavLink } from "react-router-dom";
import { useState, useContext, createContext } from "react";
import { type ReactionEmoji } from "@gamenite/shared";

/*** Dropdown code primarily from tutorial: https://www.codemzy.com/blog/reactjs-dropdown-component  */

/** Whether the dropdown menu is open and displaying contents */
const DropdownContext = createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

/** Outermost dropdown html element */
export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div style={{ position: "relative", display: "inline-block" }}>{children}</div>
    </DropdownContext.Provider>
  );
}

/** The button in the dropdown title that gets clicked and displays whether open or not */
export function DropdownButton({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useContext(DropdownContext);

  return (
    <button
      className="secondary narrow"
      onClick={() => setOpen(!open)}
      style={{ display: "flex", alignItems: "center", gap: "4px" }}
    >
      {children}
      <span style={{ fontSize: "0.7rem" }}>{open ? "▲" : "▼"}</span>
    </button>
  );
}

/** If open, displays contents styled */
export function DropdownContent({ children }: { children: React.ReactNode }) {
  const { open } = useContext(DropdownContext);

  return open ? (
    <div
      style={{
        position: "absolute",
        zIndex: 100,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: "220px",
        right: 0,
      }}
    >
      {children}
    </div>
  ) : null;
}
/** Sets up the list styling for individual items on open */
export function DropdownList({ children }: { children: React.ReactNode }) {
  const { setOpen } = useContext(DropdownContext);

  return (
    <ul onClick={() => setOpen(false)} style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {children}
    </ul>
  );
}

/** Each notification in the dropdown menu */
export function DropdownItem({
  threadId,
  threadName,
  displayName,
  eventType,
}: {
  threadId: string;
  threadName: string;
  displayName: string;
  eventType: "comment" | ReactionEmoji;
}) {
  return (
    <DropdownLinkItem
      to={`/forum/post/${threadId}`}
      label={eventType === "comment" ? "New comment on your post" : "New reaction on your post"}
    />
  );
}

/** Generic notification in the dropdown menu */
export function DropdownLinkItem({ to, label }: { to: string; label: string }) {
  return (
    <li style={{ borderBottom: "1px solid #eee" }}>
      <NavLink
        to={to}
        style={{ display: "block", padding: "10px 16px", textDecoration: "none", color: "inherit" }}
      >
        {eventType === "comment"
          ? displayName + " commented on " + threadName
          : displayName + " added a " + eventType + " to " + threadName}
        {label}
      </NavLink>
    </li>
  );
}
