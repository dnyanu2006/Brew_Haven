
import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER or SMTP_PASS is missing from .env');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: 'Welcome to Brew Haven! ☕',
    text: `Hi ${name}, welcome to Brew Haven! Your account has been created successfully, and you have received 100 welcome loyalty points. We look forward to serving you!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#3b2a20">
        <h1>☕ Welcome to Brew Haven!</h1>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your account has been created successfully. We're happy to have you with us!</p>
        <div style="background:#f7efe5;padding:16px;border-radius:8px">
          <h2 style="margin-top:0">🎁 100 Welcome Loyalty Points</h2>
          <p>Your welcome points are ready to use according to our loyalty program.</p>
        </div>
        <p>We look forward to serving you delicious coffee and treats!</p>
        <p><strong>The Brew Haven Team</strong></p>
      </div>
    `,
  });
}

type OrderEmailDetails = {
  orderNumber: string;
  createdAt?: Date | string;
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  orderType: string;
  tableNumber?: string | number;
  items: Array<{
    name: string;
    quantity: number;
    pricePaise: number;
    subtotalPaise: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  status: string;
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!);

const rupees = (paise: number) =>
  `₹${(paise / 100).toFixed(2)}`;

export async function sendOrderConfirmationEmail(
  order: OrderEmailDetails
): Promise<void> {
  const transporter = createTransporter();
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee">
        ${escapeHtml(item.name)}
      </td>
      <td style="padding:10px;text-align:center;border-bottom:1px solid #eee">
        ${item.quantity}
      </td>
      <td style="padding:10px;text-align:right;border-bottom:1px solid #eee">
        ${rupees(item.subtotalPaise)}
      </td>
    </tr>
  `).join('');

  const isDelivery = order.orderType === 'delivery';

  const fulfilmentDetails = isDelivery
    ? `<p><strong>Delivery address:</strong>
         ${escapeHtml(order.customerDetails.address || 'Not provided')}</p>`
    : `<p><strong>Table number:</strong>
         ${escapeHtml(order.tableNumber || 'Not applicable')}</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: order.customerDetails.email,
    subject: `Brew Haven Order Confirmation - ${order.orderNumber}`,
    text: [
      `Hello ${order.customerDetails.name},`,
      `Your Brew Haven order ${order.orderNumber} has been placed.`,
      ...order.items.map(
        (item) => `${item.name} x ${item.quantity}: ${rupees(item.subtotalPaise)}`
      ),
      `Subtotal: ${rupees(order.subtotalPaise)}`,
      `Discount: ${rupees(order.discountPaise)}`,
      `GST: ${rupees(order.taxPaise)}`,
      `Delivery fee: ${rupees(order.deliveryFeePaise)}`,
      `Total: ${rupees(order.totalPaise)}`,
      `Status: ${order.status}`,
      isDelivery
        ? `Delivery address: ${order.customerDetails.address || 'Not provided'}`
        : `Table number: ${order.tableNumber || 'Not applicable'}`,
      'Thank you for ordering with Brew Haven!',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;color:#35251d;max-width:600px;margin:auto">
        <div style="background:#4b2e22;color:white;padding:24px;text-align:center">
          <h1 style="margin:0">☕ Brew Haven</h1>
          <p>Your order is confirmed!</p>
        </div>
        <div style="padding:24px">
          <p>Hello ${escapeHtml(order.customerDetails.name)},</p>
          <p>Thanks for ordering with us. Here is your receipt.</p>
          <p><strong>Order number:</strong> ${escapeHtml(order.orderNumber)}</p>
          <p><strong>Order date:</strong>
            ${escapeHtml(new Date(order.createdAt || Date.now()).toLocaleString('en-IN'))}</p>
          <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
          ${fulfilmentDetails}
          <h3>Your items</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f7f0e9">
                <th style="padding:10px;text-align:left">Item</th>
                <th style="padding:10px">Qty</th>
                <th style="padding:10px;text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:20px">
            <p>Subtotal: ${rupees(order.subtotalPaise)}</p>
            <p>Discount: −${rupees(order.discountPaise)}</p>
            <p>GST: ${rupees(order.taxPaise)}</p>
            <p>Delivery fee: ${rupees(order.deliveryFeePaise)}</p>
            <h2 style="border-top:1px solid #ddd;padding-top:14px">
              Total: ${rupees(order.totalPaise)}
            </h2>
          </div>
          <p>Thank you for choosing Brew Haven. Enjoy every sip and bite!</p>
        </div>
      </div>
    `,
  });
}

export async function sendReservationConfirmationEmail(reservation: {
  reservationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  tableNumber?: string;
  seatingArea?: string;
  specialRequests?: string;
}): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to: reservation.customerEmail,
    subject: `BrewHaven Table Reservation Confirmed - ${reservation.reservationCode}`,
    text: `
Hello ${reservation.customerName},

Your table reservation at BrewHaven is confirmed!

Reservation Code: ${reservation.reservationCode}
Date: ${reservation.date}
Time: ${reservation.timeSlot}
Guests: ${reservation.guestCount}
Table: ${reservation.tableNumber || 'To be confirmed'}
Seating: ${reservation.seatingArea || 'Indoor'}
Phone: ${reservation.customerPhone}
Special Requests: ${reservation.specialRequests || 'None'}

Please keep your reservation code for reference.

Thank you for choosing BrewHaven!
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
        <h1 style="color: #6f4e37;">BrewHaven ☕</h1>
        <h2>Your Table Reservation is Confirmed!</h2>
        <p>Hello ${escapeHtml(reservation.customerName)},</p>
        <p>We're looking forward to welcoming you to BrewHaven.</p>
        <div style="background: #f7f1eb; padding: 18px; border-radius: 8px;">
          <p><strong>Reservation Code:</strong> ${escapeHtml(reservation.reservationCode)}</p>
          <p><strong>Date:</strong> ${escapeHtml(reservation.date)}</p>
          <p><strong>Time:</strong> ${escapeHtml(reservation.timeSlot)}</p>
          <p><strong>Guests:</strong> ${reservation.guestCount}</p>
          <p><strong>Table:</strong> ${escapeHtml(String(reservation.tableNumber || 'To be confirmed'))}</p>
          <p><strong>Seating:</strong> ${escapeHtml(reservation.seatingArea || 'Indoor')}</p>
          <p><strong>Phone:</strong> ${escapeHtml(reservation.customerPhone)}</p>
          <p><strong>Special Requests:</strong> ${escapeHtml(reservation.specialRequests || 'None')}</p>
        </div>
        <p>Please keep your reservation code for reference.</p>
        <p>Thank you for choosing BrewHaven!</p>
      </div>
    `,
  });
}


