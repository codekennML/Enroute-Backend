import "dotenv/config" 
import express, { Application } from "express";
import { startDB } from "../route/src/config/connectDB";
const app: Application = express();

import path from "node:path";
// import cookieParser from "cookie-parser";
import { logger, logEvents } from "./src/middlewares/errors/logger";

import errorHandler from "./src/middlewares/errors/errorHandler";
import cors from "cors";
import corsOptions from "./src/config/cors/corsOptions";
import mongoose from "mongoose";
import closeWithGrace from "close-with-grace";
import rideRouter from "./src/routes/ride"
import bodyParser from "body-parser";
import { serverAdapter } from "./src/services/bullmq/ui";
import AuthGuard from "./src/middlewares/auth/verifyTokens";

const PORT = process.env.PORT ?? 3500;

//Connect to MongoDB
startDB();

app.use(logger);

app.use(cors(corsOptions));
// app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(AuthGuard)
app.use("/ride", rideRouter)
app.use("/admin/queueviewer/ui", serverAdapter.getRouter());

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({
      message: "404 Not Found",
    });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logEvents(
    `${err.no} : ${err.code}\t${err.syscall}\t${err.hostname} `,
    "mongoErrLog.log"
  );
});

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

app.use(errorHandler);

closeWithGrace(
  {
    delay: 500,
    logger: {
      error: async (m) =>
        await logEvents(`[close-with-grace] ${m}`, "serverCloseLogs.log"),
    },
  },
  async function ({ signal, err, manual }) {
    if (err) {
      console.error(signal, err, manual);
    }
    await server.close();
  }
);
