import mongoose from 'mongoose';

const CaregiverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    postalCode: { type: String, required: true, index: true },
    daycareName: { type: String },
    availableSpots: { type: Number, default: 0 },
    hasAvailability: { type: Boolean, default: false },
    bio: { type: String },
    location: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

function transformDocument(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  return ret;
}

CaregiverSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

CaregiverSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: transformDocument,
});

const Caregiver = mongoose.model('Caregiver', CaregiverSchema);

export default Caregiver;
