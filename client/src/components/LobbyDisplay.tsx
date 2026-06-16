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
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 100,
          pointerEvents: "none",
        }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "50%", left: "70%", width: "5%", height: "5%" }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "50%", left: "50%", width: "5%", height: "5%" }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "55%", left: "72%", width: "5%", height: "5%" }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "40%", left: "33%", width: "5%", height: "5%" }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "35%", left: "40%", width: "5%", height: "5%" }}
      />
      <img
        src="/sprites/lobby/Stool_frame1.png"
        style={{ position: "absolute", top: "39%", left: "46%", width: "5%", height: "5%" }}
      />
    </div>
  );
}
