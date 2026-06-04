/**
 * renders the image to be used for the lobby page
 */
export default function LobbyDisplay() {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
      <img
        src="/sprites/lobby/floor.png"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <img
        src="/sprites/lobby/stairdoor.png"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
    </div>
  );
}
