import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation {
  _id: string;
  reservationCode: string;
  user?: any;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "11:00 AM"
  guestCount: number;
  table?: any;
  tableNumber?: string;
  seatingArea: 'indoor' | 'patio' | 'window' | 'bar';
  specialRequests?: string;
  status: 'confirmed' | 'cancelled' | 'seated' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    reservationCode: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.Mixed, ref: 'User', index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true, index: true },
    guestCount: { type: Number, required: true, min: 1, max: 20 },
    table: { type: Schema.Types.Mixed, ref: 'Table' },
    tableNumber: { type: String },
    seatingArea: {
      type: String,
      enum: ['indoor', 'patio', 'window', 'bar'],
      default: 'indoor',
    },
    specialRequests: { type: String },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'seated', 'completed'],
      default: 'confirmed',
      index: true,
    },
  },
  { timestamps: true }
);

export const ReservationModel = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
