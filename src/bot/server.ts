import express from "express";
import { Page } from "playwright";
import { sendMessageInChat } from "../playwright/runBot";

export function createBotApiServer(page: Page, port = 3002) {
  const app = express();
  app.use(express.json());

  app.post("/send-message", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).send("Missing message");

    try {
      await sendMessageInChat(page, message);
      res.send("Message sent");
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).send("Failed to send message");
    }
  });

  app.listen(port, () => {
    console.log(`Bot API server listening on port ${port}`);
  });
}
