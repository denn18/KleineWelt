import { listConversationsForUser, listMessages, sendMessage } from '../services/messagesService.js';

export async function getMessageOverview(req, res) {
  const { participantId } = req.query;

  if (!participantId) {
    return res.status(400).json({ message: 'participantId ist erforderlich.' });
  }

  try {
    const conversations = await listConversationsForUser(participantId);
    res.json(conversations);
  } catch (error) {
    console.error('Failed to load message overview', error);
    res.status(500).json({ message: 'Konnte Nachrichtenübersicht nicht laden.' });
  }
}

export async function getMessages(req, res) {
  try {
    const messages = await listMessages(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Failed to load messages', error);
    res.status(500).json({ message: 'Konnte Nachrichten nicht laden.' });
  }
}

export async function postMessage(req, res) {
  try {
    const message = await sendMessage({
      conversationId: req.params.conversationId,
      senderId: req.body.senderId,
      recipientId: req.body.recipientId,
      body: req.body.body,
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Failed to send message', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Nachricht nicht senden.' });
  }
}
