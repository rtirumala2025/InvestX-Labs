import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AnimatedBackground } from "@/components/ui/animated-background";

export function AppLayout() {
  return (
    <div className="flex min-h-screen relative">
      {/* Subtle animated background for app pages */}
      <AnimatedBackground variant="subtle" />
      
      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
