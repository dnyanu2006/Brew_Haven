import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CouponModel } from '../models/Coupon.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function validateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { code, subtotalPaise } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Please enter a coupon code.' });
      return;
    }

    const orderSubtotal = parseInt(subtotalPaise, 10) || 0;
    const upperCode = code.trim().toUpperCase();

    let coupon: any = null;
    if (isMongoLive()) {
      coupon = await CouponModel.findOne({ code: upperCode, isActive: true });
    } else {
      coupon = memoryDb.coupons.find((c) => c.code === upperCode && c.isActive);
    }

    if (!coupon) {
      res.status(404).json({ error: 'Invalid or expired coupon code.' });
      return;
    }

    if (orderSubtotal < coupon.minOrderValuePaise) {
      const minInr = (coupon.minOrderValuePaise / 100).toFixed(0);
      res.status(400).json({
        error: `Coupon requires a minimum order value of ₹${minInr}.`,
      });
      return;
    }

    let discountPaise = 0;
    if (coupon.discountType === 'percentage') {
      const rawDiscount = Math.round((orderSubtotal * coupon.discountValue) / 100);
      discountPaise = coupon.maxDiscountPaise
        ? Math.min(rawDiscount, coupon.maxDiscountPaise)
        : rawDiscount;
    } else {
      discountPaise = Math.min(coupon.discountValue, orderSubtotal);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountPaise,
      description: coupon.description,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to validate coupon.' });
  }
}

export async function getCoupons(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const coupons = await CouponModel.find().sort({ createdAt: -1 });
      res.json(coupons);
      return;
    }
    res.json(memoryDb.coupons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve coupons.' });
  }
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    if (!data.code || !data.discountValue || !data.discountType) {
      res.status(400).json({ error: 'Code, discountType, and discountValue are required.' });
      return;
    }

    const upperCode = data.code.trim().toUpperCase();

    if (isMongoLive()) {
      const exists = await CouponModel.findOne({ code: upperCode });
      if (exists) {
        res.status(400).json({ error: 'Coupon code already exists.' });
        return;
      }

      const coupon = await CouponModel.create({
        ...data,
        code: upperCode,
        minOrderValuePaise: data.minOrderValuePaise || 0,
      });
      res.status(201).json(coupon);
      return;
    }

    const exists = memoryDb.coupons.some((c) => c.code === upperCode);
    if (exists) {
      res.status(400).json({ error: 'Coupon code already exists.' });
      return;
    }

    const coupon = {
      _id: 'coup_' + Date.now(),
      ...data,
      code: upperCode,
      minOrderValuePaise: data.minOrderValuePaise || 0,
      timesUsed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryDb.coupons.push(coupon);
    res.status(201).json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create coupon.' });
  }
}

export async function toggleCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (isMongoLive()) {
      const coupon = await CouponModel.findById(id);
      if (!coupon) {
        res.status(404).json({ error: 'Coupon not found.' });
        return;
      }
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      res.json(coupon);
      return;
    }

    const coupon = memoryDb.coupons.find((c) => c._id === id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    coupon.isActive = !coupon.isActive;
    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update coupon.' });
  }
}
