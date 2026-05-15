import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import uploadConfig from "../config/upload";

import * as HelpController from "../controllers/HelpController";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/helps/list", isAuth, HelpController.findList);

routes.get("/helps", isAuth, HelpController.index);

routes.get("/helps/:id", isAuth, HelpController.show);

routes.post("/helps", isAuth, isSuper, HelpController.store);

routes.post(
  "/helps/thumbnail-upload",
  isAuth,
  isSuper,
  upload.array("file"),
  HelpController.thumbnailUpload
);

routes.put("/helps/:id", isAuth, isSuper, HelpController.update);

routes.delete("/helps/:id", isAuth, isSuper, HelpController.remove);

export default routes;
