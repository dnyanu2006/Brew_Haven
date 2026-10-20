import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderModel } from '../models/Order.ts';
import { ReservationModel } from '../models/Reservation.ts';
import { InventoryModel } from '../models/Inventory.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { UserModel } from '../models/User.ts';
import { memoryDb, seedMongoIfEmpty } from '../services/dbStore.ts';
import { connectDB, dbStatus } from '../config/db.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const orders = await OrderModel.find();
      const reservations = await ReservationModel.find({ status: { $in: ['confirmed', 'seated'] } });
      const inventory = await InventoryModel.find();
      const menuItems = await MenuItemModel.find();
      const users = await UserModel.find({ role: 'customer' });

      const totalRevenuePaise = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalPaise || 0), 0);

      const todayOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      });

      const todayRevenuePaise = todayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalPaise || 0), 0);

      const lowStockItems = inventory.filter((i) => i.currentStock <= i.minThreshold);

      // Order type distribution
      const orderTypeCounts = {
        'dine-in': orders.filter((o) => o.orderType === 'dine-in').length,
        takeaway: orders.filter((o) => o.orderType === 'takeaway').length,
        delivery: orders.filter((o) => o.orderType === 'delivery').length,
      };

      // Item sales aggregator
      const itemSalesMap: Record<string, { name: string; count: number; revenuePaise: number }> = {};
      for (const ord of orders) {
        if (ord.status === 'cancelled') continue;
        for (const itm of ord.items) {
          const key = itm.name;
          if (!itemSalesMap[key]) {
            itemSalesMap[key] = { name: itm.name, count: 0, revenuePaise: 0 };
          }
          itemSalesMap[key].count += itm.quantity;
          itemSalesMap[key].revenuePaise += itm.subtotalPaise;
        }
      }

      const topSellingItems = Object.values(itemSalesMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        totalRevenuePaise,
        totalOrdersCount: orders.length,
        todayOrdersCount: todayOrders.length,
        todayRevenuePaise,
        activeReservationsCount: reservations.length,
        lowStockCount: lowStockItems.length,
        totalCustomers: users.length,
        totalMenuItems: menuItems.length,
        orderTypeCounts,
        topSellingItems,
        dbStatus: {
          ...dbStatus,
          connected: true,
          liveModelCount: {
            orders: orders.length,
            menuItems: menuItems.length,
            reservations: reservations.length,
            inventory: inventory.length,
          },
        },
      });
      return;
    }

    // Memory Store stats
    const orders = memoryDb.orders;
    const reservations = memoryDb.reservations.filter((r) => r.status === 'confirmed' || r.status === 'seated');
    const inventory = memoryDb.inventory;
    const menuItems = memoryDb.menuItems;
    const customers = memoryDb.users.filter((u) => u.role === 'customer');

    const totalRevenuePaise = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalPaise || 0), 0);

    const todayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    const todayRevenuePaise = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalPaise || 0), 0);

    const lowStockItems = inventory.filter((i) => i.currentStock <= i.minThreshold);

    const orderTypeCounts = {
      'dine-in': orders.filter((o) => o.orderType === 'dine-in').length,
      takeaway: orders.filter((o) => o.orderType === 'takeaway').length,
      delivery: orders.filter((o) => o.orderType === 'delivery').length,
    };

    const itemSalesMap: Record<string, { name: string; count: number; revenuePaise: number }> = {};
    for (const ord of orders) {
      if (ord.status === 'cancelled') continue;
      for (const itm of ord.items) {
        const key = itm.name;
        if (!itemSalesMap[key]) {
          itemSalesMap[key] = { name: itm.name, count: 0, revenuePaise: 0 };
        }
        itemSalesMap[key].count += itm.quantity;
        itemSalesMap[key].revenuePaise += itm.subtotalPaise;
      }
    }

    const topSellingItems = Object.values(itemSalesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totalRevenuePaise,
      totalOrdersCount: orders.length,
      todayOrdersCount: todayOrders.length,
      todayRevenuePaise,
      activeReservationsCount: reservations.length,
      lowStockCount: lowStockItems.length,
      totalCustomers: customers.length,
      totalMenuItems: menuItems.length,
      orderTypeCounts,
      topSellingItems,
      dbStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate dashboard analytics.' });
  }
}

export async function getAllOrders(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.json(orders);
      return;
    }
    const orders = [...memoryDb.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
}

export async function getAllReservations(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const reservations = await ReservationModel.find().sort({ createdAt: -1 });
      res.json(reservations);
      return;
    }
    res.json(memoryDb.reservations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve reservations.' });
  }
}

export async function updateReservationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'seated', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid reservation status.' });
      return;
    }

    if (isMongoLive()) {
      const r = await ReservationModel.findByIdAndUpdate(id, { status }, { new: true });
      if (!r) {
        res.status(404).json({ error: 'Reservation not found.' });
        return;
      }
      res.json(r);
      return;
    }

    const r = memoryDb.reservations.find((res) => res._id === id || res.reservationCode === id);
    if (!r) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }
    r.status = status;
    res.json(r);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
}

export async function getDbStatus(_req: Request, res: Response): Promise<void> {
  res.json({
    ...dbStatus,
    isMongooseConnected: mongoose.connection.readyState === 1,
  });
}

export async function connectMongoAtlas(req: Request, res: Response): Promise<void> {
  try {
    const { uri } = req.body;
    if (!uri) {
      res.status(400).json({ error: 'MongoDB URI is required.' });
      return;
    }

    const success = await connectDB(uri);
    if (success) {
      await seedMongoIfEmpty();
      res.json({ message: 'Connected to MongoDB Atlas successfully!', dbStatus });
    } else {
      res.status(400).json({ error: dbStatus.error || 'Failed to connect to MongoDB Atlas.', dbStatus });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error attempting MongoDB connection.' });
  }
}
