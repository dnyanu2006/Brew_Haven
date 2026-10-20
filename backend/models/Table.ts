import mongoose, { Schema, Document } from 'mongoose';

export interface ITable {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: 'indoor' | 'patio' | 'window' | 'bar';
  isAvailable: boolean;
  status: 'available' | 'reserved' | 'occupied';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TableSchema = new Schema<ITable>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    tableNumber: { type: String, required: true, unique: true, index: true },
    capacity: { type: Number, required: true, min: 1 },
    location: {
      type: String,
      enum: ['indoor', 'patio', 'window', 'bar'],
      default: 'indoor',
    },
    isAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied'],
      default: 'available',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const TableModel = mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);
