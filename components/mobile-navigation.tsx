"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  BookOpen, 
  BarChart3, 
  User,
  Settings,
  LogOut,
  ChevronRight,
  Play,
  Clock,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Your learning overview"
  },
  {
    href: "/roadmap",
    label: "Learning Roadmap",
    icon: BookOpen,
    description: "Personalized learning path"
  },
  {
    href: "/assessment",
    label: "Assessment",
    icon: BarChart3,
    description: "Test your skills"
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    description: "Your settings and progress"
  }
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">LearnHub</h1>
              <p className="text-xs text-gray-600">
                Welcome, {user?.firstName || "Learner"}
              </p>
            </div>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg transition-colors hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
                {/* User Profile Section */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user?.fullName || "User"}</h3>
                      <p className="text-sm text-white/80">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
                          "hover:scale-105 hover:shadow-md",
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          isActive ? "bg-blue-100" : "bg-gray-100"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    );
                  })}
                </div>

                {/* Stats Section */}
                <div className="p-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Play className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Videos</p>
                      <p className="text-lg font-bold text-blue-600">12</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Time</p>
                      <p className="text-lg font-bold text-green-600">4.5h</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Score</p>
                      <p className="text-lg font-bold text-purple-600">85%</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleNavigation("/profile")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-20" />
    </div>
  );
}