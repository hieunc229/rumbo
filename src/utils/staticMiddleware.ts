import path from "path";
import fs from "fs";
import { NextFunction, Request, Response } from "express";

const exts =
  "ai,xlx,doc,docx,avi,csv,doc,docx,eot,gif,ico,icon,jpeg,jpg,json,mov,mp3,mp4,otf,pdf,png,svg,ttf,txt,wav,woff,wasm,woff2";

// Leave this files for hmr to generate
const prodExts = "css,js";

export function staticMiddleware(props: {
  location: string;
  extensions?: string;
}) {
  const { location, extensions = "" } = props;

  // const allowedExts = `${exts},${
  //   process.env.NODE_ENV === "production" ? `${prodExts},` : ""
  // }${extensions}`
  //   .split(",")
  //   .filter(Boolean);

  return function (req: Request, res: Response, next: NextFunction) {
    // const parts = req.path.split(".");
    // const ext = parts.pop();

    // rewrite index
    // if (req.path.match(/index.html$/)) {
    //   return res.sendFile(path.join(location, "index.html"));
    // }
    if (req.path.split("/").pop()) {
      const filePath = path.join(
        location,
        (req.params?.path as string) || req.path
      );
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    next();
  };
}