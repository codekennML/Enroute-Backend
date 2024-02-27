import dotenv from "dotenv";
dotenv.config();
import closeWithGrace from "close-with-grace";
import { WebSocket, SHARED_COMPRESSOR } from "uWebsockets.js";

import { UserData, WSIncomingData } from "../types/types";
import { startDB } from "./config/connectDB";
import { v4 as uuidV4 } from "uuid";
import { app, port } from "./app";
import { handleArrayBuffer as handleBuffer } from "./utils/helpers/handleBuffer";
import { DOMAINURL } from "./config/enums";

// const urlParser = require("node:url")

const domain = DOMAINURL.BASEURL_USER as string;

interface UpgradeOptions {
  aborted: boolean;
}

const activeConnections: Record<string, WebSocket<UserData>> = {};

//Start the database and connect
// startDB();

//Initialize the pubsub mechanism for receiving data to this server
// const serverPubSubChannel = `channel:${
//   process.env.APP_SERVER_ADDRESS as string
// }`;

// keyDBLayer.subscribe(serverPubSubChannel);

// keyDBLayer.on("message", async (channel, message) => {
//   await CachePubSubMessageHandler.handlePubSubMessage(channel, message);
// });

//HTTP Routes are in the routes folder

//Inititalize app and routes
app
  .get("/healthCheck", (res, req) => {
    // console.log(req);

    res.end("All good");
  })
  .ws(`${domain}/initialize_trip`, {
    compression: SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 120,
    upgrade: async (res, req, context): Promise<void> => {
      console.log(
        "An http connection wants to become WebSocket, URL: " +
          req.getUrl() +
          "!"
      );

      const upgradeAborted: UpgradeOptions = { aborted: false };

      const url = req.getUrl();
      const secWebSocketKey = req.getHeader("sec-websocket-key");
      const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
      const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

      res.onAborted(() => {
        /* We can simply signal that we were aborted */
        upgradeAborted.aborted = true;
      });

      if (upgradeAborted.aborted) {
        console.log("Ouch! Client disconnected before we could upgrade it!");
        /* You must not upgrade now */
        return;
      }

      //Authenticate the user here

      //Get the userData from DB and populate the data

      const upgradeData: UserData = {
        name: "",
        avatar: "",
        id: "xa1234",
        sessionId: JSON.stringify(uuidV4()),
        url,
      };

      res.cork(async () => {
        res.upgrade(
          upgradeData,
          /* Use our copies here */
          secWebSocketKey,
          secWebSocketProtocol,
          secWebSocketExtensions,
          context
        );
      });
    },

    open: async (ws: WebSocket<UserData>): Promise<void> => {
      const data = ws.getUserData();

      activeConnections[data.id] = ws;

      console.log(activeConnections, data);

      ws.subscribe(`channel:${data.id}`);

      ws.send("Hi there");
    },

    message: async (ws, message): Promise<void> => {
      try {
        const data = handleBuffer(message);

        const parsedData: WSIncomingData = JSON.parse(data);

        const handleRequest = async (
          ws: WebSocket<UserData>,
          params: WSIncomingData
        ): Promise<void> => {
          switch (params.userType) {
            case "driver":
              //  response  = await handleDriverWSMessages(params)
              break;

            case "rider":
              // response = await handleRiderWSMessages(params);
              break;

            case "control":
              // response = await handleControlWSMessages(params);
              break;

            default:
              // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unused-vars
              const exhaustiveness: never = params.userType;
              throw new Error(`Something went wrong`);
          }
        };

        await handleRequest(ws, parsedData);
      } catch (error) {
        console.log(error);
      }
    },
  })

  .listen(port, (token): void => {
    if (token) {
      console.log("Hiiii", token);
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });

closeWithGrace({ delay: 500 }, async function ({ signal, err, manual }) {
  if (err) {
    console.error(signal, err, manual);
  }
  await app.close();
});
