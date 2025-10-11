import { listMessages, sendMessage } from '../services/messagesService.js';

export function getMessages(req, res) {
  const messages = listMessages(req.params.conversationId);
  res.json(messages);
}

export function postMessage(req, res) {
  const message = sendMessage({
    conversationId: req.params.conversationId,
    senderId: req.body.senderId,
    body: req.body.body,
  });
  res.status(201).json(message);
}
