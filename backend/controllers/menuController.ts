import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MenuItemModel } from '../models/MenuItem.ts';
import { CategoryModel } from '../models/Category.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    if (isMongoLive()) {
      const categories = await CategoryModel.find({ isActive: true }).sort({ displayOrder: 1 });
      res.json(categories);
      return;
    }
    const categories = memoryDb.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
}

export async function getMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, search, vegOnly, sort, availableOnly } = req.query;

    if (isMongoLive()) {
      const query: any = {};
      if (category && category !== 'all') {
        const foundCategory = await CategoryModel.findOne({ slug: category });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else if (mongoose.isValidObjectId(category)) {
          query.category = category;
        }
      }
      if (vegOnly === 'true') {
        query.isVeg = true;
      }
      if (availableOnly === 'true') {
        query.isAvailable = true;
      }
      if (search && typeof search === 'string') {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      let sortOption: any = { isBestseller: -1, ratingAverage: -1 };
      if (sort === 'price-asc') sortOption = { pricePaise: 1 };
      if (sort === 'price-desc') sortOption = { pricePaise: -1 };
      if (sort === 'rating') sortOption = { ratingAverage: -1 };
      if (sort === 'name') sortOption = { name: 1 };

      const items = await MenuItemModel.find(query).sort(sortOption);
      res.json(items);
      return;
    }

    // Memory Store filtering
    let items = [...memoryDb.menuItems];

    if (category && category !== 'all') {
      const catObj = memoryDb.categories.find((c) => c.slug === category || c._id === category);
      if (catObj) {
        items = items.filter((i) => i.category === catObj._id || i.category === catObj.name);
      }
    }

    if (vegOnly === 'true') {
      items = items.filter((i) => i.isVeg);
    }

    if (availableOnly === 'true') {
      items = items.filter((i) => i.isAvailable);
    }

    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term) ||
          (i.tags && i.tags.some((t: string) => t.toLowerCase().includes(term)))
      );
    }

    if (sort === 'price-asc') {
      items.sort((a, b) => a.pricePaise - b.pricePaise);
    } else if (sort === 'price-desc') {
      items.sort((a, b) => b.pricePaise - a.pricePaise);
    } else if (sort === 'rating') {
      items.sort((a, b) => b.ratingAverage - a.ratingAverage);
    } else if (sort === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      items.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve menu items.' });
  }
}

export async function getMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { idOrSlug } = req.params;

    if (isMongoLive()) {
      const item = await MenuItemModel.findOne({
        $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
      });
      if (!item) {
        res.status(404).json({ error: 'Menu item not found.' });
        return;
      }
      res.json(item);
      return;
    }

    const item = memoryDb.menuItems.find((i) => i._id === idOrSlug || i.slug === idOrSlug);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve item.' });
  }
}

export async function createMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    if (!data.name || !data.pricePaise) {
      res.status(400).json({ error: 'Name and pricePaise are required.' });
      return;
    }

    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (isMongoLive()) {
      const newItem = await MenuItemModel.create({
        ...data,
        slug,
      });
      res.status(201).json(newItem);
      return;
    }

    const newItem = {
      _id: 'item_' + Date.now(),
      ...data,
      slug,
      ratingAverage: 5.0,
      ratingCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryDb.menuItems.push(newItem);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create menu item.' });
  }
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMongoLive()) {
      const item = await MenuItemModel.findOneAndUpdate({ _id: id }, updates, { new: true });
      if (!item) {
        res.status(404).json({ error: 'Menu item not found.' });
        return;
      }
      res.json(item);
      return;
    }

    const index = memoryDb.menuItems.findIndex((i) => i._id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }

    memoryDb.menuItems[index] = {
      ...memoryDb.menuItems[index],
      ...updates,
      updatedAt: new Date(),
    };
    res.json(memoryDb.menuItems[index]);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update menu item.' });
  }
}

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (isMongoLive()) {
      const result = await MenuItemModel.findOneAndDelete({ _id: id });
      if (!result) {
        res.status(404).json({ error: 'Menu item not found.' });
        return;
      }
      res.json({ message: 'Menu item removed successfully.' });
      return;
    }

    const index = memoryDb.menuItems.findIndex((i) => i._id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }

    memoryDb.menuItems.splice(index, 1);
    res.json({ message: 'Menu item removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
}
