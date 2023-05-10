import fs from "fs";
import { Request, Response } from "express";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";
import { Storage } from "@google-cloud/storage";
import {
  IMAGE_UPLOAD_FAILED,
  IMAGE_UPLOAD_SUCCESS,
  SERVICE_NAME,
} from "../constants";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";

export const getImagesNames = async (req: Request, res: Response) => {
  const storage = new Storage();
  const [gcpImages] = await storage
    .bucket(process.env.IMAGES_BUCKET as string)
    .getFiles();
  const gcpImagesNames: string[] = [];
  for (let i = 0; i < gcpImages.length; i++) {
    if (gcpImages[i].name.endsWith(".png"))
      gcpImagesNames.push(gcpImages[i].name.replace("blog/", ""));
  }
  sendJsonResponse(
    res,
    200,
    `${gcpImagesNames.length} PIPS images`,
    gcpImagesNames
  );
};

export const uploadImage = async (req: Request, res: Response) => {
  const storage = new Storage();
  const imageBuf = Buffer.from(req.body.base64Image, "base64");
  fs.writeFileSync(`tmp/${req.body.imageName}`, imageBuf);
  try {
    // send image to GCP bucket
    await storage
      .bucket(process.env.IMAGES_BUCKET as string)
      .upload(`tmp/${req.body.imageName}`, {
        destination: `${process.env.IMAGES_BUCKET_PREFIX}${req.body.imageName}`,
      });
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "unable to upload image to GCP bucket",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, IMAGE_UPLOAD_FAILED);
    return;
  }
  sendJsonResponse(res, 201, IMAGE_UPLOAD_SUCCESS);
};
