"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plug,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Integrations", href: "/integrations", icon: Plug },
  // { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear any stored auth data if needed
    localStorage.removeItem("sidebar-collapsed");
    // Redirect to login page
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center",
            collapsed ? "justify-center w-full" : "space-x-3"
          )}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/datapiper-logo.svg"
              alt="DataPiper Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-dark-forest">
              DataPiper
            </span>
          )}
        </Link>
      </div>

    

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium",
                active
                  ? "bg-primary-green text-white shadow-md"
                  : "text-primary-green bg-white hover:shadow-sm",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  active
                    ? "text-white"
                    : "text-primary-green"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-semibold whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

        {/* Logout Button */}
        <div className="px-4 pb-4">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-semibold whitespace-nowrap">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white text-primary-green hover:bg-primary-green transition-all duration-200 font-medium shadow-sm cursor-pointer",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
