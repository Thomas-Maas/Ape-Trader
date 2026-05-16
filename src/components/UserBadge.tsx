"use client";

import type { AuthedUser } from "./AuthPanel";

type Props = {
  user: AuthedUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
};

export default function UserBadge({ user, onLoginClick, onLogout }: Props) {
  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Log in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm">
      <div className="leading-tight">
        <div className="font-semibold text-white">{user.username}</div>
        <div className="font-mono text-xs text-gray-400">
          Best: ${user.highscore.toFixed(2)}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
      >
        Logout
      </button>
    </div>
  );
}
