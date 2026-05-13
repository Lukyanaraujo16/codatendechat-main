import express from "express";
import isAuth from "../middleware/isAuth";
import requireAnyPlanFeature from "../middleware/requirePlanFeature";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";

const contactRoutes = express.Router();

contactRoutes.use(isAuth);
contactRoutes.use(requireAnyPlanFeature("attendance.inbox"));

contactRoutes.post("/contacts/import", ImportPhoneContactsController.store);

contactRoutes.get("/contacts", ContactController.index);

contactRoutes.get("/contacts/list", ContactController.list);

contactRoutes.get("/contacts/:contactId/summary", ContactController.summary);

contactRoutes.post("/contacts/:contactId/tags", ContactController.addTag);

contactRoutes.delete(
  "/contacts/:contactId/tags/:tagId",
  ContactController.removeTag
);

contactRoutes.get("/contacts/:contactId", ContactController.show);

contactRoutes.post("/contacts", ContactController.store);

contactRoutes.post("/contacts/upload", ContactController.storeUpload);

contactRoutes.put("/contacts/:contactId", ContactController.update);

contactRoutes.delete("/contacts/:contactId", ContactController.remove);

contactRoutes.put("/contacts/:contactId/chatbot", ContactController.updateChatbotForContact);

contactRoutes.put(
  "/contacts/:contactId/group-visibility",
  ContactController.updateGroupVisibilityForContact
);

contactRoutes.put("/contacts/toggleDisableBot/:contactId", ContactController.toggleDisableBot);

export default contactRoutes;
