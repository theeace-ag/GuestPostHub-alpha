# LinkConnect - Guest Post Marketplace

## Overview

LinkConnect is a comprehensive guest post marketplace platform that connects advertisers (buyers) with high-authority website publishers. The platform operates as a two-sided marketplace with three distinct user roles: buyers, publishers, and administrators. Built as a full-stack web application using modern technologies, it provides a complete solution for the SEO and content marketing industry.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build System**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with role-based access control

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Type-safe schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### User Management
- Three-role system: buyers, publishers, and administrators
- Role-based dashboard rendering and navigation
- Secure authentication flow with Replit Auth integration
- User profile management with role-specific features

### Website Marketplace
- Website listing and browsing functionality
- Advanced filtering system (category, domain authority, price range, language)
- Search capabilities across website listings
- Category-based organization of websites
- Approval workflow for publisher submissions

### Order Management
- Shopping cart functionality for buyers
- Order creation and status tracking
- Multi-status order workflow (pending, in_progress, completed, disputed, cancelled)
- Content writing service options
- Payment integration ready (wallet-based system)

### Admin Panel
- Comprehensive dashboard for platform oversight
- User management and moderation tools
- Website approval and rejection system
- Order monitoring and dispute resolution
- Analytics and reporting capabilities

## Data Flow

### User Authentication Flow
1. User selects role (buyer/publisher) during signup
2. Replit Auth handles authentication with OpenID Connect
3. User role is stored and validated on subsequent requests
4. Role-based redirects to appropriate dashboards

### Website Submission Flow
1. Publishers submit website details through form
2. Admin reviews and approves/rejects submissions
3. Approved websites appear in marketplace
4. Buyers can browse and filter available websites

### Order Processing Flow
1. Buyers add websites to shopping cart
2. Optional content writing service selection
3. Checkout process with payment method selection
4. Order creation and status tracking
5. Publisher fulfillment and completion

## External Dependencies

### Authentication
- **Replit Auth**: Primary authentication provider
- **OpenID Connect**: Standard authentication protocol
- **Session Storage**: PostgreSQL-backed session management

### Database
- **Neon**: Serverless PostgreSQL hosting
- **WebSocket**: Real-time database connections

### Development Tools
- **Replit Platform**: Development environment integration
- **Vite Plugins**: Runtime error overlay and cartographer for debugging

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server with automatic TypeScript compilation
- Environment-specific configuration handling
- Replit-specific development tools integration

### Production Build
- Client-side build with Vite bundler
- Server-side build with esbuild for Node.js
- Static asset serving from Express
- Environment variable configuration for database and auth

### Database Management
- Drizzle migrations for schema changes
- Connection pooling for scalability
- Environment-based database URL configuration

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 02, 2025. Migration from Replit Agent to Replit environment completed
  - Fixed database sessions configuration
  - Set up PostgreSQL with proper schema
  - Made Razorpay payment integration optional for development
  - Created distinct role-based dashboards (buyer vs publisher)
  - Fixed navigation component nested link issues
  - Added sample categories for testing
- July 03, 2025. Account type selection and admin features implemented
  - Fixed website submission data type conversion issue (price field)
  - Added account type selection modal during signup process
  - Created dev team portal for website approvals (/dev-portal)
  - Enhanced user schema with hasSelectedRole and roleChangeCount fields
  - Implemented role change restrictions (only once from settings)
  - Added comprehensive admin API endpoints for website approval workflow
  - Created temporary admin user for testing system
- July 03, 2025. Real money Razorpay integration and security implementation
  - CRITICAL: Implemented real Razorpay API integration for wallet funding
  - CRITICAL: Fixed data isolation issues preventing cross-user data leakage
  - CRITICAL: Added comprehensive publisher order notification system
  - Enhanced security with proper payment verification and encrypted storage
  - Fixed publisher dashboard to show incoming orders properly
  - Implemented proper user-specific data filtering across all endpoints
- July 03, 2025. Migration to Replit environment and payment system fixes
  - Successfully migrated project from Replit Agent to Replit environment
  - Fixed PostgreSQL database configuration and sessions table setup
  - Configured Razorpay API keys for real payment processing
  - Added minimum amount validation (₹1) for Razorpay payment orders
  - Fixed authentication flow and session management issues
  - Updated currency display from USD to INR throughout the application
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```