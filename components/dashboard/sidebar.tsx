"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Home,
  Package,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  Database,
  ChartBarBig,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ClientCollapsible as Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/client-collapsible";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

// Route interfeyslari
interface BaseRoute {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface RouteWithChildren extends BaseRoute {
  children: Omit<BaseRoute, "icon">[];
}

type RouteType = BaseRoute | RouteWithChildren;

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
    window.dispatchEvent(new Event("sidebarStateChange"));
  }, [isCollapsed]);

  // Ensure collapsible state is properly initialized after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpenGroups((prev) => [...prev]);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleGroup = (label: string) => {
    console.log("Toggling group:", label);
    console.log("Current openGroups:", openGroups);

    setOpenGroups((prev) => {
      const newState = prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label];
      console.log("New openGroups state:", newState);
      return newState;
    });
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("children" in route &&
        route.children.some((child) => child.label.toLowerCase().includes(searchQuery.toLowerCase()))),
  );

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-30 h-screen bg-background shadow-sm border-r transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Fixed Header */}
      <div className="flex h-14 items-center border-b px-4 flex-shrink-0">
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-2 font-bold", isCollapsed ? "justify-center" : "text-xl")}
        >
          {isCollapsed ? (
            <span className="text-primary font-bold">A</span>
          ) : (
            <>
              <span className="text-primary">Admin</span>
              <span>Panel</span>
            </>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", isCollapsed && "rotate-180")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-grow overflow-y-auto py-2 px-2 scrollbar-thin">
        <TooltipProvider>
          {filteredRoutes.map((route, i) => {
            if ("children" in route) {
              return (
                <Collapsible
                  key={i}
                  open={!isCollapsed && openGroups.includes(route.label)}
                  onOpenChange={() => !isCollapsed && toggleGroup(route.label)}
                  className={isCollapsed ? "flex justify-center" : ""}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isCollapsed) toggleGroup(route.label);
                      }}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        isCollapsed ? "justify-center w-10 h-10 p-0 mx-auto" : "w-full justify-between",
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <route.icon className="h-4 w-4" />
                            {!isCollapsed && route.label}
                          </div>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">{route.label}</TooltipContent>}
                      </Tooltip>
                      {!isCollapsed && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            openGroups.includes(route.label) && "rotate-90",
                          )}
                        />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent className="pl-6 pt-1">
                      {route.children.map((child, j) => (
                        <Link
                          key={j}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                            pathname === child.href && "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            }

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Link
                    href={route.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent",
                      pathname === route.href && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isCollapsed && "justify-center w-10 h-10 p-0 mx-auto",
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {!isCollapsed && route.label}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">{route.label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Fixed Footer */}
      <div className="p-4 border-t flex-shrink-0">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

const routes: RouteType[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "Category",
    icon: ChartBarBig,
    href: "/dashboard/services/category",
  },
  {
    label: "Service",
    icon: Package,
    href: "/dashboard/services/service",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/dashboard/orders",
  },
  {
    label: "Payment",
    icon: CreditCard,
    href: "/dashboard/payment",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
  },
  {
    label: "API",
    icon: Database,
    href: "/dashboard/api",
  },
];