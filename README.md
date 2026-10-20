# Brew Haven - Artisanal Specialty Coffee & Bakery

A modern, full-stack specialty cafe web application built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB Atlas (Mongoose)**, and **Google Gemini API**.

---

## ☕ Key Features

1. **Artisanal Digital Storefront**:
   - Seasonal menu with real-time category filtering, search, veg/non-veg tags, and sorting.
   - Comprehensive beverage customization (size, milk types, sweetness percentage, artisan toppings, extra shots, custom instructions).
   - Precision monetary calculations in integer paise (e.g., ₹280 = 28000 paise) preventing floating point errors.
   - Cart drawer with live coupon validation (`FIRSTBREW` for 20% off, `HAVEN50` for ₹50 off) and loyalty points redemption.
   - Checkout for Dine-In (with table selector), Takeaway, and Delivery.
   - Order tracking with a 5-step visual status timeline and one-click reordering.

2. **Table Reservations System**:
   - Date, time slot, and guest count selector.
   - Real-time table conflict prevention (prevents double-booking same table/time slot).
   - Seating preferences: Sunlit Window, Velvet Booth (Indoor), Garden Patio, Barista Counter.
   - Unique confirmation codes (e.g. `BH-RES-4921`) and instant cancellation.

3. **AI Coffee Sommelier (Gemini API)**:
   - Evaluates guest flavor profile, sweetness, temperature, dietary needs, and budget.
   - Calls `@google/genai` model `gemini-3.8-flash` on the server to recommend exact pairings from the live menu.
   - Built-in rule-based fallback if the API key is not present.

4. **Staff Management & Admin Console**:
   - Live revenue analytics, order counts, and bestsellers breakdown.
   - Kitchen display order status progression (`placed` ➔ `accepted` ➔ `preparing` ➔ `ready` ➔ `completed`).
   - Full CRUD menu editor: add/edit items, change prices, toggle availability, update images.
   - Inventory tracking with automated low-stock warnings and one-click restocking.
   - Coupon creator and customer reviews moderation.
   - Live MongoDB Atlas connection inspector and dynamic connection string configurator.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas with Mongoose models
- **Auth**: JWT tokens stored in secure HTTP-only cookies and bcrypt password hashing
- **AI**: Google GenAI SDK (`@google/genai`) with `gemini-3.8-flash`
- **Environment**: Dotenv

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- (Optional) MongoDB Atlas free cluster connection string

### 2. Environment Setup
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the following variables in `.env`:
```env
# MongoDB Atlas Connection URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/brewhaven?retryWrites=true&w=majority"

# JWT Secret for cookie authentication & tokens
JWT_SECRET="brewhaven_super_secret_jwt_key_2026_specialty_cafe"

# GEMINI_API_KEY for AI Sommelier recommendations
GEMINI_API_KEY="your_gemini_api_key"

# Hosting
PORT=3000
NODE_ENV=development
```

*Note:* If `MONGODB_URI` is not provided initially, Brew Haven operates on an in-memory database store seeded with gourmet items and demo accounts. You can connect to MongoDB Atlas anytime from the Admin portal.

### 3. Installation
```bash
npm install
```

### 4. Running the Application
To run the unified full-stack server (Express + Vite on port 3000):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Seeding MongoDB Atlas
To manually seed your remote MongoDB Atlas cluster with the complete artisanal cafe catalog, tables, coupons, and staff accounts:
```bash
npm run seed
```

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brewhaven.com` | `Admin@123` | Full admin dashboard, revenue analytics, menu CRUD, coupons, inventory |
| **Staff / Kitchen** | `barista@brewhaven.com` | `Barista@123` | Kitchen orders, status changes, inventory restock, reservations |
| **Customer** | `alex@example.com` | `Customer@123` | Cart, order history, table booking, 240 loyalty points, favorites |

---

## 📡 REST API Documentation

### Authentication
- `POST /api/auth/register` - Create customer account (awards 100 welcome loyalty points)
- `POST /api/auth/login` - Authenticate with email and password (sets JWT cookie)
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get profile and loyalty balance
- `POST /api/auth/favorites` - Toggle favorited menu items

### Menu & Products
- `GET /api/menu/categories` - List active categories
- `GET /api/menu/items` - List items with category, search, vegOnly, and sort filters
- `GET /api/menu/items/:idOrSlug` - Get item details and customization options
- `POST /api/menu/items` - Add new product (Admin)
- `PUT /api/menu/items/:id` - Update price, availability, or details (Admin)
- `DELETE /api/menu/items/:id` - Remove product (Admin)

### Orders
- `POST /api/orders` - Validate prices, apply coupons/points, and create order
- `GET /api/orders/:idOrNumber` - Get order tracking status
- `GET /api/orders/my-orders` - Order history for authenticated user
- `PUT /api/orders/:id/status` - Advance kitchen status (Staff/Admin)

### Reservations
- `GET /api/reservations/tables` - List all cafe tables
- `GET /api/reservations/check-availability` - Check free tables for date & time slot
- `POST /api/reservations` - Book table with conflict prevention
- `GET /api/reservations/my-reservations` - View user's table bookings
- `PUT /api/reservations/:idOrCode/cancel` - Cancel reservation

### AI Sommelier
- `POST /api/ai/recommend` - Submit taste profile, temperature, sweetness, and budget to Gemini

### Admin & Inventory
- `GET /api/admin/stats` - Total revenue, daily sales, low-stock count, bestsellers
- `GET /api/inventory` - Stock levels with low-stock warnings
- `POST /api/inventory/restock/:id` - Add ingredient quantity
- `POST /api/coupons` - Create promo discount coupon
- `POST /api/admin/connect-db` - Connect or switch MongoDB Atlas URI
