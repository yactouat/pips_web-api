import cors from "cors";
import express from "express";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";

import blogPostsRouter from "./routers/blog-posts-router";
import imagesRouter from "./routers/images-router";
import tokensRouter from "./routers/tokens-router";
import usersRouter from "./routers/users-router";
import { SERVICE_NAME } from "./constants";

// ! you need to have your env correctly set up if you wish to run this API locally (see `.env.example`)
if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

const API = express();
API.use(cors());
API.use(express.json({ limit: "20mb" })); // so we can post images as base64 strings

// base route
API.get("/", async (req, res) => {
  let dbIsUp = true;
  try {
    await runPgQuery("SELECT $1::text as message", ["DB IS UP"]);
  } catch (error) {
    dbIsUp = false;
    logStructuredMess(
      "CRITICAL",
      "DB IS DOWN",
      getParsableReqBody(req.body),
      SERVICE_NAME
    );
  }
  sendJsonResponse(
    res,
    200,
    dbIsUp
      ? "api.yactouat.com is available"
      : "api.yactouat.com is partly available",
    {
      services: [
        {
          service: "database",
          status: dbIsUp ? "up" : "down",
        },
      ],
    }
  );
});

API.use("/blog-posts", blogPostsRouter);
API.use("/images", imagesRouter);
API.use("/tokens", tokensRouter);
API.use("/users", usersRouter);

const server = API.listen(8080, () => {
  logStructuredMess(
    "INFO",
    "SERVER STARTED",
    JSON.stringify({
      port: 8080,
    }),
    SERVICE_NAME
  );
});
