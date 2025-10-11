import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    postalCode: { type: String, required: true },
    numberOfChildren: { type: Number, default: 1 },
    childrenAges: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

function transformDocument(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  return ret;
}

ParentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

ParentSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

const Parent = mongoose.model('Parent', ParentSchema);

export default Parent;
