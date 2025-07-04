import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["buyer", "publisher", "admin"]);

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "payment_completed",
  "content_submitted", // Buyer has submitted content
  "in_progress", 
  "submitted", // Publisher has submitted proof of work
  "pending_approval", // Waiting for dev team approval
  "completed",
  "payment_pending", // Publisher payment pending
  "disputed",
  "cancelled",
  "refunded"
]);

// Account type enum for banking details
export const accountTypeEnum = pgEnum("account_type", [
  "savings",
  "current",
  "salary"
]);

// Website approval status enum
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved", 
  "rejected"
]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("buyer"),
  hasSelectedRole: boolean("has_selected_role").default(false),
  roleChangeCount: integer("role_change_count").default(0),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0.00"),
  hasBankingDetails: boolean("has_banking_details").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Banking details for publishers (India)
export const bankingDetails = pgTable("banking_details", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  accountHolderName: varchar("account_holder_name", { length: 100 }).notNull(),
  bankAccountNumber: varchar("bank_account_number", { length: 20 }).notNull(),
  ifscCode: varchar("ifsc_code", { length: 11 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountType: accountTypeEnum("account_type").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Website categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Publisher websites
export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  publisherId: varchar("publisher_id").notNull().references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  url: varchar("url", { length: 500 }).notNull(),
  domainAuthority: integer("domain_authority"),
  domainRating: integer("domain_rating"),
  monthlyTraffic: integer("monthly_traffic"),
  language: varchar("language", { length: 10 }).default("en"),
  linkType: varchar("link_type", { length: 20 }).default("dofollow"),
  postDuration: varchar("post_duration", { length: 50 }).default("permanent"),
  pricePerPost: decimal("price_per_post", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  approvalStatus: approvalStatusEnum("approval_status").default("pending"),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  totalOrders: integer("total_orders").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  websiteId: integer("website_id").notNull().references(() => websites.id),
  needsContent: boolean("needs_content").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  publisherId: varchar("publisher_id").notNull().references(() => users.id),
  websiteId: integer("website_id").notNull().references(() => websites.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending"),
  needsContent: boolean("needs_content").default(false),
  
  // Buyer content submission
  blogContent: text("blog_content"), // Max 2000 chars - buyer submitted content
  targetLink: varchar("target_link", { length: 500 }), // Link to be inserted
  uploadedFile: varchar("uploaded_file", { length: 500 }), // Optional file upload path
  contentSubmittedAt: timestamp("content_submitted_at"),
  
  // Publisher fulfillment
  publishedUrl: varchar("published_url", { length: 500 }), // Final blog post URL
  publisherNotes: text("publisher_notes"),
  publisherSubmittedAt: timestamp("publisher_submitted_at"),
  
  // Admin approval
  adminApprovedBy: varchar("admin_approved_by").references(() => users.id),
  adminApprovedAt: timestamp("admin_approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Order completion timestamps
  completedAt: timestamp("completed_at"),
  refundedAt: timestamp("refunded_at"),
  
  requirements: text("requirements"),
  autoRefundAt: timestamp("auto_refund_at"), // Auto-refund deadline (7 days)
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions (wallet/payment history)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  type: varchar("type", { length: 20 }).notNull(), // credit, debit, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentId: varchar("payment_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  websites: many(websites),
  buyerOrders: many(orders, { relationName: "buyer_orders" }),
  publisherOrders: many(orders, { relationName: "publisher_orders" }),
  cartItems: many(cartItems),
  transactions: many(transactions),
  notifications: many(notifications),
  bankingDetails: one(bankingDetails),
}));

export const bankingDetailsRelations = relations(bankingDetails, ({ one }) => ({
  user: one(users, {
    fields: [bankingDetails.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  websites: many(websites),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  publisher: one(users, {
    fields: [websites.publisherId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [websites.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  buyer: one(users, {
    fields: [cartItems.buyerId],
    references: [users.id],
  }),
  website: one(websites, {
    fields: [cartItems.websiteId],
    references: [websites.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "buyer_orders",
  }),
  publisher: one(users, {
    fields: [orders.publisherId],
    references: [users.id],
    relationName: "publisher_orders",
  }),
  website: one(websites, {
    fields: [orders.websiteId],
    references: [websites.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalOrders: true,
  rating: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBankingDetailsSchema = createInsertSchema(bankingDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type BankingDetails = typeof bankingDetails.$inferSelect;
export type InsertBankingDetails = z.infer<typeof insertBankingDetailsSchema>;
