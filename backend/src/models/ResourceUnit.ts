import mongoose, { Document, Schema, Types } from 'mongoose';

export type ResourceUnitStatus = 'Active' | 'Disabled';

export interface IResourceUnit extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  spaceId: Types.ObjectId;
  label: string;
  status: ResourceUnitStatus;
  createdAt: Date;
  updatedAt: Date;
}

const resourceUnitSchema = new Schema<IResourceUnit>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  spaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Space',
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['Active', 'Disabled'],
    default: 'Active',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
resourceUnitSchema.index({ organizationId: 1, spaceId: 1, status: 1 });
resourceUnitSchema.index({ organizationId: 1, status: 1 });
resourceUnitSchema.index({ createdAt: -1 });

// Unique constraint: label must be unique per space
resourceUnitSchema.index({ organizationId: 1, spaceId: 1, label: 1 }, { unique: true });

export const ResourceUnit = mongoose.model<IResourceUnit>('ResourceUnit', resourceUnitSchema);