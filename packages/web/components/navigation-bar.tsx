'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Cloud, 
  CreditCard, 
  Settings, 
  LifeBuoy, 
  ChevronDown,
  Key,
  Server
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

// Added profile type
type UserProfile = {
  subscription?: {
    type: 'lifetime' | 'cloud' | null;
    active: boolean;
  };
};

// Auth context for subscription info
const AuthContext = React.createContext<{
  user: UserProfile | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

// Custom hook to easily access auth context
export const useAuth = () => React.useContext(AuthContext);

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  current?: boolean;
  requiresSubscription?: 'lifetime' | 'cloud' | boolean;
}

export function NavigationBar() {
  const pathname = usePathname();
  
  // In a real app, this would come from your auth context
  // Simulating auth context for demo purposes
  const { user } = useAuth?.() || { 
    user: {
      subscription: {
        type: pathname?.includes('/dashboard/lifetime') ? 'lifetime' : 'cloud',
        active: true
      }
    }
  };
  
  // Base navigation items always shown
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" />, current: pathname === '/dashboard' },
    { 
      name: 'Sync', 
      href: '/dashboard/sync', 
      icon: <Cloud className="h-5 w-5" />, 
      current: pathname?.includes('/dashboard/sync') 
    },
    { 
      name: 'Pricing', 
      href: '/dashboard/pricing', 
      icon: <CreditCard className="h-5 w-5" />, 
      current: pathname?.includes('/dashboard/pricing') 
    },
  ];
  
  // Conditional navigation items based on subscription type
  if (user?.subscription?.type === 'lifetime') {
    navigation.push({
      name: 'Self-Hosting',
      href: '/dashboard/lifetime',
      icon: <Server className="h-5 w-5" />,
      current: pathname?.includes('/dashboard/lifetime'),
      requiresSubscription: 'lifetime'
    });
  }
  
  if (user?.subscription?.type === 'cloud') {
    navigation.push({
      name: 'API Key',
      href: '/dashboard/api-key',
      icon: <Key className="h-5 w-5" />,
      current: pathname?.includes('/dashboard/api-key'),
      requiresSubscription: 'cloud'
    });
  }
  
  // Settings and help are always shown at the end
  navigation.push(
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: <Settings className="h-5 w-5" />, 
      current: pathname?.includes('/dashboard/settings') 
    },
    { 
      name: 'Help', 
      href: 'https://discord.gg/udQnCRFyus', 
      icon: <LifeBuoy className="h-5 w-5" />, 
      current: false 
    }
  );

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto flex items-center space-x-2">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.name === 'Help' ? "_blank" : undefined}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md relative",
                item.current ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon}
              <span className="ml-2">{item.name}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500 text-white text-xs justify-center items-center">
                    {item.badge}
                  </span>
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation - Just show as a dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Menu
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navigation.map((item) => (
                <DropdownMenuItem key={item.name} className="cursor-pointer" asChild>
                  <Link 
                    href={item.href} 
                    target={item.name === 'Help' ? "_blank" : undefined}
                    className="flex items-center w-full"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
