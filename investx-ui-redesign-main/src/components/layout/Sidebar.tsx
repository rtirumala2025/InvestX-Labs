import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Lightbulb,
  LineChart,
  MessageSquare,
  GraduationCap,
  Users,
  User,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Portfolio", path: "/portfolio", icon: <Briefcase className="h-5 w-5" /> },
  { label: "AI Insights", path: "/suggestions", icon: <Sparkles className="h-5 w-5" />, badge: "New" },
  { label: "Simulation", path: "/simulation", icon: <LineChart className="h-5 w-5" /> },
  { label: "AI Chat", path: "/chat", icon: <MessageSquare className="h-5 w-5" /> },
];

const learnNavItems: NavItem[] = [
  { label: "Education", path: "/education", icon: <GraduationCap className="h-5 w-5" /> },
  { label: "Clubs", path: "/clubs", icon: <Users className="h-5 w-5" /> },
];

const profileNavItems: NavItem[] = [
  { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
  { label: "Leaderboard", path: "/leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { label: "Achievements", path: "/achievements", icon: <Award className="h-5 w-5" /> },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavSection = ({
    title,
    items,
  }: {
    title?: string;
    items: NavItem[];
  }) => (
    <div className="space-y-1">
      {title && !collapsed && (
        <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = location.pathname === item.path || 
          (item.path !== "/" && location.pathname.startsWith(item.path));
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-3"
            )}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-sidebar-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-sidebar-primary">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between px-5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-teal-400">
              <span className="text-xl font-bold text-sidebar-primary-foreground">X</span>
            </div>
            <div>
              <p className="text-lg font-bold text-sidebar-foreground">InvestX</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40">Labs</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-8 custom-scrollbar">
        <NavSection items={mainNavItems} />
        <NavSection title="Learn" items={learnNavItems} />
        <NavSection title="Account" items={profileNavItems} />
      </nav>

      {/* User */}
      <div className="p-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl bg-sidebar-accent p-3",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sidebar-primary/50 to-teal-500/50 flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">Alex Johnson</p>
              <p className="text-[11px] text-sidebar-foreground/50">Free Plan</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
