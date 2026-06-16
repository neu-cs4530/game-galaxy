import type { SafeUserInfo } from "@gamenite/shared";
import useTimeSince from "../hooks/useTimeSince.ts";
import AvatarDisplay from "./Avatar.tsx";

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
