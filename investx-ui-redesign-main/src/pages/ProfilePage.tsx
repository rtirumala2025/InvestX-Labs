import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Camera,
  Shield,
  Bell,
  Palette,
  Trophy,
  TrendingUp,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";

const mockUser = {
  name: "Alex Investor",
  email: "alex@example.com",
  avatar: null,
  joinDate: "January 2024",
  stats: {
    totalTrades: 156,
    profitableTrades: 98,
    totalReturns: 14.5,
    streak: 7,
    achievements: 12,
  },
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  return (
    <div className="min-h-screen">
      <TopBar
        title="Profile"
        subtitle="Manage your account and preferences"
      />

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <GlassCard variant="elevated" className="animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">{mockUser.name}</h2>
              <p className="text-muted-foreground">{mockUser.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member since {mockUser.joinDate}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-positive">
                  +{mockUser.stats.totalReturns}%
                </p>
                <p className="text-xs text-muted-foreground">Returns</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {mockUser.stats.totalTrades}
                </p>
                <p className="text-xs text-muted-foreground">Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">
                  {mockUser.stats.achievements}
                </p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Account Information
                </h3>
                {isEditing ? (
                  <div className="flex gap-2">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="glow"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </GlassButton>
                  </div>
                ) : (
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </GlassButton>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed 30 days ago
                    </p>
                  </div>
                  <GlassButton variant="outline" size="sm">
                    Change
                  </GlassButton>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <GlassButton variant="glow" size="sm">
                    Enable
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { label: "AI Suggestions", description: "Get notified about new AI recommendations" },
                  { label: "Price Alerts", description: "Alerts when stocks hit your target prices" },
                  { label: "Market News", description: "Daily market summary and breaking news" },
                  { label: "Learning Reminders", description: "Reminders to continue your courses" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-border bg-muted accent-primary"
                    />
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="h-8 w-8 rounded-full bg-background border-2 border-primary" />
                    <button className="h-8 w-8 rounded-full bg-gray-800 border-2 border-transparent" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
