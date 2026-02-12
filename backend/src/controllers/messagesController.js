import {
  deleteConversation,
  listConversationsForUser,
  listMessages,
  markConversationAsRead,
  sendMessage,
} from '../services/messagesService.js';

export async function getMessageOverview(req, res) {
  try {
    const conversations = await listConversationsForUser(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('Failed to load message overview', error);
    res.status(500).json({ message: 'Konnte Nachrichtenübersicht nicht laden.' });
  }
}

export async function getMessages(req, res) {
  try {
    const messages = await listMessages({ conversationId: req.params.conversationId, userId: req.user.id });
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
      senderId: req.user.id,
      recipientId: req.body.recipientId,
      body: req.body.body,
      attachments: req.body.attachments,
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Failed to send message', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Nachricht nicht senden.' });
  }
}

export async function markConversationRead(req, res) {
  try {
    const { conversationId } = req.params;
    const messages = await markConversationAsRead({ conversationId, userId: req.user.id });
    res.json(messages);
  } catch (error) {
    console.error('Failed to mark conversation as read', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Nachricht nicht als gelesen markieren.' });
  }
}

export async function deleteConversationById(req, res) {
  try {
    const { conversationId } = req.params;
    await deleteConversation({ conversationId, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete conversation', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Unterhaltung nicht löschen.' });
  }
}
