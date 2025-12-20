import React from "react";
import { Sidebar } from "./Sidebar";
import { AnimatedBackground } from "../ui/animated-background";

export function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen relative">
      {/* Subtle animated background for app pages */}
      <AnimatedBackground variant="subtle" />

      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300 relative z-10">
        {children}
      </main>
    </div>
  );
}


