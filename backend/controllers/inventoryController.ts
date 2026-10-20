import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { InventoryModel } from '../models/Inventory.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function getInventory(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const items = await InventoryModel.find().sort({ ingredientName: 1 });
      const enriched = items.map((item) => ({
        ...item.toObject(),
        isLowStock: item.currentStock <= item.minThreshold,
      }));
      res.json(enriched);
      return;
    }

    const items = memoryDb.inventory.map((item) => ({
      ...item,
      isLowStock: item.currentStock <= item.minThreshold,
    }));
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve inventory.' });
  }
}

export async function restockItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const addition = parseFloat(amount);
    if (isNaN(addition) || addition <= 0) {
      res.status(400).json({ error: 'Please enter a valid positive restock quantity.' });
      return;
    }

    if (isMongoLive()) {
      const item = await InventoryModel.findById(id);
      if (!item) {
        res.status(404).json({ error: 'Inventory item not found.' });
        return;
      }
      item.currentStock += addition;
      item.lastRestocked = new Date();
      await item.save();
      res.json(item);
      return;
    }

    const item = memoryDb.inventory.find((i) => i._id === id);
    if (!item) {
      res.status(404).json({ error: 'Inventory item not found.' });
      return;
    }
    item.currentStock += addition;
    item.lastRestocked = new Date();
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to restock inventory.' });
  }
}

export async function addInventoryItem(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    if (!data.ingredientName || data.currentStock === undefined || !data.unit) {
      res.status(400).json({ error: 'ingredientName, currentStock, and unit are required.' });
      return;
    }

    if (isMongoLive()) {
      const item = await InventoryModel.create(data);
      res.status(201).json(item);
      return;
    }

    const item = {
      _id: 'inv_' + Date.now(),
      ...data,
      lastRestocked: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryDb.inventory.push(item);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add inventory item.' });
  }
}
