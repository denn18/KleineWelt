import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

function transformDocument(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  return ret;
}

MessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

MessageSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
