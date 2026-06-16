import type { SafeUserInfo } from "@gamegalaxy/shared";
import useTimeSince from "@gamegalaxy/client/src/hooks/useTimeSince.ts";
import AvatarDisplay from "@gamegalaxy/client/src/components/Avatar.tsx";

export default function ViewInfo({ user }: { user: SafeUserInfo }) {
  const timeSince = useTimeSince();

  return (
    <div>
      <div>
        <AvatarDisplay avatar={user.avatar} size={200} />
      </div>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
          <li>Games won: {user.wins}</li>
          <li>Games lost: {user.losses}</li>
        </ul>
      </div>
      <hr />
    </div>
  );
}
