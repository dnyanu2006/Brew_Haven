
import nodemailer from "nodemailer";

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!user || !pass) {
  console.warn("Gmail SMTP credentials are missing.");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user,
    pass,
  },
});

export async function sendWelcomeEmail(
  email: string,
  name: string
) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: email,
    subject: "Welcome to Brew Haven Cafe!",
    text: `Hi ${name}, welcome to Brew Haven Cafe! Your registration was successful. Enjoy exploring our menu.`,
  });
}

export async function sendOrderConfirmation(order: {
  email: string;
  name: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address: string;
}) {
  const items = order.items
    .map(
      (item) =>
        `${item.name} x ${item.quantity} - ₹${item.price}`
    )
    .join("\n");

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: order.email,
    subject: `Brew Haven Order Confirmation - ${order.orderId}`,
    text: `Hi ${order.name},

Thank you for ordering from Brew Haven Cafe!

Order ID: ${order.orderId}

Items:
${items}

Total: ₹${order.total}
Delivery address: ${order.address}
Status: Order Placed

Thank you for choosing Brew Haven Cafe!`,
  });
}
