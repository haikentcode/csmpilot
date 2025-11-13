"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Insights", href: "/insights", icon: TrendingUp },
  { label: "My Customers", href: "/customers", icon: Users },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Reports", href: "/reports", icon: FileText },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    // Clear any stored session data
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    // Redirect to login page
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image
            src="/datapiper-logo.svg"
            alt="DataPiper Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-xl font-bold text-dark-forest">DataPiper</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-dark-forest bg-gray-100"
                    : "text-gray-600 hover:text-dark-forest hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-dark-forest hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center">
            <span className="text-white font-semibold text-sm">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
