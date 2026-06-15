/* eslint no-console: "off" */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.tsx";
import type { AuthContext } from "./contexts/LoginContext.ts";
import Layout from "./components/Layout.tsx";
//import Home from "./pages/Home.tsx";
import ThreadList from "./pages/ThreadList.tsx";
import Profile from "./pages/Profile.tsx";
import { io } from "socket.io-client";
import type { GameSocket } from "./util/types.ts";
import LoggedInRoute from "./components/LoggedInRoute.tsx";
import NewGame from "./pages/NewGame.tsx";
import Game from "./pages/Game.tsx";
import GameList from "./pages/GameList.tsx";
import ThreadPage from "./pages/ThreadPage.tsx";
import { ErrorBoundary } from "react-error-boundary";
import fallback from "./fallback.tsx";
import NewThread from "./pages/NewThread.tsx";
import TimeContextKeeper from "./components/UpdatingTimeContext.tsx";
import Lobby from "./pages/Lobby.tsx";
import { threadList } from "./services/threadService.ts";
import Shop from "./pages/Shop.tsx";
import Closet from "./pages/Closet.tsx";
import Auction from "./pages/Auction.tsx";
import MahjongRules from "./pages/MahjongRules.tsx";
import MahjongScoring from "./pages/MahjongScoring.tsx";

/** If `true`, all incoming socket messages will be logged */
const DEBUG_SOCKETS = false;

/**
 * Websocket connection for the app. It would be natural to define this in a
 * useEffect hook, but the React docts advise against this.
 * https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
 * */
let socket: GameSocket | null = null;
if (typeof window !== "undefined") {
  socket = io();
  if (DEBUG_SOCKETS) {
    socket.onAny((tag, payload) => {
      console.log(`from socket got ${tag}(${JSON.stringify(payload)})`);
    });
  }
}

function NoSuchRoute() {
  const { pathname } = useLocation();
  return `No page found for route '${pathname}'`;
}

export default function App() {
  const [auth, setAuth] = useState<AuthContext | null>(null);
  const [subscribedThreads, setSubscribedThreads] = useState<string[]>([]);

  //defines the addThreadSubscription behavior that gets passed into LoginContext
  function addThreadSubscription(threadId: string) {
    setSubscribedThreads((prev) => [...prev, threadId]);
  }

  //On login, updates a user's subscribed threads with ones they have made so they get notifs
  useEffect(() => {
    if (!auth) return;
    const loadSubscriptions = async () => {
      const threads = await threadList();
      threads
        .filter((t) => t.createdBy.username === auth.user.username)
        .forEach((t) => addThreadSubscription(t.threadId));
    };

    void loadSubscriptions().catch((err) => console.error("Failed to load subscriptions", err));
  }, [auth]);

  return (
    socket && (
      <BrowserRouter>
        <div className="stars"></div>
        <div className="twinkling"></div>
        <Routes>
          <Route path="/login" element={<Login setAuth={(auth) => setAuth(auth)} />} />
          <Route
            element={
              <LoggedInRoute
                auth={auth}
                socket={socket}
                subscribedThreads={subscribedThreads}
                addThreadSubscription={addThreadSubscription}
              >
                <TimeContextKeeper updateFrequency={20 * 1000}>
                  <ErrorBoundary fallbackRender={fallback}>
                    <Layout />
                  </ErrorBoundary>
                </TimeContextKeeper>
              </LoggedInRoute>
            }
          >
            <Route path="/" element={<Lobby />} />
            <Route path="/forum" element={<ThreadList />} />
            <Route path="/forum/post/new" element={<NewThread />} />
            <Route path="/forum/post/:threadId" element={<ThreadPage />} />
            <Route path="/games" element={<GameList />} />
            <Route path="/game/new" element={<NewGame />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/closet/:username" element={<Closet />} />
            <Route path="/auction" element={<Auction />} />
            <Route path="/mahjongRules" element={<MahjongRules />} />
            <Route path="/mahjongScoring" element={<MahjongScoring />} />
            <Route path="/*" element={<NoSuchRoute />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )
  );
}
