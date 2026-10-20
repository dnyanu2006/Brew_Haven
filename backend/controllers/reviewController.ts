import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { ReviewModel } from '../models/Review.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function getItemReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { menuItemId } = req.params;

    if (isMongoLive()) {
      const reviews = await ReviewModel.find({
        menuItem: menuItemId,
        status: 'approved',
      }).sort({ createdAt: -1 });
      res.json(reviews);
      return;
    }

    const reviews = memoryDb.reviews
      .filter((r) => r.menuItem === menuItemId && r.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
}

export async function getAllReviews(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const reviews = await ReviewModel.find().sort({ createdAt: -1 });
      res.json(reviews);
      return;
    }
    res.json(memoryDb.reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve all reviews.' });
  }
}

export async function createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { menuItemId, rating, comment, userName } = req.body;

    if (!menuItemId || !rating || !comment) {
      res.status(400).json({ error: 'menuItemId, rating (1-5), and comment are required.' });
      return;
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));
    const reviewerName = userName?.trim() || req.user?.name || 'Coffee Enthusiast';

    let itemName = 'Artisanal Brew';
    if (isMongoLive()) {
      const item = await MenuItemModel.findById(menuItemId);
      if (item) itemName = item.name;

      const review = await ReviewModel.create({
        menuItem: menuItemId,
        menuItemName: itemName,
        user: req.user ? req.user.id : undefined,
        userName: reviewerName,
        rating: numericRating,
        comment: comment.trim(),
        verifiedPurchase: true,
        status: 'approved',
      });

      // Update item rating average
      const allApproved = await ReviewModel.find({ menuItem: menuItemId, status: 'approved' });
      const avg = allApproved.reduce((acc, r) => acc + r.rating, 0) / allApproved.length;
      if (item) {
        item.ratingAverage = Number(avg.toFixed(1));
        item.ratingCount = allApproved.length;
        await item.save();
      }

      res.status(201).json({ message: 'Review published successfully!', review });
      return;
    }

    // Memory Store
    const item = memoryDb.menuItems.find((i) => i._id === menuItemId);
    if (item) itemName = item.name;

    const review = {
      _id: 'rev_' + Date.now(),
      menuItem: menuItemId,
      menuItemName: itemName,
      user: req.user ? req.user.id : undefined,
      userName: reviewerName,
      rating: numericRating,
      comment: comment.trim(),
      verifiedPurchase: true,
      status: 'approved' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryDb.reviews.unshift(review);

    if (item) {
      const itemReviews = memoryDb.reviews.filter((r) => r.menuItem === menuItemId && r.status === 'approved');
      const sum = itemReviews.reduce((acc, r) => acc + r.rating, 0);
      item.ratingAverage = Number((sum / itemReviews.length).toFixed(1));
      item.ratingCount = itemReviews.length;
    }

    res.status(201).json({ message: 'Review published successfully!', review });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit review.' });
  }
}

export async function moderateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }

    if (isMongoLive()) {
      const review = await ReviewModel.findByIdAndUpdate(id, { status }, { new: true });
      if (!review) {
        res.status(404).json({ error: 'Review not found.' });
        return;
      }
      res.json(review);
      return;
    }

    const review = memoryDb.reviews.find((r) => r._id === id);
    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    review.status = status;
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to moderate review.' });
  }
}
