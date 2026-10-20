import { sendOrderConfirmationEmail } from '../services/emailService.ts';
import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { OrderModel } from '../models/Order.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { CouponModel } from '../models/Coupon.ts';
import { UserModel } from '../models/User.ts';
//import { sendWelcomeEmail } from '../services/emailService.ts';
import { InventoryModel } from '../models/Inventory.ts';
import { LoyaltyTransactionModel } from '../models/LoyaltyTransaction.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Authentication required. Please sign in to place an order.' });
      return;
    }

    // Strict persistence check: never report fake order placement if MongoDB is disconnected
    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Order creation requires an active connection to MongoDB Atlas.',
        database: 'brewhaven',
      });
      return;
    }

    const {
      customerDetails,
      orderType,
      tableNumber,
      items,
      couponCode,
      useLoyaltyPoints,
      paymentMethod,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.phone) {
      res.status(400).json({ error: 'Customer name and phone number are required.' });
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      res.status(400).json({ error: 'Please select a table number for dine-in orders.' });
      return;
    }

    if (orderType === 'delivery' && !customerDetails.address) {
      res.status(400).json({ error: 'Delivery address is required for delivery orders.' });
      return;
    }

    // 1. Calculate verified subtotal from database items
    let calculatedSubtotalPaise = 0;
    const verifiedItems: any[] = [];

    for (const clientItem of items) {
      const menuItem = await MenuItemModel.findOne({
        $or: [{ _id: clientItem.menuItemId }, { slug: clientItem.menuItemId }],
      });

      if (!menuItem) {
        res.status(400).json({ error: `Menu item not found: ${clientItem.name || 'Unknown'}` });
        return;
      }

      if (!menuItem.isAvailable) {
        res.status(400).json({ error: `Sorry, ${menuItem.name} is currently out of stock.` });
        return;
      }

      // Base price in paise
      let itemUnitPaise = menuItem.pricePaise;

      // Size delta
      if (clientItem.size && menuItem.customizationOptions?.sizes) {
        const foundSize = menuItem.customizationOptions.sizes.find(
          (s: any) => s.name.toLowerCase() === clientItem.size.toLowerCase()
        );
        if (foundSize) {
          itemUnitPaise += foundSize.priceDeltaPaise || 0;
        }
      }

      // Milk delta
      if (clientItem.milk && menuItem.customizationOptions?.milkOptions) {
        const foundMilk = menuItem.customizationOptions.milkOptions.find(
          (m: any) => m.name.toLowerCase() === clientItem.milk.toLowerCase()
        );
        if (foundMilk) {
          itemUnitPaise += foundMilk.priceDeltaPaise || 0;
        }
      }

      // Toppings delta
      if (clientItem.toppings && Array.isArray(clientItem.toppings) && menuItem.customizationOptions?.toppings) {
        for (const tName of clientItem.toppings) {
          const foundTop = menuItem.customizationOptions.toppings.find(
            (t: any) => t.name.toLowerCase() === tName.toLowerCase()
          );
          if (foundTop) itemUnitPaise += foundTop.priceDeltaPaise || 0;
        }
      }

      // Extras delta
      if (clientItem.extras && Array.isArray(clientItem.extras) && menuItem.customizationOptions?.extras) {
        for (const eName of clientItem.extras) {
          const foundExtra = menuItem.customizationOptions.extras.find(
            (e: any) => e.name.toLowerCase() === eName.toLowerCase()
          );
          if (foundExtra) itemUnitPaise += foundExtra.priceDeltaPaise || 0;
        }
      }

      const quantity = Math.max(1, parseInt(clientItem.quantity, 10) || 1);
      const lineTotalPaise = itemUnitPaise * quantity;
      calculatedSubtotalPaise += lineTotalPaise;

      verifiedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        image: menuItem.image,
        pricePaise: itemUnitPaise,
        quantity,
        size: clientItem.size,
        milk: clientItem.milk,
        sugar: clientItem.sugar,
        toppings: clientItem.toppings || [],
        extras: clientItem.extras || [],
        instructions: clientItem.instructions?.trim(),
        subtotalPaise: lineTotalPaise,
      });
    }

    // 2. Validate Coupon Discount on Server
    let discountPaise = 0;
    let appliedCoupon: any = null;

    if (couponCode && typeof couponCode === 'string') {
      const codeUpper = couponCode.trim().toUpperCase();
      appliedCoupon = await CouponModel.findOne({ code: codeUpper, isActive: true });

      if (appliedCoupon) {
        if (calculatedSubtotalPaise >= appliedCoupon.minOrderValuePaise) {
          if (appliedCoupon.discountType === 'percentage') {
            const rawDiscount = Math.round((calculatedSubtotalPaise * appliedCoupon.discountValue) / 100);
            discountPaise = appliedCoupon.maxDiscountPaise
              ? Math.min(rawDiscount, appliedCoupon.maxDiscountPaise)
              : rawDiscount;
          } else {
            discountPaise = Math.min(appliedCoupon.discountValue, calculatedSubtotalPaise);
          }

          // Increment coupon usage
          appliedCoupon.timesUsed = (appliedCoupon.timesUsed || 0) + 1;
          await appliedCoupon.save();
        }
      }
    }

    // 3. Loyalty points redemption
    let pointsUsed = 0;
    let loyaltyDiscountPaise = 0;

    if (useLoyaltyPoints && req.user) {
      const user = await UserModel.findById(req.user.id);

      if (user && user.loyaltyPoints > 0) {
        // 1 point = 1 INR = 100 paise
        const maxRedeemablePaise = Math.max(0, calculatedSubtotalPaise - discountPaise);
        const maxPointsCanUse = Math.floor(maxRedeemablePaise / 100);
        pointsUsed = Math.min(user.loyaltyPoints, maxPointsCanUse);
        loyaltyDiscountPaise = pointsUsed * 100;
        discountPaise += loyaltyDiscountPaise;
      }
    }

    // 4. Taxes & Delivery fees
    const taxPaise = Math.round((calculatedSubtotalPaise - discountPaise) * 0.05); // 5% GST on F&B
    const deliveryFeePaise = orderType === 'delivery' ? 4000 : 0; // ₹40 delivery fee
    const finalTotalPaise = Math.max(0, calculatedSubtotalPaise - discountPaise + taxPaise + deliveryFeePaise);

    // 5. Loyalty points earned (10% of subtotal as points for registered users)
    const pointsEarned = Math.floor(calculatedSubtotalPaise / 1000); // 1 point per ₹10 spent

    const orderNumber = `BH-${Date.now().toString().slice(-6)}`;

    const orderPayload = {
      orderNumber,
      user: req.user ? req.user.id : undefined,
      customerDetails: {
        name: customerDetails.name.trim(),
        phone: customerDetails.phone.trim(),
        email: customerDetails.email ? customerDetails.email.trim() : req.user?.email || 'guest@brewhaven.com',
        address: customerDetails.address?.trim(),
      },
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      items: verifiedItems,
      subtotalPaise: calculatedSubtotalPaise,
      taxPaise,
      deliveryFeePaise,
      discountPaise,
      totalPaise: finalTotalPaise,
      status: 'placed' as const,
      paymentMethod: paymentMethod || 'test_upi',
      paymentStatus: 'paid' as const,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      loyaltyPointsUsed: pointsUsed,
      loyaltyPointsEarned: pointsEarned,
      estimatedPrepMinutes: 12 + Math.min(15, verifiedItems.length * 2),
      statusHistory: [
        {
          status: 'placed' as const,
          note: 'Order confirmed...',
          timestamp: new Date(),
        },
      ],
    };

    // Persist real order document in MongoDB Atlas
    const createdOrder = await OrderModel.create(orderPayload);
    console.log('DEBUG: Order created successfully.');
console.log('DEBUG: Customer email:', createdOrder.customerDetails.email);
    // Send order confirmation email without interrupting order placement

    // Send order confirmation with actual order details
    try {
      const email = createdOrder.customerDetails.email;

      if (email && email !== 'guest@brewhaven.com') {
         console.log('DEBUG: Sending order confirmation email now.');
        await sendOrderConfirmationEmail({
          orderNumber: createdOrder.orderNumber,
          createdAt: createdOrder.createdAt,
          customerDetails: {
            name: createdOrder.customerDetails.name,
            email: createdOrder.customerDetails.email,
            phone: createdOrder.customerDetails.phone,
            address: createdOrder.customerDetails.address,
          },
          orderType: createdOrder.orderType,
          tableNumber: createdOrder.tableNumber,
          items: createdOrder.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            pricePaise: item.pricePaise,
            subtotalPaise: item.subtotalPaise,
          })),
          subtotalPaise: createdOrder.subtotalPaise,
          discountPaise: createdOrder.discountPaise,
          taxPaise: createdOrder.taxPaise,
          deliveryFeePaise: createdOrder.deliveryFeePaise,
          totalPaise: createdOrder.totalPaise,
          status: createdOrder.status,
        });

        console.log(`Order confirmation email sent to ${email}`);
      } else {
        console.log('Order email skipped: customer email is missing.');
      }
    } catch (emailError: any) {
      console.error(
        'Order confirmation email failed:',
        emailError?.message || emailError
      );
    }


    // Update user points and transaction record
    if (req.user) {
      const user = await UserModel.findById(req.user.id);
      if (user) {
        user.loyaltyPoints = Math.max(0, user.loyaltyPoints - pointsUsed + pointsEarned);
        await user.save();

        if (pointsUsed > 0) {
          await LoyaltyTransactionModel.create({
            user: user._id,
            order: createdOrder._id,
            points: -pointsUsed,
            type: 'redeemed',
            description: `Redeemed ${pointsUsed} pts on Order #${orderNumber}`,
            balanceAfter: user.loyaltyPoints,
          });
        }
        if (pointsEarned > 0) {
          await LoyaltyTransactionModel.create({
            user: user._id,
            order: createdOrder._id,
            points: pointsEarned,
            type: 'earned',
            description: `Earned ${pointsEarned} pts on Order #${orderNumber}`,
            balanceAfter: user.loyaltyPoints,
          });
        }
      }
    }

    res.status(201).json({
      message: 'Order placed successfully and persisted to MongoDB Atlas!',
      order: createdOrder,
    });
  } catch (err: any) {
    console.error('Order creation database error:', err?.message || err);
    res.status(500).json({ error: 'Database write error while saving order to MongoDB Atlas.' });
  }
}

export async function getOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { idOrNumber } = req.params;

    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.',
        database: 'brewhaven',
      });
      return;
    }

    let order = null;
    if (mongoose.isValidObjectId(idOrNumber)) {
      order = await OrderModel.findById(idOrNumber);
    }
    if (!order) {
      order = await OrderModel.findOne({ orderNumber: idOrNumber });
    }
    if (!order) {
      res.status(404).json({ error: 'Order not found in MongoDB.' });
      return;
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order details from database.' });
  }
}

export async function getUserOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const orders = await OrderModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order history from database.' });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    if (!isMongoLive()) {
      res.status(503).json({
        error: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.',
        database: 'brewhaven',
      });
      return;
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found in MongoDB.' });
      return;
    }
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      timestamp: new Date(),
    });
    await order.save();
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status in database.' });
  }
}
