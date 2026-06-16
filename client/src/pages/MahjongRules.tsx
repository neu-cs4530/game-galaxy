import { useNavigate } from "react-router-dom";

export default function MahjongRules() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <object
        data="/rules/MahjongRules.pdf"
        type="application/pdf"
        width="100%"
        height="100%"
        style={{
          maxWidth: "900px",
        }}
      >
        <p>
          <a href="/rules/MahjongRules.pdf" target="_blank" rel="noreferrer">
            Click here to download the Mahjong rules.
          </a>
        </p>
      </object>
      <button className="secondary narrow" onClick={() => navigate(-1)}>
        Back to game
      </button>
    </div>
  );
}
