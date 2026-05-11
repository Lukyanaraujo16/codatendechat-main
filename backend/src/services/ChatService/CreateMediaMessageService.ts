import path from "path";
import Chat from "../../models/Chat";
import ChatMessage from "../../models/ChatMessage";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";
import { assertChatAccessForUser } from "./ChatAccessHelper";

function guessMediaType(mimeType?: string | null): string {
  const mt = String(mimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return "image";
  if (mt.startsWith("video/")) return "video";
  if (mt.startsWith("audio/")) return "audio";
  return "document";
}

function sanitizeOriginalName(name: string): string {
  const base = path.basename(String(name || ""));
  return base.replace(/[^\w.\- ]+/g, "_").trim().slice(0, 160);
}

export default async function CreateMediaMessageService(options: {
  senderId: number;
  chatId: number;
  message?: string | null;
  companyId: number;
  mediaPath: string;
  mediaName: string;
  mimeType?: string | null;
  mediaSize?: number | null;
}) {
  const {
    senderId,
    chatId,
    message,
    companyId,
    mediaPath,
    mediaName,
    mimeType,
    mediaSize
  } = options;

  await assertChatAccessForUser({ chatId, userId: senderId, companyId });

  const newMessage = await ChatMessage.create({
    senderId,
    chatId,
    message: String(message || ""),
    mediaPath,
    mediaName: sanitizeOriginalName(mediaName),
    mimeType: mimeType ? String(mimeType) : null,
    mediaSize: mediaSize != null ? Number(mediaSize) : null,
    mediaType: guessMediaType(mimeType)
  } as any);

  await newMessage.reload({
    include: [
      { model: User, as: "sender", attributes: ["id", "name"] },
      {
        model: Chat,
        as: "chat",
        include: [{ model: ChatUser, as: "users" }]
      }
    ]
  });

  const sender = await User.findByPk(senderId);
  const last = newMessage.message?.trim()
    ? `${sender!.name}: ${newMessage.message}`
    : `${sender!.name}: [arquivo]`;
  await newMessage.chat.update({ lastMessage: last });

  const chatUsers = await ChatUser.findAll({ where: { chatId } });
  for (const chatUser of chatUsers) {
    if (chatUser.userId === senderId) {
      await chatUser.update({ unreads: 0 });
    } else {
      await chatUser.update({ unreads: chatUser.unreads + 1 });
    }
  }

  return newMessage;
}

