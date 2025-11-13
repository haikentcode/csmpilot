"use client";

import Header from "./Header";
import ChatDock from "./ChatDock";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-off-white font-poppins">
        {/* Header */}

        {/* Main Content */}
        <main className="pt-16">
          <div className="px-6 py-8">{children}</div>
        </main>

        {/* AI Chat Dock */}
        <ChatDock />
      </div>
    </>
  );
}
