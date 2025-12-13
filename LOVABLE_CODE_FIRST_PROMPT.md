# InvestX Labs - Code-First Redesign Prompt for Lovable

## Project Context

You are redesigning the UI components for **InvestX Labs**, an investment education and portfolio management platform. This is a **code-first redesign** - you must generate fully functional React components based on the existing codebase structure, props, state management, and API integrations. **Do not include any design specifications** - generate all styling, layout, and visual design autonomously.

---

## Codebase Structure

### File Organization
```
frontend/src/
├── pages/              # Page components (routes)
├── components/         # Reusable components
│   ├── ui/            # Base UI components
│   ├── portfolio/     # Portfolio-specific
│   ├── simulation/    # Simulation-specific
│   ├── chat/         # Chat components
│   ├── education/    # Education components
│   ├── ai-suggestions/ # AI suggestion components
│   ├── dashboard/    # Dashboard widgets
│   ├── leaderboard/  # Leaderboard components
│   └── common/       # Shared utilities
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── services/         # API services
└── utils/            # Utility functions
```

### Routing Structure (React Router v6)
All routes are defined in `App.jsx`. Pages to redesign:
- `/dashboard` - DashboardPage
- `/portfolio` - PortfolioPage
- `/suggestions` - SuggestionsPage
- `/simulation` - SimulationPage
- `/chat` - ChatPage
- `/education` - EducationPage
- `/clubs` - ClubsPage
- `/clubs/:clubId` - ClubDetailPage
- `/profile` - ProfilePage
- `/leaderboard` - LeaderboardPage
- `/achievements` - AchievementsPage
- `/onboarding` - OnboardingPage
- `/diagnostic` - DiagnosticPage
- `/login` - LoginPage
- `/signup` - SignupPage
- `/forgot-password` - ForgotPasswordPage
- `/reset-password` - ResetPasswordPage
- `/verify-email` - VerifyEmailPage
- `/privacy` - PrivacyPage
- `/education/lessons/:lessonId` - LessonView

---

## Core Hooks & Contexts (PRESERVE ALL USAGE)

### Contexts
1. **AuthContext** (`contexts/AuthContext.js`)
   - `currentUser` - User object with profile
   - `loading` - Auth loading state
   - `updateProfile(profileData)` - Update user profile
   - `signOut()` - Sign out user
   - Usage: `const { currentUser, updateProfile, signOut } = useAuth()`

2. **PortfolioContext** (`contexts/PortfolioContext.js`)
   - `portfolio` - Portfolio object
   - `holdings` - Array of holdings
   - `transactions` - Array of transactions
   - `reloadPortfolio()` - Reload portfolio data
   - `updatePortfolioMetrics(metrics)` - Update metrics
   - Usage: `const { portfolio, holdings, reloadPortfolio } = usePortfolioContext()`

3. **SimulationContext** (`contexts/SimulationContext.js`)
   - `portfolio` - Simulation portfolio
   - `virtualBalance` - Available cash
   - `holdings` - Simulation holdings
   - `transactions` - Simulation transactions
   - `buyStock(symbol, shares, price)` - Execute buy
   - `sellStock(symbol, shares, price)` - Execute sell
   - `resetSimulation()` - Reset to $10,000
   - `undoLastTrade()` - Undo last transaction
   - `canUndo` - Boolean if undo available
   - Usage: `const { virtualBalance, buyStock, sellStock } = useSimulation()`

4. **EducationContext** (`contexts/EducationContext.js`)
   - `courses` - Array of courses
   - `modules` - Object mapping courseId to modules
   - `lessons` - Object mapping moduleId to lessons
   - `progress` - Object mapping lessonId to status
   - `refreshEducation()` - Refresh data
   - Usage: `const { courses, modules, lessons, progress } = useEducation()`

5. **AchievementsContext** (`contexts/AchievementsContext.js`)
   - `achievements` - Array of achievements
   - `loading` - Loading state
   - Usage: `const { achievements } = useAchievements()`

6. **AppContext** (`contexts/AppContext.js`)
   - `queueToast(message, variant)` - Show toast notification
   - Usage: `const { queueToast } = useApp()`

7. **MarketContext** (`contexts/MarketContext.js`)
   - Wraps pages that need market data
   - Usage: Wrap page with `<MarketProvider>`

### Custom Hooks
1. **usePortfolio()** (`hooks/usePortfolio.js`)
   - Returns: `{ portfolio, holdings, transactions, loading, error }`
   - Fetches portfolio data from Supabase

2. **useAlphaVantageData(holdings)** (`hooks/useAlphaVantageData.js`)
   - Returns: `{ portfolioMetrics, marketData, loading, error, lastUpdated, refreshData, isDataStale }`
   - Fetches live market data for holdings

3. **useAISuggestions()** (`hooks/useAISuggestions.js`)
   - Returns: `{ suggestions, loading, error, refresh, dismissSuggestion(id), viewSuggestion(id), getExplanation(id), recordFeedback(id, rating), updateConfidence(id, confidence), recordInteraction(id, type, data) }`
   - Manages AI suggestions state

4. **useAuth()** (`hooks/useAuth.js`)
   - Returns: `{ currentUser, loading, signOut, updateProfile }`
   - Authentication state

5. **useEducation()** (`contexts/EducationContext.js`)
   - Returns: `{ courses, modules, lessons, progress, loading, error, refreshEducation }`

6. **useAchievements()** (`contexts/AchievementsContext.js`)
   - Returns: `{ achievements, loading, error }`

7. **useSimulation()** (`contexts/SimulationContext.js`)
   - Returns: `{ portfolio, virtualBalance, holdings, transactions, loading, error, buyStock, sellStock, resetSimulation, undoLastTrade, canUndo }`

---

## API Services (PRESERVE ALL CALLS)

### Supabase
- **Client**: `import { supabase } from '../services/supabase/config'`
- **Auth**: `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`
- **Database**: `supabase.from('table_name').select()`, `.insert()`, `.update()`, `.delete()`
- **Storage**: `supabase.storage.from('bucket').upload()`, `.getPublicUrl()`
- **Real-time**: `supabase.channel('channel').on('postgres_changes', callback).subscribe()`

### Alpha Vantage
- **Service**: `import { getMarketData, getBatchMarketData } from '../services/market/marketService'`
- **Hook**: `useAlphaVantageData(holdings)` - Automatically fetches prices

### OpenRouter AI
- **Service**: `import { getAIRecommendations, getMarketInsights, fetchSuggestionLogs } from '../services/api/aiService'`
- Used for AI chat, suggestions, and explanations

### Portfolio Calculations
- **Service**: `import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations'`
- Calculates gains, losses, diversification, sector allocation

---

## Page Components - Detailed Specifications

### 1. DashboardPage (`/dashboard`)

**Location**: `pages/DashboardPage.jsx`

**Wrapper**: Wrapped with `<MarketProvider>`

**Imports**:
```javascript
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import { useEducation } from '../contexts/EducationContext';
import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations';
import { useApp } from '../contexts/AppContext';
import LeaderboardWidget from '../components/leaderboard/LeaderboardWidget';
import MarketTicker from '../components/market/MarketTicker'; // lazy loaded
import PortfolioChart from '../components/portfolio/PortfolioChart'; // lazy loaded
```

**State**:
- `selectedChartTimeframe` - String: '1D', '1W', '1M', '3M', '1Y', 'ALL'

**Data Hooks**:
- `const { currentUser } = useAuth()`
- `const { portfolio, holdings, transactions, loading, error } = usePortfolio()`
- `const { portfolioMetrics: liveMetrics, marketData, loading: marketLoading, error: marketError } = useAlphaVantageData(holdings || [])`
- `const { progress: educationProgress, lessons } = useEducation()`
- `const { queueToast } = useApp()`

**Computed Values**:
- `portfolioMetrics` - Memoized from `liveMetrics` or calculated from `holdings` using `calculatePerformanceMetrics()`
- `learningProgress` - Percentage from `educationProgress` and `lessons`
- `quickStats` - Array of 4 stat objects: `{ label, value, change, positive }`
- `recentActivity` - Array from `transactions` or `userProfile.completedLessons`, formatted with `formatTimeAgo()`
- `quickActions` - Array of 4 action objects: `{ title, description, icon, link, color }`

**Conditional Rendering**:
- If `loading`: Show skeleton loaders
- If `error`: Show error state with retry button
- If no portfolio/holdings: Show empty state with "Add Your First Investment" button
- Otherwise: Show full dashboard

**Components Used**:
- `GlassCard` - For all card containers
- `GlassButton` - For all buttons
- `LoadingSpinner` - Loading states
- `SkeletonCard`, `SkeletonGrid` - Skeleton loaders
- `MarketTicker` - Lazy loaded market ticker
- `PortfolioChart` - Lazy loaded chart with `timeframe` prop
- `LeaderboardWidget` - With `limit={5}` and `showViewAll={true}`

**Props to Pass**:
- `PortfolioChart`: `portfolio`, `holdings`, `transactions`, `marketData`, `timeframe={selectedChartTimeframe}`, `loading={loading || marketLoading}`, `error={error || marketError}`

---

### 2. PortfolioPage (`/portfolio`)

**Location**: `pages/PortfolioPage.jsx`

**Imports**:
```javascript
import PortfolioTracker from '../components/portfolio/PortfolioTracker';
import UploadCSV from '../components/portfolio/UploadCSV';
import GlassCard from '../components/ui/GlassCard';
```

**State**:
- `showUploadSection` - Boolean, toggles CSV upload visibility

**Components**:
- `UploadCSV` - With `mode="transactions"` and `onUploadComplete` callback
- `PortfolioTracker` - Main portfolio component

**Props to UploadCSV**:
- `mode="transactions"`
- `onUploadComplete={(data) => { console.log(data); setShowUploadSection(false); }}`

---

### 3. PortfolioTracker Component

**Location**: `components/portfolio/PortfolioTracker.jsx`

**Imports**:
```javascript
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAlphaVantageData } from '../../hooks/useAlphaVantageData';
import { calculatePerformanceMetrics } from '../../services/portfolio/portfolioCalculations';
import PortfolioChart from './PortfolioChart';
import HoldingsList from './HoldingsList';
import PerformanceMetrics from './PerformanceMetrics';
import AddHolding from './AddHolding';
import UploadCSV from './UploadCSV';
```

**State**:
- `isAddOpen` - Boolean, controls AddHolding modal
- `selectedTimeframe` - String: '1D', '1W', '1M', '3M', '1Y', 'ALL'
- `activeTab` - String: 'overview' or 'upload'
- `filters` - Object: `{ dateRange: { start, end }, symbol: '', type: 'all' }`
- `showFilters` - Boolean

**Data Hooks**:
- `const { portfolio, holdings, transactions, loading: portfolioLoading, error: portfolioError } = usePortfolio()`
- `const { portfolioMetrics: liveMetrics, marketData, loading: marketLoading, error: marketError, lastUpdated, refreshData, isDataStale } = useAlphaVantageData(holdings || [])`

**Computed**:
- `portfolioMetrics` - Memoized from `liveMetrics` or `calculatePerformanceMetrics(holdings)`
- `quickStats` - Array of 4 stats: Total Value, Today's Change, Total Return, Holdings

**Functions**:
- `handleExportCSV()` - Exports holdings to CSV
- `handleFilterChange()` - Updates filters
- `handleClearFilters()` - Resets filters

**Components**:
- `PortfolioChart` - With `timeframe={selectedTimeframe}`
- `HoldingsList` - With `portfolio`, `liveMetrics`, `marketData`
- `PerformanceMetrics` - With `metrics={portfolioMetrics}`
- `AddHolding` - Modal controlled by `isAddOpen`
- `UploadCSV` - If `activeTab === 'upload'`

---

### 4. UploadCSV Component

**Location**: `components/portfolio/UploadCSV.jsx`

**Props**:
- `mode` - String: 'transactions' or 'spending'
- `onUploadComplete` - Function: `(data) => void`

**Imports**:
```javascript
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { usePortfolioContext } from '../../contexts/PortfolioContext';
import { supabase } from '../../services/supabase/config';
```

**State**:
- `file` - File object
- `isDragging` - Boolean
- `isParsing` - Boolean
- `parsedRows` - Array of parsed row objects
- `error` - String or null
- `isImporting` - Boolean
- `uploadMode` - String: 'transactions' or 'spending'
- `spendingAnalysis` - Object or null

**File Support**:
- Accepts: `.csv`, `.xlsx`, `.xls`
- Max size: 5MB
- Uses `xlsx` library (lazy loaded)

**Validation**:
- For transactions: Requires `symbol`, `date`, `shares`, `price`
- For spending: Requires `date`, `amount`, `category`
- Header aliases supported (e.g., 'ticker' → 'symbol')

**Functions**:
- `handleFileSelect(file)` - Validates and parses file
- `handleDragOver(e)`, `handleDrop(e)` - Drag and drop
- `handleImport()` - Imports valid rows to Supabase
- `handleRowToggle(rowId)` - Toggle row inclusion
- `calculateSpendingAnalysis(validRows)` - Calculates spending stats

**Data Flow**:
1. User selects/drops file
2. Parse file (CSV or Excel)
3. Detect columns using header aliases
4. Transform rows and validate
5. Show preview with validation errors
6. User confirms import
7. Insert to Supabase `holdings` or `transactions` table
8. Call `onUploadComplete(data)`
9. Reload portfolio via `reloadPortfolio()`

---

### 5. SuggestionsPage (`/suggestions`)

**Location**: `pages/SuggestionsPage.jsx`

**Imports**:
```javascript
import { useAISuggestions } from '../hooks/useAISuggestions';
import { getMarketInsights, fetchSuggestionLogs } from '../services/api/aiService';
import { useAuth } from '../hooks/useAuth';
import SuggestionsList from '../components/ai-suggestions/SuggestionsList';
import Modal from '../components/ui/Modal';
```

**State**:
- `selectedSuggestion` - Object or null
- `explanation` - String or null
- `isExplanationLoading` - Boolean
- `marketInsights` - Array
- `marketInsightsLoading` - Boolean
- `marketInsightsError` - String or null
- `activeTab` - String: 'current' or 'history'
- `suggestionHistory` - Array
- `historyLoading` - Boolean
- `selectedForComparison` - Array of suggestion IDs
- `showComparisonModal` - Boolean

**Data Hooks**:
- `const { suggestions, loading, error, refresh, dismissSuggestion, viewSuggestion, getExplanation, recordFeedback, updateConfidence, recordInteraction } = useAISuggestions()`
- `const { currentUser } = useAuth()`

**Computed**:
- `averageConfidence` - Average of all suggestion confidences
- `confidenceLabel` - String based on average
- `confidenceWidth` - Percentage string for progress bar
- `selectedMarketStats` - Extracted from `selectedSuggestion.marketContext`

**Functions**:
- `handleOpenSuggestion(suggestionId)` - Opens modal, fetches explanation
- `handleDismiss(suggestionId)` - Dismisses suggestion
- `handleFeedback(rating)` - Records feedback (thumbs up/down)
- `handleConfidenceChange(suggestionId, nextConfidence, interactionType)` - Updates confidence

**Effects**:
- Load market insights on mount via `getMarketInsights()`
- Load suggestion history when `activeTab === 'history'` via `fetchSuggestionLogs()`

**Components**:
- `SuggestionsList` - With all suggestion props
- `Modal` - For suggestion details and comparison

**Props to SuggestionsList**:
- `suggestions`, `loading`, `error`
- `onDismiss={handleDismiss}`
- `onRefresh={refresh}`
- `onViewDetails={handleOpenSuggestion}`
- `onAdjustConfidence={handleConfidenceChange}`
- `onRecordInteraction={recordInteraction}`
- `selectedForComparison`, `onToggleComparison`

---

### 6. SimulationPage (`/simulation`)

**Location**: `pages/SimulationPage.jsx`

**Imports**:
```javascript
import { useSimulation } from '../contexts/SimulationContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useAlphaVantageData } from '../hooks/useAlphaVantageData';
import { calculatePortfolioPerformance, recordPortfolioSnapshot, updatePortfolioPerformance } from '../services/simulation/portfolioEngine';
import { getTradeCoaching, getPortfolioReviewCoaching } from '../services/simulation/aiCoachingService';
import StockSearch from '../components/simulation/StockSearch';
import OrderForm from '../components/simulation/OrderForm';
import HoldingsList from '../components/simulation/HoldingsList';
import PerformanceChart from '../components/simulation/PerformanceChart';
import SimulationPortfolioChart from '../components/simulation/SimulationPortfolioChart';
import AchievementBadges from '../components/simulation/AchievementBadges';
import SimulationSettings from '../components/simulation/SimulationSettings';
import TransactionHistory from '../components/simulation/TransactionHistory';
```

**State**:
- `activeTab` - String: 'trade', 'portfolio', 'performance', 'achievements', 'history'
- `selectedStock` - Object: `{ symbol, name, price }` or null
- `aiCoaching` - String or null
- `portfolioReview` - String or null
- `showSettings` - Boolean
- `lastUpdate` - Date

**Data Hooks**:
- `const { portfolio, virtualBalance, holdings, transactions, loading, error, resetSimulation, undoLastTrade, canUndo, undoStack, buyStock, sellStock } = useSimulation()`
- `const { achievements } = useAchievements()`
- `const { portfolioMetrics, marketData } = useAlphaVantageData(holdings || [])`

**Computed**:
- `performance` - Memoized from `calculatePortfolioPerformance(portfolio, holdings, marketData)`
- `totalValue`, `totalReturn`, `totalReturnPercent`, `dailyChange`, `dailyChangePercent` - From `performance`

**Effects**:
- Record portfolio snapshot every 60 seconds via `recordPortfolioSnapshot()`
- Get portfolio review coaching when `activeTab === 'portfolio'`

**Functions**:
- `handleStockSelect(stock)` - Sets selected stock, fetches AI coaching
- `handleTradeComplete(result)` - Clears selection, refreshes review
- `handleSellFromHoldings(holding)` - Sets stock for selling

**Components**:
- `StockSearch` - With `onStockSelect={handleStockSelect}`, `selectedSymbol={selectedStock?.symbol}`
- `OrderForm` - With `stock={selectedStock}`, `onTradeComplete={handleTradeComplete}`
- `HoldingsList` - With `holdings`, `marketData`, `onSellClick={handleSellFromHoldings}`
- `PerformanceChart` - With `portfolioId={portfolio?.id}`, `currentValue={totalValue}`
- `SimulationPortfolioChart` - With `holdings`, `portfolioMetrics={performance}`, `marketData`
- `AchievementBadges` - With `achievements`
- `SimulationSettings` - Modal controlled by `showSettings`
- `TransactionHistory` - With `transactions`

**Tab Content**:
- `trade`: StockSearch + OrderForm + HoldingsList + AI Coaching
- `portfolio`: SimulationPortfolioChart + HoldingsList + Portfolio Review
- `performance`: PerformanceChart + Performance metrics cards
- `achievements`: AchievementBadges
- `history`: TransactionHistory

---

### 7. OrderForm Component

**Location**: `components/simulation/OrderForm.jsx`

**Props**:
- `stock` - Object: `{ symbol, name, price }`
- `onTradeComplete` - Function: `(result) => void`

**Imports**:
```javascript
import { useSimulation } from '../../contexts/SimulationContext';
import { calculatePositionSize, calculateDollarAmount, calculateFees } from '../../services/simulation/portfolioEngine';
```

**State**:
- `orderType` - String: 'buy' or 'sell'
- `inputMode` - String: 'shares' or 'dollars'
- `shares` - String
- `dollarAmount` - String
- `error` - String or null
- `showConfirmation` - Boolean

**Data Hooks**:
- `const { buyStock, sellStock, holdings, virtualBalance, loading } = useSimulation()`

**Computed**:
- `currentPrice` - From `stock.price`
- `existingHolding` - Find in `holdings` by `stock.symbol`
- `calculatedValues` - Memoized: `{ shares, dollarAmount, fees, total }`
- `validation` - Memoized: `{ isValid, errors }`
- `quickAmounts` - Array of quick amount buttons based on `orderType` and `virtualBalance`

**Functions**:
- `handleSubmit()` - Validates, executes trade via `buyStock()` or `sellStock()`, calls `onTradeComplete()`
- `handleQuickAmount(amount)` - Sets dollar amount
- `handleMax()` - Sets to max available (buy: virtualBalance, sell: existingHolding.shares)

**Validation**:
- Buy: `total <= virtualBalance`, `shares > 0`
- Sell: `existingHolding` exists, `shares <= existingHolding.shares`, `shares > 0`

---

### 8. ChatPage (`/chat`)

**Location**: `pages/ChatPage.jsx`

**Imports**:
```javascript
import AIChat from '../components/chat/AIChat';
```

**Structure**: Simple wrapper, full-screen chat interface

**Component**:
- `AIChat` - Full screen chat component

---

### 9. ProfilePage (`/profile`)

**Location**: `pages/ProfilePage.jsx`

**Imports**:
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { uploadAvatar } from '../services/supabase/storage';
import { supabase } from '../services/supabase/config';
import { updatePassword } from '../services/supabase/auth';
```

**State**:
- `formData` - Object: `{ name, email, bio, profileImagePath }`
- `saving` - Boolean
- `selectedAvatarFile` - File or null
- `avatarPreview` - String (URL)
- `showPasswordModal` - Boolean
- `showEmailModal` - Boolean
- `showDeleteModal` - Boolean
- `showSettingsModal` - Boolean
- `passwordForm` - Object: `{ current, new, confirm }`
- `newEmail` - String
- `privacySettings` - Object: `{ showEmail, showPortfolio, showAchievements, allowFriendRequests }`
- `notificationSettings` - Object: `{ email, push, achievements, suggestions, marketUpdates }`

**Data Hooks**:
- `const { currentUser, updateProfile, loading, signOut } = useAuth()`
- `const { queueToast } = useApp()`
- `const profile = currentUser?.profile || {}`

**Computed**:
- `normalizedStats` - Memoized: `{ xp, netWorth, achievements, lastUpdated }`

**Functions**:
- `handleSubmit(e)` - Updates profile via `updateProfile()`, uploads avatar if `selectedAvatarFile` exists
- `handlePasswordChange()` - Updates password via `updatePassword()`
- `handleEmailChange()` - Updates email via `updateProfile({ email: newEmail })`
- `handleDeleteAccount()` - Deletes user from Supabase, signs out
- `handleSaveSettings()` - Saves privacy/notification settings via `updateProfile()`

**Components**:
- Profile form with name, email, bio, avatar upload
- Stats cards: XP, Net Worth, Achievements
- Modals: Password change, Email change, Privacy/Notifications, Delete account

---

### 10. ClubsPage (`/clubs`)

**Location**: `pages/ClubsPage.jsx`

**Imports**:
```javascript
import { useClubs } from '../contexts/ClubsContext';
import { useApp } from '../contexts/AppContext';
```

**State**:
- `formState` - Object: `{ name, description, focus, meetingCadence }`
- `isSubmitting` - Boolean
- `searchQuery` - String
- `selectedCategory` - String
- `showInviteModal` - Boolean
- `inviteClubId` - String or null
- `inviteEmail` - String

**Data Hooks**:
- `const { clubs, loading, error, offline, pendingActions, createClub, selectClub, selectedClubId } = useClubs()`
- `const { queueToast } = useApp()`

**Computed**:
- `categories` - Memoized from `clubs` focus fields
- `sortedClubs` - Sorted alphabetically
- `filteredClubs` - Filtered by `searchQuery` and `selectedCategory`

**Functions**:
- `handleCreateClub(e)` - Creates club via `createClub()`
- `handleInvite(clubId)` - Opens invite modal
- `handleSendInvite()` - Sends invitation (API call)

**Components**:
- Create club form
- Search input
- Category filter buttons
- Club cards grid
- Invite modal

---

### 11. EducationPage (`/education`)

**Location**: `pages/EducationPage.jsx`

**Imports**:
```javascript
import { useEducation } from '../contexts/EducationContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useApp } from '../contexts/AppContext';
```

**State**:
- `selectedCategory` - String
- `selectedCourseId` - String or null
- `selectedModuleId` - String or null
- `showCelebration` - Boolean
- `celebrationData` - Object or null
- `searchQuery` - String

**Data Hooks**:
- `const { courses, modules, lessons, progress, loading, error, offline, refreshEducation } = useEducation()`
- `const { achievements: achievementsList, loading: achievementsLoading, error: achievementsError } = useAchievements()`
- `const { queueToast } = useApp()`

**Computed**:
- `categories` - Memoized from `courses`
- `filteredCourses` - Filtered by `selectedCategory` and `searchQuery`
- `courseModules` - Modules for `selectedCourseId`
- `selectedModuleLessons` - Lessons for `selectedModuleId`
- `computeModuleProgress(moduleId)` - Percentage completed
- `computeCourseProgress(courseId)` - Percentage completed
- `overallProgress` - Overall completion percentage
- `totalLessons`, `completedLessons` - Counts

**Components**:
- Search input
- Category filter buttons
- Course cards grid
- Module list with progress
- Lesson list with status
- Achievements widget
- Celebration component

---

## Reusable Components - Interface Specifications

### GlassCard
**Location**: `components/ui/GlassCard.jsx`

**Props**:
- `variant` - String: 'default', 'hero', 'floating', 'accent', 'solid'
- `padding` - String: 'none', 'small', 'medium', 'large', 'xl'
- `shadow` - String: 'none', 'small', 'medium', 'large', 'xl'
- `interactive` - Boolean
- `glow` - Boolean
- `className` - String
- `children` - ReactNode

### GlassButton
**Location**: `components/ui/GlassButton.jsx`

**Props**:
- `variant` - String: 'primary', 'secondary', 'glass', 'ghost', 'accent'
- `size` - String: 'small', 'default', 'large'
- `disabled` - Boolean
- `loading` - Boolean
- `as` - Component (for React Router Link)
- `to` - String (if using as Link)
- `onClick` - Function
- `className` - String
- `children` - ReactNode

### Modal
**Location**: `components/ui/Modal.jsx`

**Props**:
- `isOpen` - Boolean
- `onClose` - Function
- `title` - String
- `size` - String: 'small', 'medium', 'large', 'xlarge'
- `className` - String
- `children` - ReactNode

### LoadingSpinner
**Location**: `components/common/LoadingSpinner.jsx`

**Props**:
- `size` - String: 'small', 'medium', 'large'
- `className` - String

### SkeletonLoader
**Location**: `components/common/SkeletonLoader.jsx`

**Exports**:
- `SkeletonCard` - Component
- `SkeletonGrid` - Component with `count` and `Component` props
- `SkeletonSuggestion` - Component

---

## Form Structures

### CSV Upload Form
- File input with drag-and-drop
- Preview table with validation errors
- Toggle rows for import
- Import button
- Progress indicator during import

### Order Form (Simulation)
- Toggle: Buy/Sell
- Toggle: Shares/Dollars input mode
- Input: Shares or Dollar amount
- Display: Calculated values (shares, amount, fees, total)
- Quick amount buttons
- Max button
- Validation errors
- Submit button

### Profile Form
- Input: Full name
- Input: Email
- Textarea: Bio
- File input: Avatar (hidden, triggered by button)
- Preview: Avatar image
- Buttons: Upload Avatar, Reset, Save Changes

### Club Creation Form
- Input: Club name
- Input: Focus
- Input: Meeting cadence
- Textarea: Description
- Submit button

---

## Data Flow Patterns

### Portfolio Data Flow
1. `usePortfolio()` fetches from Supabase
2. `useAlphaVantageData(holdings)` fetches live prices
3. `calculatePerformanceMetrics()` computes metrics
4. Components receive `portfolioMetrics` and `marketData`
5. Real-time updates via Supabase subscriptions

### AI Suggestions Flow
1. `useAISuggestions()` fetches suggestions
2. User views suggestion → `viewSuggestion(id)`
3. Fetch explanation → `getExplanation(id)`
4. User provides feedback → `recordFeedback(id, rating)`
5. Update confidence → `updateConfidence(id, confidence)`

### Simulation Trade Flow
1. User selects stock via `StockSearch`
2. User fills `OrderForm`
3. Validation checks
4. Execute trade via `buyStock()` or `sellStock()`
5. Update portfolio state
6. Record transaction in Supabase
7. Refresh market data
8. Call `onTradeComplete(result)`

### CSV Import Flow
1. User selects/drops file
2. Parse file (CSV/Excel)
3. Detect columns via header aliases
4. Transform and validate rows
5. Show preview with errors
6. User toggles rows to import
7. Import valid rows to Supabase
8. Call `reloadPortfolio()`
9. Call `onUploadComplete(data)`

---

## Conditional Rendering Patterns

### Loading States
```javascript
if (loading) {
  return <LoadingSpinner /> or <SkeletonLoader />
}
```

### Error States
```javascript
if (error) {
  return <ErrorCard message={error} retryButton />
}
```

### Empty States
```javascript
if (!data || data.length === 0) {
  return <EmptyStateCard message="No data" actionButton />
}
```

### Data-Dependent Rendering
```javascript
{data && data.length > 0 && (
  <DataList data={data} />
)}
```

---

## Integration Requirements

### Must Preserve
1. All hook calls and context usage
2. All API service calls
3. All form submission handlers
4. All state management logic
5. All computed values and memoization
6. All conditional rendering logic
7. All prop passing to child components
8. All event handlers
9. All data transformations
10. All validation logic

### Must Generate
1. Complete React functional components
2. All JSX structure
3. All styling (Tailwind CSS or CSS Modules)
4. Responsive layouts (mobile, tablet, desktop)
5. Loading states
6. Error states
7. Empty states
8. Animations (optional, using Framer Motion if needed)
9. Accessibility attributes (ARIA labels, roles)
10. Keyboard navigation support
11. **Lazy loading** - Preserve existing lazy-loaded components (e.g., `MarketTicker`, `PortfolioChart`) and add lazy loading for other heavy components like charts, large data tables, or complex visualizations using React's `lazy()` and `Suspense`
12. **Reusable UI primitives** - Create reusable components when patterns repeat (e.g., card components, button variants, modal wrappers, form inputs, stat displays) to avoid code duplication and ensure consistency

### Must NOT Include
1. Design specifications (colors, fonts, spacing)
2. Visual style requirements
3. Typography specifications
4. Color palette definitions
5. Layout specifications beyond responsive breakpoints

---

## Output Format

For each page/component, generate:

1. **Complete functional component** with:
   - All imports
   - All hooks and context usage
   - All state management
   - All computed values
   - All event handlers
   - Complete JSX structure
   - Full styling implementation

2. **Responsive design**:
   - Mobile-first approach
   - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
   - Touch-friendly interactive elements (min 44x44px)

3. **Accessibility**:
   - ARIA labels where needed
   - Semantic HTML
   - Keyboard navigation
   - Focus management

4. **Error handling**:
   - Try-catch blocks where needed
   - Error boundaries
   - User-friendly error messages

5. **Performance optimization**:
   - Use React `lazy()` and `Suspense` for heavy components (charts, market tickers, large data visualizations)
   - Preserve existing lazy-loading patterns (e.g., `MarketTicker`, `PortfolioChart` in DashboardPage)
   - Implement code splitting for route-level components where appropriate
   - Use `React.memo()` for expensive components that receive stable props
   - Optimize re-renders with proper dependency arrays in hooks

6. **Component reusability**:
   - Identify repeated UI patterns and extract them into reusable components
   - Create base UI primitives in `components/ui/` for common patterns (cards, buttons, inputs, modals, stat displays, etc.)
   - Ensure reusable components accept appropriate props for customization
   - Avoid duplicating component logic - extract shared functionality into hooks or utilities
   - Document component props and usage patterns for maintainability

---

## Success Criteria

Components are successful if:
1. ✅ All existing functionality preserved
2. ✅ All hooks and contexts used correctly
3. ✅ All API calls maintained
4. ✅ All forms functional
5. ✅ All state management intact
6. ✅ Responsive on all screen sizes
7. ✅ Accessible and keyboard navigable
8. ✅ Clean, maintainable code structure
9. ✅ No breaking changes to data flow
10. ✅ Ready for direct integration
11. ✅ Lazy loading preserved/implemented for heavy components
12. ✅ Reusable UI primitives created to avoid code duplication

---

**END OF PROMPT**

Generate all components following these code-first specifications. Focus on functionality, structure, and data flow. Handle all styling and visual design autonomously.
