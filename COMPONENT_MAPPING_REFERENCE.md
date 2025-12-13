# Component Mapping Reference
## Quick Reference for Lovable Redesign Integration

This document provides a quick reference for mapping old components to new Lovable components during migration.

---

## 🔄 Direct Replacements

### Layout Components

| Old Component | New Component | Location | Notes |
|--------------|---------------|----------|-------|
| `Header.jsx` | `TopBar.tsx` + `Sidebar.tsx` | `components/layout/` | Split into two components |
| (None) | `AppLayout.tsx` | `components/layout/` | New wrapper component |

### UI Primitives

| Old Component | New Component | Location | Prop Changes |
|--------------|---------------|----------|--------------|
| `GlassCard.jsx` | `glass-card.tsx` | `components/ui/` | `padding` → `size` |
| `GlassButton.jsx` | `glass-button.tsx` | `components/ui/` | Similar API, verify variants |
| `Card.jsx` | `card.tsx` | `components/ui/` | shadcn Card (different API) |
| `Button.jsx` | `button.tsx` | `components/ui/` | shadcn Button (different API) |
| `Modal.jsx` | `dialog.tsx` | `components/ui/` | shadcn Dialog (different API) |
| `LoadingSpinner.jsx` | `loading-spinner.tsx` | `components/ui/` | Verify props match |

### Dashboard Components

| Old (Inline) | New Component | Location | Data Source |
|-------------|---------------|----------|-------------|
| Quick Stats (inline) | `QuickStats.tsx` | `components/dashboard/` | `usePortfolio()` |
| Recent Activity (inline) | `RecentActivity.tsx` | `components/dashboard/` | `usePortfolio()` transactions |
| Learning Progress (inline) | `LearningProgress.tsx` | `components/dashboard/` | `useEducation()` |
| Quick Actions (inline) | `QuickActions.tsx` | `components/dashboard/` | Static links |
| `PortfolioChart` | `PortfolioChart.tsx` | `components/dashboard/` | Verify props |
| `MarketTicker` | `MarketTicker.tsx` | `components/dashboard/` | Verify API |
| `LeaderboardWidget` | `LeaderboardWidget.tsx` | `components/dashboard/` | Verify data source |

---

## 📝 Prop Mapping Guide

### GlassCard Props

**Old API:**
```jsx
<GlassCard 
  variant="default"
  padding="large"
  shadow="xl"
  interactive={true}
  glow={true}
/>
```

**New API:**
```jsx
<GlassCard 
  variant="default"  // Same
  size="lg"          // padding → size
  className="..."    // shadow/interactive/glow via className
/>
```

**Migration:**
- `padding="large"` → `size="lg"`
- `padding="default"` → `size="default"`
- `padding="small"` → `size="sm"`
- `shadow` → Remove, use className
- `interactive` → Add `className="cursor-pointer hover:..."` 
- `glow` → Add `className="..."` with glow classes

### GlassButton Props

**Old API:**
```jsx
<GlassButton 
  variant="primary"
  size="default"
  loading={false}
  as={Link}
  to="/dashboard"
/>
```

**New API:**
```jsx
<GlassButton 
  variant="default"  // primary → default
  size="default"    // Same
  loading={false}   // Same
  asChild={true}    // as → asChild
>
  <Link to="/dashboard">...</Link>
</GlassButton>
```

**Migration:**
- `variant="primary"` → `variant="default"`
- `as={Link}` → `asChild={true}` with Link as child
- Other variants should map directly

### Card Props (shadcn)

**Old API:**
```jsx
<Card padding="large" shadow="xl">
  {children}
</Card>
```

**New API:**
```jsx
<Card className="p-8 shadow-xl">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>
```

**Migration:**
- Use `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` subcomponents
- Move padding/shadow to className

### Button Props (shadcn)

**Old API:**
```jsx
<Button variant="primary" size="lg">
  Click me
</Button>
```

**New API:**
```jsx
<Button variant="default" size="lg">
  Click me
</Button>
```

**Migration:**
- `variant="primary"` → `variant="default"`
- Other variants should map directly

---

## 🔌 Context/Hook Replacements

### React Query → Existing Contexts

| Lovable (React Query) | Current (Context) | Location |
|----------------------|-------------------|----------|
| `useQuery(["portfolio"])` | `usePortfolio()` | `hooks/usePortfolio.js` |
| `useQuery(["user"])` | `useAuth()` | `contexts/AuthContext.js` |
| `useQuery(["education"])` | `useEducation()` | `contexts/EducationContext.jsx` |
| `useQuery(["market"])` | `useAlphaVantageData()` | `hooks/useAlphaVantageData.js` |
| `useQuery(["leaderboard"])` | `useLeaderboard()` | `contexts/LeaderboardContext.jsx` |

### Example Conversion

**Before (Lovable with React Query):**
```typescript
import { useQuery } from "@tanstack/react-query";

export function QuickStats() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio
  });
  
  if (isLoading) return <Loading />;
  return <div>{portfolio.totalValue}</div>;
}
```

**After (Current with Context):**
```javascript
import { usePortfolio } from "../../hooks/usePortfolio";

export function QuickStats() {
  const { portfolio, loading } = usePortfolio();
  
  if (loading) return <Loading />;
  return <div>{portfolio.totalValue}</div>;
}
```

---

## 📍 Import Path Changes

### Lovable Imports
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
```

### Current Imports (After Migration)
```javascript
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { cn } from "../../utils/cn";
```

**Migration Steps:**
1. Replace `@/` with relative paths
2. Update file extensions (`.tsx` → `.jsx`)
3. Verify all imports resolve correctly

---

## 🎨 Styling Class Mappings

### Tailwind Classes

| Lovable Class | Current Class | Notes |
|--------------|---------------|-------|
| `bg-card` | `bg-white/10` | May need custom CSS variable |
| `text-card-foreground` | `text-white` | May need custom CSS variable |
| `text-muted-foreground` | `text-white/70` | May need custom CSS variable |
| `border-border` | `border-white/20` | May need custom CSS variable |
| `glass-card` | Custom class | Verify class exists in CSS |

**Action:** Merge Tailwind configs to ensure all classes work.

---

## 🧩 Component Composition Examples

### Dashboard Quick Stats

**Old (Inline in DashboardPage):**
```jsx
<div className="grid grid-cols-4 gap-4">
  {quickStats.map(stat => (
    <GlassCard>
      <h3>{stat.label}</h3>
      <p>{stat.value}</p>
    </GlassCard>
  ))}
</div>
```

**New (Extracted Component):**
```jsx
import { QuickStats } from "../components/dashboard/QuickStats";

<QuickStats stats={portfolioMetrics} />
```

### Recent Activity

**Old (Inline):**
```jsx
<div>
  {recentActivity.map(activity => (
    <div>{activity.title}</div>
  ))}
</div>
```

**New (Extracted Component):**
```jsx
import { RecentActivity } from "../components/dashboard/RecentActivity";

<RecentActivity activities={recentActivity} />
```

---

## ✅ Verification Checklist

### For Each Component Migration:

- [ ] Component copied from Lovable
- [ ] TypeScript converted to JavaScript
- [ ] Imports updated (relative paths)
- [ ] Props API verified/compatible
- [ ] Contexts/hooks replaced (React Query → existing)
- [ ] Styling verified
- [ ] Component tested in isolation
- [ ] Integrated into page
- [ ] Page tested end-to-end

### For Each Page Migration:

- [ ] Page structure copied
- [ ] All components converted
- [ ] All hooks/contexts preserved
- [ ] All API calls work
- [ ] Navigation works
- [ ] Forms work
- [ ] Data displays correctly
- [ ] No console errors
- [ ] Responsive design works

---

## 🚀 Quick Start Commands

### 1. Create Branch
```bash
git checkout -b redesign-lovable
```

### 2. Install Dependencies
```bash
cd frontend
npm install @radix-ui/react-dialog @radix-ui/react-toast \
  class-variance-authority clsx tailwind-merge
```

### 3. Copy Utility
```bash
# Copy lib/utils.ts → utils/cn.js
# Convert TypeScript to JavaScript
```

### 4. Convert Component
```bash
# Copy component from Lovable
# Convert .tsx → .jsx
# Update imports
# Test component
```

### 5. Integrate Component
```bash
# Update imports in page
# Test page
# Verify functionality
```

---

**Last Updated:** January 2025

