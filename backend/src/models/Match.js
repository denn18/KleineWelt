import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema(
  {
    parentId: { type: String, required: true, index: true },
    caregiverId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

function transformDocument(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  return ret;
}

MatchSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

MatchSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

const Match = mongoose.model('Match', MatchSchema);

export default Match;
