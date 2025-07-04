import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertWebsiteSchema, insertCartItemSchema, insertOrderSchema, insertBankingDetailsSchema } from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";

const websiteFiltersSchema = z.object({
  categoryId: z.coerce.number().optional(),
  minDA: z.coerce.number().optional(),
  maxDA: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  language: z.string().optional(),
  linkType: z.string().optional(),
  search: z.string().optional(),
  approvalStatus: z.string().optional(),
});

// Initialize Razorpay instance (conditional)
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Set user role during signup
  app.post('/api/auth/set-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['buyer', 'publisher'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user already has selected their role
      const existingUser = await storage.getUser(userId);
      if (existingUser && existingUser.hasSelectedRole) {
        return res.status(400).json({ message: "Role already selected" });
      }

      // Update user role and mark as having selected role
      await storage.updateUser(userId, { 
        role, 
        hasSelectedRole: true,
        roleChangeCount: 1 
      });
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  // Role switching for testing (admin only)
  app.post('/api/auth/switch-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['buyer', 'publisher', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Update user role in database
      await storage.updateUser(userId, { role });
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
    }
  });

  // Banking Details for Publishers
  app.get('/api/banking-details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "publisher") {
        return res.status(403).json({ message: "Only publishers can access banking details" });
      }

      const bankingDetails = await storage.getBankingDetails(userId);
      res.json(bankingDetails);
    } catch (error) {
      console.error("Error fetching banking details:", error);
      res.status(500).json({ message: "Failed to fetch banking details" });
    }
  });

  app.post('/api/banking-details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "publisher") {
        return res.status(403).json({ message: "Only publishers can set banking details" });
      }

      const validatedData = insertBankingDetailsSchema.parse({
        ...req.body,
        userId,
      });

      const bankingDetails = await storage.createBankingDetails(validatedData);
      res.json(bankingDetails);
    } catch (error) {
      console.error("Error creating banking details:", error);
      res.status(500).json({ message: "Failed to create banking details" });
    }
  });

  app.patch('/api/banking-details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "publisher") {
        return res.status(403).json({ message: "Only publishers can update banking details" });
      }

      const updates = insertBankingDetailsSchema.partial().parse(req.body);
      const bankingDetails = await storage.updateBankingDetails(userId, updates);
      
      if (!bankingDetails) {
        return res.status(404).json({ message: "Banking details not found" });
      }

      res.json(bankingDetails);
    } catch (error) {
      console.error("Error updating banking details:", error);
      res.status(500).json({ message: "Failed to update banking details" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Websites
  app.get('/api/websites', async (req, res) => {
    try {
      const filters = websiteFiltersSchema.parse(req.query);
      const websites = await storage.getWebsites({
        ...filters,
        approvalStatus: "approved", // Only show approved websites to buyers
      });
      res.json(websites);
    } catch (error) {
      console.error("Error fetching websites:", error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  app.get('/api/websites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const website = await storage.getWebsiteById(id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      console.error("Error fetching website:", error);
      res.status(500).json({ message: "Failed to fetch website" });
    }
  });

  app.post('/api/websites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "publisher") {
        return res.status(403).json({ message: "Only publishers can create websites" });
      }

      const websiteData = insertWebsiteSchema.parse({
        ...req.body,
        publisherId: userId,
      });

      const website = await storage.createWebsite(websiteData);
      res.status(201).json(website);
    } catch (error) {
      console.error("Error creating website:", error);
      res.status(500).json({ message: "Failed to create website" });
    }
  });

  // Publisher websites
  app.get('/api/publisher/websites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const websites = await storage.getWebsites({ publisherId: userId });
      res.json(websites);
    } catch (error) {
      console.error("Error fetching publisher websites:", error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Cart
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        buyerId: userId,
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Orders
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let filters: any = {};
      if (user?.role === "buyer") {
        filters.buyerId = userId;
      } else if (user?.role === "publisher") {
        filters.publisherId = userId;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethod, needsContent } = req.body;

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate totals
      let subtotal = 0;
      const orders = [];

      for (const item of cartItems) {
        const amount = parseFloat(item.website.pricePerPost);
        const contentFee = needsContent ? 50 : 0;
        const totalAmount = amount + contentFee;
        const platformFee = totalAmount * 0.05; // 5% platform fee
        
        subtotal += totalAmount + platformFee;
      }

      // Check wallet balance
      const user = await storage.getUser(userId);
      const walletBalance = parseFloat(user?.walletBalance || "0");
      
      if (walletBalance < subtotal) {
        return res.status(400).json({ 
          message: "Insufficient wallet balance", 
          required: subtotal.toFixed(2),
          available: walletBalance.toFixed(2)
        });
      }

      // Deduct total amount from buyer's wallet
      const newWalletBalance = (walletBalance - subtotal).toString();
      await storage.updateWalletBalance(userId, newWalletBalance);

      // Process each cart item
      for (const item of cartItems) {
        const amount = parseFloat(item.website.pricePerPost);
        const contentFee = needsContent ? 50 : 0;
        const totalAmount = amount + contentFee;
        const platformFee = totalAmount * 0.05; // 5% platform fee
        
        const orderData = {
          buyerId: userId,
          publisherId: item.website.publisherId,
          websiteId: item.websiteId,
          amount: amount.toString(),
          platformFee: platformFee.toString(),
          totalAmount: (totalAmount + platformFee).toString(),
          needsContent: needsContent || false,
          status: "pending" as const,
        };

        const order = await storage.createOrder(orderData);
        orders.push(order);

        // Create transaction for buyer
        await storage.createTransaction({
          userId,
          orderId: order.id,
          type: "debit",
          amount: (totalAmount + platformFee).toString(),
          description: `Payment for guest post on ${item.website.url}`,
          paymentMethod: "wallet",
        });

        // Create notification for publisher
        await storage.createNotification({
          userId: item.website.publisherId,
          title: "New Order Received",
          message: `You have received a new guest post order for ${item.website.url}. Amount pending: ₹${amount.toFixed(2)} (Platform fee: ₹${platformFee.toFixed(2)})`,
          type: "order",
        });

        // Create notification for buyer  
        await storage.createNotification({
          userId: userId,
          title: "Order Confirmed",
          message: `Your order for ${item.website.url} has been confirmed. Publisher will complete it within 7 days.`,
          type: "order",
        });
      }

      // Clear cart
      await storage.clearCart(userId);

      res.json({ 
        message: "Orders created successfully", 
        orders,
        total: subtotal.toFixed(2),
        newWalletBalance
      });
    } catch (error) {
      console.error("Error processing checkout:", error);
      res.status(500).json({ message: "Failed to process checkout" });
    }
  });

  // Buyer submits content and requirements for order
  app.patch('/api/orders/:id/submit-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { blogContent, targetLink, uploadedFile } = req.body;

      // Validate content length
      if (blogContent && blogContent.length > 2000) {
        return res.status(400).json({ message: "Blog content must not exceed 2000 characters" });
      }

      // Get order to verify ownership
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== "buyer" || order.buyerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (order.status !== "payment_completed" && order.status !== "pending") {
        return res.status(400).json({ message: "Content can only be submitted after payment" });
      }

      const updatedOrder = await storage.updateOrder(id, {
        status: "content_submitted",
        blogContent,
        targetLink,
        uploadedFile,
        contentSubmittedAt: new Date(),
      });

      // Notify publisher about content submission
      await storage.createNotification({
        userId: order.publisherId,
        title: "Content Submitted for Order",
        message: `Buyer has submitted content for order on ${order.website.url}. You can now start working on the guest post.`,
        type: "order",
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error submitting content:", error);
      res.status(500).json({ message: "Failed to submit content" });
    }
  });

  // Publisher submits fulfillment proof
  app.patch('/api/orders/:id/submit-fulfillment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { publishedUrl, publisherNotes } = req.body;

      // Get order to verify ownership
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== "publisher" || order.publisherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (order.status !== "content_submitted" && order.status !== "in_progress") {
        return res.status(400).json({ message: "Order cannot be submitted at this stage" });
      }

      const updatedOrder = await storage.updateOrder(id, {
        status: "pending_approval",
        publishedUrl,
        publisherNotes,
        publisherSubmittedAt: new Date(),
      });

      // Notify buyer about fulfillment submission
      await storage.createNotification({
        userId: order.buyerId,
        title: "Guest Post Completed",
        message: `Publisher has completed your guest post for ${order.website.url}. Awaiting admin approval for payment release.`,
        type: "order",
      });

      // Notify admins about pending approval
      const adminUsers = await storage.getAdminUsers();
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "Order Needs Approval",
          message: `Order #${order.orderNumber} has been completed and needs admin approval for payment release.`,
          type: "admin",
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error submitting fulfillment:", error);
      res.status(500).json({ message: "Failed to submit fulfillment" });
    }
  });

  // Publisher submits proof of work
  app.patch('/api/orders/:id/submit-proof', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { postUrl, proofOfWork, proofImages } = req.body;

      // Get order to verify ownership
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== "publisher" || order.publisherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (order.status !== "pending" && order.status !== "in_progress") {
        return res.status(400).json({ message: "Order cannot be updated at this stage" });
      }

      const updatedOrder = await storage.updateOrder(id, {
        status: "submitted",
        postUrl,
        proofOfWork,
        proofImages: JSON.stringify(proofImages || []),
      });

      // Notify buyer about proof submission
      await storage.createNotification({
        userId: order.buyerId,
        title: "Proof of Work Submitted",
        message: `Publisher has submitted proof of work for your order on ${order.website.url}. Awaiting admin approval.`,
        type: "order",
      });

      // Notify admin about proof submission
      const adminUsers = await storage.getAdminUsers();
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "Proof of Work Needs Review",
          message: `Order #${order.orderNumber} has proof of work submitted and needs admin approval.`,
          type: "admin",
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error submitting proof of work:", error);
      res.status(500).json({ message: "Failed to submit proof of work" });
    }
  });

  // Admin approves or rejects proof of work
  app.patch('/api/admin/orders/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { approved, rejectionReason } = req.body;

      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "pending_approval") {
        return res.status(400).json({ message: "Order is not pending approval" });
      }

      if (approved) {
        // Approve order and pay publisher
        const publisherAmount = parseFloat(order.amount);
        
        await storage.updateOrder(id, {
          status: "payment_pending",
          adminApprovedBy: userId,
          adminApprovedAt: new Date(),
        });

        // Credit publisher's wallet
        await storage.updateWalletBalance(order.publisherId, publisherAmount.toString());

        // Create transaction for publisher
        await storage.createTransaction({
          userId: order.publisherId,
          orderId: id,
          type: "credit",
          amount: publisherAmount.toString(),
          description: `Payment for completed order #${order.orderNumber}`,
        });

        // Update order status to completed after payment release simulation
        setTimeout(async () => {
          await storage.updateOrder(id, { status: "completed" });
          
          // Notify publisher about payment
          await storage.createNotification({
            userId: order.publisherId,
            title: "Payment Received",
            message: `Payment of ₹${publisherAmount.toFixed(2)} has been transferred to your bank account for order #${order.orderNumber}. It will reflect within 24 hours.`,
            type: "payment",
          });
        }, 2000); // Simulate 24 hour payment processing

        // Notify publisher about pending payment
        await storage.createNotification({
          userId: order.publisherId,
          title: "Payment Pending",
          message: `Your order #${order.orderNumber} has been approved. Payment of ₹${publisherAmount.toFixed(2)} will be transferred to your bank account within 24 hours.`,
          type: "payment",
        });

        // Notify buyer about completion
        await storage.createNotification({
          userId: order.buyerId,
          title: "Order Completed",
          message: `Your order #${order.orderNumber} has been completed successfully. Check your post at ${order.postUrl}`,
          type: "order",
        });

      } else {
        // Reject order and refund buyer
        await storage.updateOrder(id, {
          status: "refunded",
          rejectionReason,
        });

        // Refund buyer
        const refundAmount = parseFloat(order.totalAmount);
        await storage.updateWalletBalance(order.buyerId, refundAmount.toString());

        // Create refund transaction
        await storage.createTransaction({
          userId: order.buyerId,
          orderId: id,
          type: "credit",
          amount: refundAmount.toString(),
          description: `Refund for rejected order #${order.orderNumber}`,
        });

        // Notify buyer about refund
        await storage.createNotification({
          userId: order.buyerId,
          title: "Order Refunded",
          message: `Your order #${order.orderNumber} has been refunded. Amount: $${refundAmount.toFixed(2)}`,
          type: "refund",
        });

        // Notify publisher about rejection
        await storage.createNotification({
          userId: order.publisherId,
          title: "Order Rejected",
          message: `Your proof of work for order #${order.orderNumber} was rejected. Reason: ${rejectionReason}`,
          type: "order",
        });
      }

      const updatedOrder = await storage.getOrderById(id);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error processing order approval:", error);
      res.status(500).json({ message: "Failed to process order approval" });
    }
  });

  // Get orders pending admin approval
  app.get('/api/admin/orders/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orders = await storage.getOrders({ status: "submitted" });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ message: "Failed to fetch pending orders" });
    }
  });

  // Auto-refund endpoint (to be called by cron job)
  app.post('/api/admin/process-auto-refunds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const overdueOrders = await storage.getOverdueOrders();
      const processedOrders = [];

      for (const order of overdueOrders) {
        // Auto-refund the order
        await storage.updateOrder(order.id, {
          status: "refunded",
          rejectionReason: "Auto-refunded due to 7-day deadline exceeded",
        });

        // Refund buyer
        const refundAmount = parseFloat(order.totalAmount);
        await storage.updateWalletBalance(order.buyerId, refundAmount.toString());

        // Create refund transaction
        await storage.createTransaction({
          userId: order.buyerId,
          orderId: order.id,
          type: "credit",
          amount: refundAmount.toString(),
          description: `Auto-refund for order #${order.orderNumber} (7-day deadline exceeded)`,
        });

        // Notify buyer about auto-refund
        await storage.createNotification({
          userId: order.buyerId,
          title: "Auto-Refund Processed",
          message: `Your order #${order.orderNumber} has been automatically refunded due to the 7-day deadline being exceeded. Amount: ₹${refundAmount.toFixed(2)}`,
          type: "refund",
        });

        // Notify publisher about auto-refund
        await storage.createNotification({
          userId: order.publisherId,
          title: "Order Auto-Refunded",
          message: `Order #${order.orderNumber} has been automatically refunded due to the 7-day deadline being exceeded.`,
          type: "order",
        });

        processedOrders.push(order);
      }

      res.json({ 
        message: `Processed ${processedOrders.length} auto-refunds`,
        processedOrders: processedOrders.length
      });
    } catch (error) {
      console.error("Error processing auto-refunds:", error);
      res.status(500).json({ message: "Failed to process auto-refunds" });
    }
  });

  // Get pending approval orders for admin
  app.get('/api/admin/orders/pending-approval', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orders = await storage.getOrders({ status: "pending_approval" });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching pending approval orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin approve/reject order
  app.patch('/api/admin/orders/:orderId/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orderId = parseInt(req.params.orderId);
      const { approved, rejectionReason } = req.body;

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (approved) {
        // Approve order - release payment to publisher
        const publisherAmount = parseFloat(order.amount);
        await storage.updateWalletBalance(order.publisherId, publisherAmount.toString());
        
        // Update order status to completed
        const updatedOrder = await storage.updateOrder(orderId, {
          status: "completed",
          completedAt: new Date(),
        });

        // Create transaction record for publisher
        await storage.createTransaction({
          userId: order.publisherId,
          amount: publisherAmount.toString(),
          type: "credit",
          description: `Payment received for order #${order.orderNumber}`,
          orderId: orderId,
        });

        // Create notification for publisher
        await storage.createNotification({
          userId: order.publisherId,
          title: "Payment Released",
          message: `Your payment of ₹${publisherAmount.toFixed(2)} for order #${order.orderNumber} has been released to your wallet.`,
          type: "payment",
          orderId: orderId,
        });

        res.json({ message: "Order approved and payment released", order: updatedOrder });
      } else {
        // Reject order - refund buyer
        const refundAmount = parseFloat(order.totalAmount);
        await storage.updateWalletBalance(order.buyerId, refundAmount.toString());
        
        // Update order status to refunded
        const updatedOrder = await storage.updateOrder(orderId, {
          status: "refunded",
          rejectionReason: rejectionReason,
          refundedAt: new Date(),
        });

        // Create transaction record for buyer
        await storage.createTransaction({
          userId: order.buyerId,
          amount: refundAmount.toString(),
          type: "credit",
          description: `Refund for rejected order #${order.orderNumber}`,
          orderId: orderId,
        });

        // Create notifications
        await storage.createNotification({
          userId: order.buyerId,
          title: "Order Refunded",
          message: `Your order #${order.orderNumber} has been rejected and refunded. Reason: ${rejectionReason}`,
          type: "refund",
          orderId: orderId,
        });

        await storage.createNotification({
          userId: order.publisherId,
          title: "Order Rejected",
          message: `Order #${order.orderNumber} has been rejected by admin. Reason: ${rejectionReason}`,
          type: "order_rejected",
          orderId: orderId,
        });

        res.json({ message: "Order rejected and buyer refunded", order: updatedOrder });
      }
    } catch (error) {
      console.error("Error approving/rejecting order:", error);
      res.status(500).json({ message: "Failed to process order approval" });
    }
  });

  app.patch('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Get order to verify ownership
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      if (user?.role === "publisher" && order.publisherId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (user?.role === "buyer" && order.buyerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedOrder = await storage.updateOrder(id, updates);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/admin/websites/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const websites = await storage.getPendingWebsites();
      res.json(websites);
    } catch (error) {
      console.error("Error fetching pending websites:", error);
      res.status(500).json({ message: "Failed to fetch pending websites" });
    }
  });

  app.patch('/api/admin/websites/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const website = await storage.approveWebsite(id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Notify publisher
      await storage.createNotification({
        userId: website.publisherId,
        title: "Website Approved",
        message: `Your website ${website.url} has been approved and is now live`,
        type: "approval",
      });

      res.json(website);
    } catch (error) {
      console.error("Error approving website:", error);
      res.status(500).json({ message: "Failed to approve website" });
    }
  });

  app.patch('/api/admin/websites/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const website = await storage.rejectWebsite(id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Notify publisher
      await storage.createNotification({
        userId: website.publisherId,
        title: "Website Rejected",
        message: `Your website ${website.url} has been rejected. Please review and resubmit.`,
        type: "rejection",
      });

      res.json(website);
    } catch (error) {
      console.error("Error rejecting website:", error);
      res.status(500).json({ message: "Failed to reject website" });
    }
  });

  // Get all orders for admin
  app.get('/api/admin/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Wallet and Payment routes
  app.get('/api/wallet/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ balance: user?.walletBalance || "0.00" });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: "Failed to fetch wallet balance" });
    }
  });

  // Development: Add fake money to wallet (for testing without Razorpay)
  app.post('/api/wallet/add-fake-money', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Add fake money for development
      const currentUser = await storage.getUser(userId);
      const currentBalance = parseFloat(currentUser?.walletBalance || "0");
      const newBalance = (currentBalance + parseFloat(amount)).toFixed(2);
      
      await storage.updateWalletBalance(userId, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "credit",
        amount: amount,
        description: "Fake money added for development",
        paymentMethod: "development",
        paymentId: `dev_${Date.now()}`
      });

      // Create notification
      await storage.createNotification({
        userId,
        title: "Fake Money Added",
        message: `₹${parseFloat(amount).toFixed(2)} fake money has been added to your wallet for testing.`,
        type: "payment",
      });

      res.json({ 
        success: true, 
        newBalance,
        message: "Fake money added successfully for development"
      });
    } catch (error) {
      console.error("Error adding fake money:", error);
      res.status(500).json({ message: "Failed to add fake money" });
    }
  });

  // Create Razorpay order for wallet funding
  app.post('/api/wallet/create-order', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Razorpay minimum amount is ₹1 (100 paise)
      if (parseFloat(amount) < 1) {
        return res.status(400).json({ message: "Minimum amount is ₹1" });
      }

      if (!razorpay) {
        return res.status(503).json({ message: "Payment service not configured" });
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise
        currency: "INR",
        receipt: `wallet_${userId}_${Date.now()}`
      });

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment and add funds to wallet
  app.post('/api/wallet/verify-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      console.log("Payment verification started for user:", userId);
      console.log("Payment data:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

      if (!razorpay) {
        console.error("Razorpay not configured");
        return res.status(503).json({ message: "Payment service not configured" });
      }

      // Verify payment signature
      const crypto = await import('crypto');
      const expected_signature = crypto.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      console.log("Signature verification:", { expected_signature, received_signature: razorpay_signature });

      if (expected_signature !== razorpay_signature) {
        console.error("Invalid payment signature");
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Verify payment with Razorpay
      console.log("Fetching payment details from Razorpay...");
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log("Payment status:", payment.status, "Amount:", payment.amount);
      
      if (payment.status !== 'captured') {
        console.error("Payment not captured, status:", payment.status);
        return res.status(400).json({ message: `Payment not captured. Status: ${payment.status}` });
      }

      // Add funds to user wallet
      const actualAmount = (Number(payment.amount) / 100).toFixed(2); // Convert from paise
      const currentUser = await storage.getUser(userId);
      const currentBalance = parseFloat(currentUser?.walletBalance || "0");
      const newBalance = (currentBalance + parseFloat(actualAmount)).toFixed(2);
      
      await storage.updateWalletBalance(userId, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "credit",
        amount: actualAmount,
        description: "Wallet funding via Razorpay",
        paymentMethod: "razorpay",
        paymentId: razorpay_payment_id
      });

      // Create notification
      await storage.createNotification({
        userId,
        title: "Funds Added",
        message: `₹${parseFloat(actualAmount).toFixed(2)} has been added to your wallet via Razorpay.`,
        type: "payment",
      });

      res.json({ 
        success: true, 
        newBalance,
        message: "Funds added successfully"
      });
    } catch (error) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ message: "Payment verification failed" });
    }
  });

  app.post('/api/wallet/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, bankDetails } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(userId);
      const currentBalance = parseFloat(user?.walletBalance || "0");
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct from wallet
      const newBalance = (currentBalance - withdrawAmount).toString();
      await storage.updateWalletBalance(userId, newBalance);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "debit",
        amount: amount.toString(),
        description: `Withdrawal to ${bankDetails?.accountNumber || 'bank account'}`,
        paymentMethod: "bank_transfer",
      });

      // Create notification
      await storage.createNotification({
        userId,
        title: "Withdrawal Processed",
        message: `$${withdrawAmount.toFixed(2)} withdrawal has been processed and will be credited to your bank account within 2-3 business days.`,
        type: "payment",
      });

      res.json({ 
        success: true, 
        newBalance,
        message: "Withdrawal processed successfully"
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  app.get('/api/wallet/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Razorpay payment routes
  app.post('/api/payment/create-order', isAuthenticated, async (req: any, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ message: "Payment service not configured. Please contact administrator." });
      }

      const userId = req.user.claims.sub;
      const { amount, currency = 'INR' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt: `order_${Date.now()}_${userId}`,
      };

      const order = await razorpay!.orders.create(options);
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  app.post('/api/payment/verify', isAuthenticated, async (req: any, res) => {
    try {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ message: "Payment service not configured. Please contact administrator." });
      }

      const userId = req.user.claims.sub;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const crypto = await import('crypto');
      const expected_signature = crypto.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (expected_signature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Payment verified successfully
      // Get cart items and create orders
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const orders = [];
      for (const item of cartItems) {
        const amount = parseFloat(item.website.pricePerPost);
        const platformFee = amount * 0.05;
        const totalAmount = amount + platformFee;

        const orderData = {
          buyerId: userId,
          publisherId: item.website.publisherId,
          websiteId: item.websiteId,
          amount: amount.toString(),
          platformFee: platformFee.toString(),
          totalAmount: totalAmount.toString(),
          needsContent: item.needsContent || false,
          status: "pending" as const,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        };

        const order = await storage.createOrder(orderData);
        orders.push(order);

        // Create transaction
        await storage.createTransaction({
          userId,
          orderId: order.id,
          type: "debit",
          amount: totalAmount.toString(),
          description: `Payment for website ${item.website.url}`,
        });

        // Notify publisher
        await storage.createNotification({
          userId: item.website.publisherId,
          title: "New Order Received",
          message: `You have received a new order for ${item.website.url}`,
          type: "order",
        });

        // Calculate publisher payment (95% after platform fee)
        const publisherAmount = amount * 0.95;
        await storage.updateWalletBalance(item.website.publisherId, publisherAmount.toString());
        
        // Create transaction for publisher
        await storage.createTransaction({
          userId: item.website.publisherId,
          orderId: order.id,
          type: "credit",
          amount: publisherAmount.toString(),
          description: `Earnings from website ${item.website.url}`,
        });
      }

      // Clear cart
      await storage.clearCart(userId);

      res.json({
        success: true,
        message: "Payment verified and orders created",
        orders,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
