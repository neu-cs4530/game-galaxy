import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { SafeUserInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { getUserById } from "../services/userService.ts";
import ProfileViewInfo from "../components/ProfileViewInfo.tsx";
import ProfileEditInfo from "../components/ProfileEditInfo.tsx";

export default function Profile() {
  const { user } = useLoginContext();
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState<SafeUserInfo | null>(null);

  useEffect(() => {
    if (username) void getUserById(username).then(setProfileUser);
  }, [username]);

  useEffect(() => {
    getUserById(user.username).catch((e) => setFetchErr(`${e}`));
  }, [user.username]);

  return (
    <div className="content spacedSection">
      <h2>Profile</h2>
      {fetchErr && <p className="error-message">{fetchErr}</p>}
      {profileUser ? (
        <>
          <ProfileViewInfo user={profileUser} />
          {profileUser.username === user.username && (
            <>
              <hr />
              <ProfileEditInfo user={user} />
            </>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
