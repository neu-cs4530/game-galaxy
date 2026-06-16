import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { SafeUserInfo } from "@gamegalaxy/shared";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import { getUserById } from "@gamegalaxy/client/src/services/userService.ts";
import ProfileViewInfo from "@gamegalaxy/client/src/components/ProfileViewInfo.tsx";
import ProfileEditInfo from "@gamegalaxy/client/src/components/ProfileEditInfo.tsx";

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
