
import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { ReservationModel } from '../models/Reservation.ts';
import { TableModel } from '../models/Table.ts';
import { memoryDb } from '../services/dbStore.ts';
import { sendReservationConfirmationEmail } from '../services/emailService.ts';
const isMongoLive = () => mongoose.connection.readyState === 1;

export async function getTables(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const tables = await TableModel.find().sort({ tableNumber: 1 });
      res.json(tables);
      return;
    }
    res.json(memoryDb.tables);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve tables.' });
  }
}

export async function checkAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, timeSlot, guestCount } = req.query;

    if (!date || !timeSlot) {
      res.status(400).json({ error: 'Date and timeSlot are required.' });
      return;
    }

    const minGuests = guestCount ? parseInt(guestCount as string, 10) : 1;

    if (isMongoLive()) {
      // Find active reservations for this date and time slot
      const existingReservations = await ReservationModel.find({
        date: date as string,
        timeSlot: timeSlot as string,
        status: { $in: ['confirmed', 'seated'] },
      });

      const bookedTableIds = existingReservations
        .map((r) => r.table?.toString())
        .filter(Boolean);

      const availableTables = await TableModel.find({
        isAvailable: true,
        capacity: { $gte: minGuests },
        _id: { $nin: bookedTableIds },
      }).sort({ capacity: 1 });

      res.json({
        available: availableTables.length > 0,
        availableTables,
        bookedCount: bookedTableIds.length,
      });
      return;
    }

    // Memory Store
    const bookedTableNumbers = memoryDb.reservations
      .filter(
        (r) =>
          r.date === date &&
          r.timeSlot === timeSlot &&
          (r.status === 'confirmed' || r.status === 'seated')
      )
      .map((r) => r.tableNumber);

    const availableTables = memoryDb.tables.filter(
      (t) =>
        t.isAvailable &&
        t.capacity >= minGuests &&
        !bookedTableNumbers.includes(t.tableNumber)
    );

    res.json({
      available: availableTables.length > 0,
      availableTables,
      bookedCount: bookedTableNumbers.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check availability.' });
  }
}

export async function createReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      date,
      timeSlot,
      guestCount,
      seatingArea,
      tableNumber,
      specialRequests,
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !date || !timeSlot) {
      res.status(400).json({ error: 'All reservation details (name, email, phone, date, time slot) are required.' });
      return;
    }

    const guests = Math.max(1, parseInt(guestCount, 10) || 2);
    const reservationCode = `BH-RES-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Reservations require an active connection to MongoDB Atlas.',
        database: 'brewhaven',
      });
      return;
    }

    // Verify table is not already booked
    let assignedTable: any = null;
    if (tableNumber) {
      assignedTable = await TableModel.findOne({ tableNumber });
    }

    const conflict = await ReservationModel.findOne({
      date,
      timeSlot,
      status: { $in: ['confirmed', 'seated'] },
      ...(assignedTable ? { table: assignedTable._id } : {}),
    });

    if (conflict && assignedTable) {
      res.status(400).json({
        error: `Table ${assignedTable.tableNumber} is already booked for ${date} at ${timeSlot}. Please choose another table or time.`,
      });
      return;
    }

    if (!assignedTable) {
      // Auto-assign suitable table
      const booked = await ReservationModel.find({
        date,
        timeSlot,
        status: { $in: ['confirmed', 'seated'] },
      });
      const bookedIds = booked.map((b) => b.table?.toString());
      assignedTable = await TableModel.findOne({
        capacity: { $gte: guests },
        isAvailable: true,
        _id: { $nin: bookedIds },
      });
    }

    const reservation = await ReservationModel.create({
      reservationCode,
      user: req.user ? req.user.id : undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      date,
      timeSlot,
      guestCount: guests,
      table: assignedTable?._id,
      tableNumber: assignedTable ? assignedTable.tableNumber : tableNumber || 'T-01',
      seatingArea: seatingArea || 'indoor',
      specialRequests: specialRequests?.trim(),
      status: 'confirmed',
    });

    try {
      await sendReservationConfirmationEmail({
        reservationCode: reservation.reservationCode,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
        date: String(reservation.date),
        timeSlot: reservation.timeSlot,
        guestCount: reservation.guestCount,
        tableNumber: String(reservation.tableNumber),
        seatingArea: reservation.seatingArea,
        specialRequests: reservation.specialRequests,
      });

      console.log(
        `Reservation confirmation email sent to ${reservation.customerEmail}`
      );
    } catch (emailError: any) {
      console.error(
        'Reservation confirmation email failed:',
        emailError?.message || emailError
      );
    }

    res.status(201).json({
      message: 'Table reservation confirmed and persisted to MongoDB Atlas!',
      reservation,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create reservation in database.' });
  }
}

export async function getUserReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (!isMongoLive()) {
    res.status(503).json({
      error: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.',
      database: 'brewhaven',
    });
    return;
  }

  try {
    const reservations = await ReservationModel.find({
      $or: [{ user: req.user.id }, { customerEmail: req.user.email }],
    }).sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve reservations from database.' });
  }
}

export async function cancelReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { idOrCode } = req.params;

    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.',
        database: 'brewhaven',
      });
      return;
    }

    const reservation = await ReservationModel.findOne({
      $or: [{ _id: mongoose.isValidObjectId(idOrCode) ? idOrCode : null }, { reservationCode: idOrCode }],
    });
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found in MongoDB.' });
      return;
    }
    reservation.status = 'cancelled';
    await reservation.save();
    res.json({ message: 'Reservation cancelled successfully in MongoDB.', reservation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel reservation in database.' });
  }
}
