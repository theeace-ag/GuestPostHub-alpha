import {
  users,
  websites,
  categories,
  cartItems,
  orders,
  transactions,
  notifications,
  bankingDetails,
  type User,
  type UpsertUser,
  type Website,
  type InsertWebsite,
  type Category,
  type InsertCategory,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type Transaction,
  type InsertTransaction,
  type Notification,
  type InsertNotification,
  type BankingDetails,
  type InsertBankingDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  
  // Banking details operations
  getBankingDetails(userId: string): Promise<BankingDetails | undefined>;
  createBankingDetails(bankingDetails: InsertBankingDetails): Promise<BankingDetails>;
  updateBankingDetails(userId: string, updates: Partial<InsertBankingDetails>): Promise<BankingDetails | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Website operations
  getWebsites(filters?: {
    categoryId?: number;
    minDA?: number;
    maxDA?: number;
    minPrice?: number;
    maxPrice?: number;
    language?: string;
    linkType?: string;
    search?: string;
    approvalStatus?: string;
    publisherId?: string;
  }): Promise<(Website & { category?: Category; publisher: User })[]>;
  getWebsiteById(id: number): Promise<(Website & { category?: Category; publisher: User }) | undefined>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: number, updates: Partial<InsertWebsite>): Promise<Website | undefined>;
  approveWebsite(id: number): Promise<Website | undefined>;
  rejectWebsite(id: number): Promise<Website | undefined>;
  
  // Cart operations
  getCartItems(buyerId: string): Promise<(CartItem & { website: Website & { publisher: User } })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(buyerId: string): Promise<void>;
  
  // Order operations
  getOrders(filters?: {
    buyerId?: string;
    publisherId?: string;
    status?: string;
  }): Promise<(Order & { buyer: User; publisher: User; website: Website })[]>;
  getOrderById(id: number): Promise<(Order & { buyer: User; publisher: User; website: Website }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Transaction operations
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateWalletBalance(userId: string, amount: string): Promise<User | undefined>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  
  // Admin operations
  getPendingWebsites(): Promise<(Website & { publisher: User; category?: Category })[]>;
  getDashboardStats(): Promise<{
    totalRevenue: string;
    activeUsers: number;
    pendingApprovals: number;
    totalOrders: number;
  }>;
  getAdminUsers(): Promise<User[]>;
  getOverdueOrders(): Promise<Order[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Banking details operations
  async getBankingDetails(userId: string): Promise<BankingDetails | undefined> {
    const [bankDetails] = await db
      .select()
      .from(bankingDetails)
      .where(and(eq(bankingDetails.userId, userId), eq(bankingDetails.isActive, true)));
    return bankDetails;
  }

  async createBankingDetails(bankingDetailsData: InsertBankingDetails): Promise<BankingDetails> {
    // Deactivate existing banking details first
    await db
      .update(bankingDetails)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(bankingDetails.userId, bankingDetailsData.userId));

    const [created] = await db
      .insert(bankingDetails)
      .values(bankingDetailsData)
      .returning();

    // Update user banking status
    await db
      .update(users)
      .set({ hasBankingDetails: true, updatedAt: new Date() })
      .where(eq(users.id, bankingDetailsData.userId));

    return created;
  }

  async updateBankingDetails(userId: string, updates: Partial<InsertBankingDetails>): Promise<BankingDetails | undefined> {
    const [updated] = await db
      .update(bankingDetails)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(bankingDetails.userId, userId), eq(bankingDetails.isActive, true)))
      .returning();
    return updated;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Website operations
  async getWebsites(filters?: {
    categoryId?: number;
    minDA?: number;
    maxDA?: number;
    minPrice?: number;
    maxPrice?: number;
    language?: string;
    linkType?: string;
    search?: string;
    approvalStatus?: string;
    publisherId?: string;
  }): Promise<(Website & { category?: Category; publisher: User })[]> {
    let query = db
      .select({
        ...websites,
        category: categories,
        publisher: users,
      })
      .from(websites)
      .leftJoin(categories, eq(websites.categoryId, categories.id))
      .innerJoin(users, eq(websites.publisherId, users.id));

    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(websites.categoryId, filters.categoryId));
    }
    if (filters?.minDA) {
      conditions.push(gte(websites.domainAuthority, filters.minDA));
    }
    if (filters?.maxDA) {
      conditions.push(lte(websites.domainAuthority, filters.maxDA));
    }
    if (filters?.minPrice) {
      conditions.push(gte(websites.pricePerPost, filters.minPrice.toString()));
    }
    if (filters?.maxPrice) {
      conditions.push(lte(websites.pricePerPost, filters.maxPrice.toString()));
    }
    if (filters?.language) {
      conditions.push(eq(websites.language, filters.language));
    }
    if (filters?.linkType) {
      conditions.push(eq(websites.linkType, filters.linkType));
    }
    if (filters?.approvalStatus) {
      conditions.push(eq(websites.approvalStatus, filters.approvalStatus as any));
    }
    if (filters?.publisherId) {
      conditions.push(eq(websites.publisherId, filters.publisherId));
    }
    if (filters?.search) {
      conditions.push(
        ilike(websites.url, `%${filters.search}%`)
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(websites.createdAt));
  }

  async getWebsiteById(id: number): Promise<(Website & { category?: Category; publisher: User }) | undefined> {
    const [website] = await db
      .select({
        ...websites,
        category: categories,
        publisher: users,
      })
      .from(websites)
      .leftJoin(categories, eq(websites.categoryId, categories.id))
      .innerJoin(users, eq(websites.publisherId, users.id))
      .where(eq(websites.id, id));
    
    return website;
  }

  async createWebsite(website: InsertWebsite): Promise<Website> {
    const [created] = await db.insert(websites).values(website).returning();
    return created;
  }

  async updateWebsite(id: number, updates: Partial<InsertWebsite>): Promise<Website | undefined> {
    const [updated] = await db
      .update(websites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(websites.id, id))
      .returning();
    return updated;
  }

  async approveWebsite(id: number): Promise<Website | undefined> {
    const [updated] = await db
      .update(websites)
      .set({ 
        approvalStatus: "approved",
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(websites.id, id))
      .returning();
    return updated;
  }

  async rejectWebsite(id: number): Promise<Website | undefined> {
    const [updated] = await db
      .update(websites)
      .set({ 
        approvalStatus: "rejected",
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(websites.id, id))
      .returning();
    return updated;
  }

  // Cart operations
  async getCartItems(buyerId: string): Promise<(CartItem & { website: Website & { publisher: User } })[]> {
    return await db
      .select({
        ...cartItems,
        website: {
          ...websites,
          publisher: users,
        },
      })
      .from(cartItems)
      .innerJoin(websites, eq(cartItems.websiteId, websites.id))
      .innerJoin(users, eq(websites.publisherId, users.id))
      .where(eq(cartItems.buyerId, buyerId))
      .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.buyerId, cartItem.buyerId),
          eq(cartItems.websiteId, cartItem.websiteId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db.insert(cartItems).values(cartItem).returning();
    return created;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(buyerId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.buyerId, buyerId));
  }

  // Order operations
  async getOrders(filters?: {
    buyerId?: string;
    publisherId?: string;
    status?: string;
  }): Promise<(Order & { buyer: User; publisher: User; website: Website })[]> {
    const conditions = [];

    // Base query with proper joins
    let baseQuery = db
      .select()
      .from(orders)
      .innerJoin(websites, eq(orders.websiteId, websites.id))
      .orderBy(desc(orders.createdAt));

    if (filters?.buyerId) {
      conditions.push(eq(orders.buyerId, filters.buyerId));
    }
    if (filters?.publisherId) {
      conditions.push(eq(websites.publisherId, filters.publisherId));
    }
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status as any));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const rawOrders = await baseQuery;
    
    // Manually fetch user data for buyers and publishers
    const result = [];
    for (const row of rawOrders) {
      const buyer = await this.getUser(row.orders.buyerId);
      const publisher = await this.getUser(row.websites.publisherId);
      
      if (buyer && publisher) {
        result.push({
          ...row.orders,
          buyer,
          publisher,
          website: row.websites
        });
      }
    }

    return result;
  }

  async getOrderById(id: number): Promise<(Order & { buyer: User; publisher: User; website: Website }) | undefined> {
    // First get the order with website
    const [orderWithWebsite] = await db
      .select()
      .from(orders)
      .innerJoin(websites, eq(orders.websiteId, websites.id))
      .where(eq(orders.id, id));
    
    if (!orderWithWebsite) {
      return undefined;
    }
    
    // Fetch buyer and publisher separately
    const buyer = await this.getUser(orderWithWebsite.orders.buyerId);
    const publisher = await this.getUser(orderWithWebsite.websites.publisherId);
    
    if (!buyer || !publisher) {
      return undefined;
    }
    
    return {
      ...orderWithWebsite.orders,
      buyer,
      publisher,
      website: orderWithWebsite.websites
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate unique order number
    const orderNumber = `LP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    // Set auto-refund deadline to 7 days from now
    const autoRefundAt = new Date();
    autoRefundAt.setDate(autoRefundAt.getDate() + 7);
    
    const [created] = await db
      .insert(orders)
      .values({ ...order, orderNumber, autoRefundAt })
      .returning();
    return created;
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // Transaction operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateWalletBalance(userId: string, amount: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ 
        walletBalance: amount,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Admin operations
  async getPendingWebsites(): Promise<(Website & { publisher: User; category?: Category })[]> {
    return await db
      .select({
        ...websites,
        publisher: users,
        category: categories,
      })
      .from(websites)
      .innerJoin(users, eq(websites.publisherId, users.id))
      .leftJoin(categories, eq(websites.categoryId, categories.id))
      .where(eq(websites.approvalStatus, "pending"))
      .orderBy(desc(websites.createdAt));
  }

  async getDashboardStats(): Promise<{
    totalRevenue: string;
    activeUsers: number;
    pendingApprovals: number;
    totalOrders: number;
  }> {
    const [revenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.platformFee}), 0)::text`,
      })
      .from(orders)
      .where(eq(orders.status, "completed"));

    const [usersResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(users);

    const [pendingResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(websites)
      .where(eq(websites.approvalStatus, "pending"));

    const [ordersResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders);

    return {
      totalRevenue: revenueResult?.total || "0",
      activeUsers: usersResult?.count || 0,
      pendingApprovals: pendingResult?.count || 0,
      totalOrders: ordersResult?.count || 0,
    };
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));
  }

  async getOverdueOrders(): Promise<Order[]> {
    const now = new Date();
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "pending"),
          lte(orders.autoRefundAt, now)
        )
      );
  }
}

export const storage = new DatabaseStorage();
