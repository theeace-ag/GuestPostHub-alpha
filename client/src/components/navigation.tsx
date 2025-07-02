import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, ShoppingCart, Wallet, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated && user?.role === "buyer",
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead)?.length || 0;
  const cartCount = cartItems?.length || 0;

  const getNavLinks = () => {
    if (!isAuthenticated) return [];
    
    switch (user?.role) {
      case 'buyer':
        return [
          { href: '/buyer', label: 'Browse Websites', active: location === '/buyer' },
          { href: '/orders', label: 'My Orders', active: location === '/orders' },
        ];
      case 'publisher':
        return [
          { href: '/publisher', label: 'Dashboard', active: location === '/publisher' },
          { href: '/website-submission', label: 'Add Website', active: location === '/website-submission' },
          { href: '/orders', label: 'Orders', active: location === '/orders' },
        ];
      case 'admin':
        return [
          { href: '/admin', label: 'Dashboard', active: location === '/admin' },
          { href: '/orders', label: 'All Orders', active: location === '/orders' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">LinkConnect</h1>
              </Link>
            </div>
            {navLinks.length > 0 && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                        link.active 
                          ? 'text-primary border-b-2 border-primary' 
                          : 'text-gray-500 hover:text-primary'
                      }`}>
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance */}
                <div className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-primary">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">${user?.walletBalance || '0.00'}</span>
                </div>

                {/* Shopping Cart (Buyers only) */}
                {user?.role === 'buyer' && (
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="relative p-2">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          variant="destructive"
                        >
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                )}

                {/* Notifications */}
                <div className="relative">
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        variant="destructive"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ''} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden md:block">
                        {user?.firstName || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href="/api/logout" className="w-full">Logout</a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => window.location.href = '/api/login'}>
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = '/api/login'}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
