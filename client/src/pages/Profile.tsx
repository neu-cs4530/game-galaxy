import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import useEditProfileForm from "../hooks/useEditProfileForm.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import AvatarDisplay from "../components/Avatar.tsx";
import { getUserById } from "../services/userService.ts";
import type { Avatar } from "@gamenite/shared";

export default function Profile() {
  const { user } = useLoginContext();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar] = useState<Avatar>(user.avatar);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const { display, setDisplay, password, setPassword, confirm, setConfirm, err, handleSubmit } =
    useEditProfileForm();

  useEffect(() => {
    getUserById(user.username)
      .then((u) => setAvatar(u.avatar))
      .catch((e) => setFetchErr(`${e}`));
  }, [user.username]);

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Profile</h2>
      {fetchErr && <p className="error-message">{fetchErr}</p>}
      <div>
        <AvatarDisplay avatar={avatar} size={200} />
      </div>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
        </ul>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Display name</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            className="widefill notTooWide"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault();
              setDisplay(user.display);
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Reset password</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault();
              setPassword("");
              setConfirm("");
            }}
          >
            Reset
          </button>
          <button
            className="secondary narrow"
            aria-label="Toggle show password"
            onClick={(e) => {
              e.preventDefault();
              setShowPass((v) => !v);
            }}
          >
            {showPass ? "Hide" : "Reveal"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <hr />
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Submit</button>
      </div>
      <div className="smallAndGray">After updating your profile, you will be logged out</div>
    </form>
  );
}
