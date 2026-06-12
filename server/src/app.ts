/* eslint no-console: "off" */

import express, { Router } from "express";
import { Server } from "socket.io";
import { z } from "zod";
import * as http from "node:http";
import * as chat from "./controllers/chat.controller.ts";
import * as game from "./controllers/game.controller.ts";
import * as lobby from "./controllers/lobby.controller.ts";
import * as user from "./controllers/user.controller.ts";
import * as thread from "./controllers/thread.controller.ts";
import * as accessory from "./controllers/accessory.controller.ts";
import * as tag from "./controllers/tag.controller.ts";
import { type GameServer } from "./types.ts";
import { withAuth, zThreadEvent } from "@gamenite/shared";

export const app = express();
export const httpServer = http.createServer(app);
const io: GameServer = new Server(httpServer);

app.use(express.json());

app.use(
  "/api",
  Router()
    .use("/tag", express.Router().get("/list", tag.getList))
    .use(
      "/game",
      express
        .Router() //
        .post("/create", game.postCreate)
        .get("/list", game.getList)
        .get("/:id", game.getById),
    )
    .use(
      "/thread",
      express
        .Router() //
        .post("/create", thread.postCreate)
        .get("/list", thread.getList)
        .get("/:id", thread.getById)
        .post("/:id/comment", thread.postByIdComment)
        .post("/:id/comment/:commentId", thread.postByIdCommentEdit)
        .post("/:id/react", thread.postByIdReaction),
    )
    .use(
      "/user",
      Router() // Any concrete routes here should be disallowed as usernames
        .post("/list", user.postList)
        .post("/login", user.postLogin)
        .post("/signup", user.postSignup)
        .post("/:username", user.postByUsername)
        .get("/:username", user.getByUsername)
        .post("/:username/closet/wear", user.postWearAccessory)
        .post("/:username/closet/remove", user.postRemoveAccessory)
        .post("/:username/shop/buy", user.postBuyAccessory),
    )
    .use("/accessory", Router().get("/", accessory.getAccessories)),
);

io.on("connection", (socket) => {
  const socketId = socket.id;
  console.log(`CONN [${socketId}] connected`);

  socket.on("disconnect", () => {
    console.log(`CONN [${socketId}] disconnected`);
    lobby.handleDisconnect(io, socket);
  });

  socket.on("shopBuyAccessory", accessory.socketBuyAccessory(socket, io));
  socket.on("wearAccessory", accessory.socketWearAccessory(socket, io));
  socket.on("removeAccessory", accessory.socketRemoveAccessory(socket, io));

  socket.on("chatJoin", chat.socketJoin(socket, io));
  socket.on("chatLeave", chat.socketLeave(socket, io));
  socket.on("chatSendMessage", chat.socketSendMessage(socket, io));

  socket.on("lobbyJoin", lobby.socketJoin(socket, io));
  socket.on("lobbyLeave", lobby.socketLeave(socket, io));

  socket.on("gameJoinAsPlayer", game.socketJoinAsPlayer(socket, io));
  socket.on("gameMakeMove", game.socketMakeMove(socket, io));
  socket.on("gameStart", game.socketStart(socket, io));
  socket.on("gameWatch", game.socketWatch(socket, io));
  socket.on("threadInteraction", (body) => {
    const {
      payload: { threadId, eventType },
    } = withAuth(zThreadEvent).parse(body);
    io.emit("threadUpdate", { threadId, eventType });
  });

  socket.onAny((name, payload) => {
    const zPayload = z.object({ auth: z.object({ username: z.string() }), payload: z.any() });
    const checked = zPayload.safeParse(payload);

    if (checked.error) {
      console.log(`RECV error: ${checked.error.message}`);
    } else {
      console.log(
        `RECV [${socketId}] got ${name}${checked.data.auth.username} ${JSON.stringify(checked.data.payload)}`,
      );
    }
  });
  socket.onAnyOutgoing((name) => {
    console.log(`SEND [${socketId}] gets ${name}`);
  });
});
