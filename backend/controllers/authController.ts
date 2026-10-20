import { sendWelcomeEmail } from '../services/emailService.ts';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AuthenticatedRequest, generateToken } from '../middleware/auth.ts';
import { UserModel } from '../models/User.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    // Strict persistence check: never report fake success if MongoDB is disconnected
    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Customer registration requires an active connection to MongoDB Atlas.',
        database: 'brewhaven',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Persist real customer document into MongoDB Atlas
    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim(),
      role: 'customer',
      loyaltyPoints: 100, // 100 welcome points = ₹100
      favorites: [],
    });
    // Send welcome email
    try {
      await sendWelcomeEmail(newUser.email, newUser.name);
      console.log(`Welcome email sent to ${newUser.email}`);
    } catch (emailError: any) {
      console.error('Welcome email failed:', emailError?.message || emailError);
    }
    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully and saved to MongoDB Atlas! 100 welcome loyalty points awarded.',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        loyaltyPoints: newUser.loyaltyPoints,
        favorites: newUser.favorites,
      },
      token,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }
    console.error('Registration database write error:', err?.message || err);
    res.status(500).json({ error: 'Database write error while saving customer to MongoDB Atlas.' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Strict persistence check
    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Login requires an active connection to MongoDB Atlas.',
        database: 'brewhaven',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (req.body.staffOnly && user.role === 'customer') {
      res.status(403).json({ error: 'Access denied. This portal is strictly restricted to Brew Haven staff and administrators.' });
      return;
    }

    const token = generateToken({
      id: (user._id || user.id).toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Signed in successfully.',
      user: {
        id: (user._id || user.id).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints || 0,
        favorites: user.favorites || [],
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error during login.' });
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
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
    const user = await UserModel.findById(req.user.id).select('-passwordHash');

    if (!user) {
      res.status(404).json({ error: 'User profile not found in MongoDB.' });
      return;
    }

    res.json({
      user: {
        id: (user._id || user.id).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints || 0,
        addresses: user.addresses || [],
        favorites: user.favorites || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching user profile.' });
  }
}

export async function toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
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
    const { menuItemId } = req.body;
    if (!menuItemId) {
      res.status(400).json({ error: 'menuItemId is required.' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found in MongoDB.' });
      return;
    }
    const index = user.favorites.findIndex((f: any) => f.toString() === menuItemId);
    if (index >= 0) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(menuItemId);
    }
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update favorites in database.' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
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
    const { name, phone, address } = req.body;

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found in MongoDB.' });
      return;
    }
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address) {
      user.addresses = [
        {
          label: 'Primary',
          street: address.street || address,
          city: address.city || 'Bengaluru',
          postalCode: address.postalCode || '560001',
          isDefault: true,
        },
      ];
    }
    await user.save();
    res.json({ message: 'Profile updated successfully in MongoDB.', user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update profile in database.' });
  }
}
