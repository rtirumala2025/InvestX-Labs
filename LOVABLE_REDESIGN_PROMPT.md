# InvestX Labs - Sitewide Redesign Prompt for Lovable

## Project Overview

You are redesigning **InvestX Labs**, a comprehensive investment education and portfolio management platform for high school students. This is a **sitewide redesign** of all pages except the polished homepage. You must generate **fully functional, plug-and-play React components** that preserve all existing functionality while implementing a modern, clean, high-school-friendly visual design.

---

## 🎨 Design System Requirements

### Color Palette
- **Primary Colors**: Bright, approachable blues and greens
  - Primary: `#0ea5e9` (Sky Blue) - `#0284c7` (Deeper Blue)
  - Success: `#22c55e` (Green) - `#16a34a` (Darker Green)
  - Accent: `#f59e0b` (Warm Gold) - `#d97706` (Darker Gold)
- **Neutral Colors**: Clean grays for backgrounds and text
  - Background: `#fafafa` (Light Gray) - `#171717` (Dark Mode)
  - Text: `#0a0a0a` (Dark) - `#fafafa` (Light)
  - Borders: `#e5e5e5` (Light) - `#404040` (Dark)
- **Semantic Colors**:
  - Error: `#ef4444` (Red)
  - Warning: `#f59e0b` (Orange)
  - Info: `#3b82f6` (Blue)

### Typography
- **Font Family**: System fonts stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Headings**:
  - H1: `2.5rem` (40px), `font-weight: 700`, `line-height: 1.2`
  - H2: `2rem` (32px), `font-weight: 600`, `line-height: 1.3`
  - H3: `1.5rem` (24px), `font-weight: 600`, `line-height: 1.4`
  - H4: `1.25rem` (20px), `font-weight: 600`, `line-height: 1.4`
- **Body Text**: `1rem` (16px), `font-weight: 400`, `line-height: 1.6`
- **Small Text**: `0.875rem` (14px), `font-weight: 400`, `line-height: 1.5`

### Component Styling
- **Border Radius**: 
  - Cards: `16px` (rounded-xl)
  - Buttons: `12px` (rounded-lg)
  - Inputs: `10px` (rounded-lg)
  - Modals: `20px` (rounded-2xl)
  - Badges: `8px` (rounded)
- **Spacing System**: 
  - xs: `0.5rem` (8px)
  - sm: `0.75rem` (12px)
  - md: `1rem` (16px)
  - lg: `1.5rem` (24px)
  - xl: `2rem` (32px)
  - 2xl: `3rem` (48px)
- **Shadows**:
  - Small: `0 1px 3px rgba(0, 0, 0, 0.1)`
  - Medium: `0 4px 12px rgba(0, 0, 0, 0.1)`
  - Large: `0 8px 24px rgba(0, 0, 0, 0.12)`
- **Transitions**: `transition-all duration-200 ease-in-out`

### Visual Hierarchy
- Use clear visual separation between sections
- Consistent card-based layouts with proper padding
- Generous white space for readability
- Clear call-to-action buttons with proper contrast
- Responsive grid systems (1 column mobile, 2-3 columns tablet, 3-4 columns desktop)

---

## 📱 Responsive Design Requirements

- **Mobile**: 320px - 640px (single column, stacked layouts, touch-friendly buttons min 44x44px)
- **Tablet**: 641px - 1024px (2-column grids, optimized spacing)
- **Desktop**: 1025px+ (multi-column layouts, hover states, larger cards)

---

## 🔧 Technical Stack & Integration Requirements

### React Framework
- Use **functional components** with React Hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`)
- **No class components** - all components must be functional
- Use **React Router v6** for navigation (already configured in `App.jsx`)

### Styling Approach
- **Primary**: Tailwind CSS utility classes
- **Secondary**: CSS Modules for component-specific styles (if needed)
- **No inline styles** except for dynamic values
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### State Management
- **Context API** for global state (AuthContext, PortfolioContext, SimulationContext, etc.)
- **Local state** with `useState` for component-specific state
- **Custom hooks** for reusable logic (already exist in `/hooks`)

### API Integrations (PRESERVE ALL)
1. **Supabase**:
   - Authentication: `useAuth()` hook from `contexts/AuthContext`
   - Database: `supabase` client from `services/supabase/config`
   - Real-time subscriptions: Use Supabase real-time features
   - Storage: For file uploads (CSV)

2. **Alpha Vantage**:
   - Market data: `useAlphaVantageData()` hook
   - Stock quotes: `getMarketData()` from `services/market/marketService`
   - Real-time price updates

3. **OpenRouter AI**:
   - AI chat: `AIChat` component uses OpenRouter API
   - AI suggestions: `useAISuggestions()` hook
   - AI coaching: Services in `services/ai/`

### Component Structure
- All components must be in `/components` directory
- Page components in `/pages` directory
- Reusable UI components in `/components/ui`
- Feature-specific components in feature folders (e.g., `/components/portfolio`, `/components/simulation`)

---

## 📄 Pages to Redesign (All except HomePage)

### 1. **Dashboard Page** (`/dashboard`)
**Route**: `/dashboard`  
**Component**: `DashboardPage.jsx`  
**Key Features**:
- Portfolio overview with total value, gain/loss, day change
- Quick stats cards (Total Value, Day Change, Gain/Loss, Diversification Score)
- Portfolio performance chart (using `PortfolioChart` component)
- Recent activity feed
- Quick actions (Add Holding, View Portfolio, Start Simulation)
- AI suggestions widget
- Leaderboard widget
- Market ticker (lazy-loaded `MarketTicker` component)

**Required Components**:
- `QuickStats` - Display portfolio metrics in cards
- `PortfolioPerformance` - Chart showing portfolio value over time
- `RecentActivity` - List of recent transactions
- `QuickActions` - Action buttons for common tasks
- `AISuggestions` - Widget showing AI investment suggestions
- `LeaderboardWidget` - Top performers display

**Data Sources**:
- `usePortfolio()` hook for portfolio data
- `useAlphaVantageData()` for live market data
- `useEducation()` for education progress
- `calculatePerformanceMetrics()` for calculations

**Preserve**:
- All portfolio calculations
- Real-time market data updates
- Chart timeframes (1D, 1W, 1M, 3M, 6M, 1Y, All)
- Loading states and error handling
- Responsive grid layouts

---

### 2. **Portfolio Page** (`/portfolio`)
**Route**: `/portfolio`  
**Component**: `PortfolioPage.jsx`  
**Key Features**:
- CSV upload section (collapsible) for transaction imports
- Portfolio tracker with holdings list
- Performance metrics and charts
- Add/Edit/Delete holdings functionality
- Transaction history
- Portfolio diversification visualization

**Required Components**:
- `UploadCSV` - File upload with drag-and-drop, validation, preview
- `PortfolioTracker` - Main portfolio management component
- `HoldingsList` - Display all holdings with current prices
- `PerformanceMetrics` - Show gains, losses, percentages
- `PortfolioChart` - Visualize portfolio performance
- `AddHolding` - Modal/form to add new holdings

**Data Sources**:
- `usePortfolioContext()` for portfolio state
- `useAlphaVantageData()` for current prices
- Supabase for storing holdings and transactions

**Preserve**:
- CSV parsing logic (supports .csv, .xlsx, .xls)
- Transaction validation
- Real-time price updates
- Portfolio calculations
- Error handling and user feedback

---

### 3. **Simulation Page** (`/simulation`)
**Route**: `/simulation`  
**Component**: `SimulationPage.jsx`  
**Key Features**:
- Virtual trading interface with $10,000 starting balance
- Stock search and selection
- Buy/Sell order forms
- Holdings list with real-time prices
- Performance charts
- Transaction history
- Achievement badges
- AI coaching tips
- Settings (reset simulation, undo last trade)

**Required Components**:
- `TradingInterface` - Main trading UI with tabs
- `StockSearch` - Search and select stocks
- `OrderForm` - Buy/Sell form with validation
- `HoldingsList` - Display simulation holdings
- `PerformanceChart` - Show simulation performance
- `SimulationPortfolioChart` - Portfolio value over time
- `TransactionHistory` - List of all trades
- `AchievementBadges` - Display unlocked achievements
- `SimulationSettings` - Settings modal

**Data Sources**:
- `useSimulation()` context for simulation state
- `useAlphaVantageData()` for stock prices
- `useAchievements()` for achievement tracking
- AI coaching services

**Preserve**:
- Virtual balance calculations
- Trade execution logic
- Portfolio performance tracking
- Achievement system
- Undo/redo functionality
- Real-time price updates

---

### 4. **Suggestions Page** (`/suggestions`)
**Route**: `/suggestions`  
**Component**: `SuggestionsPage.jsx`  
**Key Features**:
- AI-generated investment suggestions list
- Suggestion details modal with explanations
- Market insights section
- Suggestion history and comparison
- Feedback system (thumbs up/down)
- Confidence scores
- Filter and sort options

**Required Components**:
- `SuggestionsList` - Display all suggestions
- `SuggestionCard` - Individual suggestion card
- `SuggestionDetails` - Modal with full suggestion details
- `AIExplanation` - AI-generated explanation component
- Market insights cards

**Data Sources**:
- `useAISuggestions()` hook
- `getMarketInsights()` from AI service
- `fetchSuggestionLogs()` for history

**Preserve**:
- AI suggestion generation
- Explanation generation
- Feedback recording
- Confidence scoring
- History tracking

---

### 5. **Chat Page** (`/chat`)
**Route**: `/chat`  
**Component**: `ChatPage.jsx`  
**Key Features**:
- Full-screen AI chat interface
- Message history
- Typing indicators
- Message input with send button
- Chat suggestions/prompts
- Context-aware responses

**Required Components**:
- `AIChat` - Main chat component (already exists)
- `ChatInterface` - Chat UI wrapper

**Data Sources**:
- OpenRouter API via `services/chat/`
- Chat context and history

**Preserve**:
- All chat functionality
- Message persistence
- AI response generation
- Context management

---

### 6. **Education Page** (`/education`)
**Route**: `/education`  
**Component**: `EducationPage.jsx`  
**Key Features**:
- Learning modules grid
- Progress tracking
- Module categories
- Search and filter
- Completion badges

**Required Components**:
- `LearningModules` - Module grid display
- `Article` - Article content viewer
- `Quiz` - Interactive quiz component
- `Badges` - Achievement badges
- `Glossary` - Financial terms glossary
- `FinancialTerm` - Term definition component

**Data Sources**:
- `useEducation()` context
- Education content from Supabase

**Preserve**:
- Progress tracking
- Quiz functionality
- Badge system
- Content navigation

---

### 7. **Leaderboard Page** (`/leaderboard`)
**Route**: `/leaderboard`  
**Component**: `LeaderboardPage.jsx`  
**Key Features**:
- Top performers list
- User rankings
- Filter by time period (Daily, Weekly, Monthly, All-time)
- User profile cards
- Performance metrics per user

**Required Components**:
- `LeaderboardWidget` - Leaderboard display component

**Data Sources**:
- `supabaseLeaderboardService` from `services/leaderboard/`
- Real-time updates via Supabase subscriptions

**Preserve**:
- Real-time ranking updates
- Time period filtering
- User profile integration

---

### 8. **Clubs Page** (`/clubs`)
**Route**: `/clubs`  
**Component**: `ClubsPage.jsx`  
**Key Features**:
- Investment clubs grid
- Create new club button
- Club search and filter
- Club cards with member count, performance
- Join/Leave club functionality

**Required Components**:
- Club card components
- Create club modal
- Club search/filter

**Data Sources**:
- `clubService` from `services/api/clubService`
- Supabase for club data

**Preserve**:
- Club creation
- Member management
- Club performance tracking

---

### 9. **Club Detail Page** (`/clubs/:clubId`)
**Route**: `/clubs/:clubId`  
**Component**: `ClubDetailPage.jsx`  
**Key Features**:
- Club information
- Member list
- Club portfolio performance
- Club leaderboard
- Activity feed

**Data Sources**:
- Club data from Supabase
- Member data
- Portfolio aggregations

**Preserve**:
- All club functionality
- Member interactions
- Portfolio aggregation

---

### 10. **Profile Page** (`/profile`)
**Route**: `/profile`  
**Component**: `ProfilePage.jsx`  
**Key Features**:
- User profile information
- Account settings
- Privacy settings
- Notification preferences
- Portfolio preferences
- Delete account option

**Required Components**:
- Profile form
- Settings sections
- `PrivacySettings` component

**Data Sources**:
- `useAuth()` for user data
- Supabase for profile updates

**Preserve**:
- Profile update functionality
- Settings persistence
- Account management

---

### 11. **Achievements Page** (`/achievements`)
**Route**: `/achievements`  
**Component**: `AchievementsPage.jsx`  
**Key Features**:
- All available achievements grid
- Unlocked vs locked states
- Achievement categories
- Progress indicators
- Achievement details

**Data Sources**:
- `useAchievements()` context
- Achievement definitions

**Preserve**:
- Achievement tracking
- Unlock logic
- Progress calculation

---

### 12. **Onboarding Page** (`/onboarding`)
**Route**: `/onboarding`  
**Component**: `OnboardingPage.jsx`  
**Key Features**:
- Multi-step onboarding flow
- Welcome step
- Risk tolerance quiz
- Investment interests selection
- Profile setup
- Demo portfolio step

**Required Components**:
- `OnboardingFlow` - Main flow container
- `WelcomeStep` - Welcome screen
- `RiskToleranceQuiz` - Risk assessment
- `InterestsStep` - Interest selection
- `ProfileStep` - Profile information
- `DemoPortfolioStep` - Demo portfolio setup

**Data Sources**:
- Onboarding data saved to Supabase
- User profile creation

**Preserve**:
- All onboarding steps
- Data persistence
- Progress tracking
- Validation logic

---

### 13. **Diagnostic Page** (`/diagnostic`)
**Route**: `/diagnostic`  
**Component**: `DiagnosticPage.jsx`  
**Key Features**:
- Diagnostic flow for troubleshooting
- System checks
- Connection tests
- Data validation

**Required Components**:
- `DiagnosticFlow` - Diagnostic process

**Preserve**:
- All diagnostic functionality
- Error reporting

---

### 14. **Login Page** (`/login`)
**Route**: `/login`  
**Component**: `LoginPage.jsx`  
**Key Features**:
- Email/password login form
- OAuth options (if configured)
- "Forgot password" link
- "Sign up" link
- Error handling

**Required Components**:
- `LoginForm` - Login form component

**Data Sources**:
- `useAuth()` for authentication
- Supabase Auth

**Preserve**:
- Authentication logic
- Error handling
- Redirect after login

---

### 15. **Signup Page** (`/signup`)
**Route**: `/signup`  
**Component**: `SignupPage.jsx`  
**Key Features**:
- Registration form
- Email validation
- Password strength indicator
- Terms acceptance
- OAuth signup (if configured)

**Required Components**:
- `SignupForm` - Registration form

**Data Sources**:
- `useAuth()` for signup
- Supabase Auth

**Preserve**:
- Signup logic
- Email verification flow
- Validation rules

---

### 16. **Forgot Password Page** (`/forgot-password`)
**Route**: `/forgot-password`  
**Component**: `ForgotPasswordPage.jsx`  
**Key Features**:
- Email input form
- Password reset request
- Success/error messages

**Preserve**:
- Password reset functionality
- Email sending

---

### 17. **Reset Password Page** (`/reset-password`)
**Route**: `/reset-password`  
**Component**: `ResetPasswordPage.jsx`  
**Key Features**:
- New password form
- Password confirmation
- Token validation

**Preserve**:
- Password reset logic
- Token handling

---

### 18. **Verify Email Page** (`/verify-email`)
**Route**: `/verify-email`  
**Component**: `VerifyEmailPage.jsx`  
**Key Features**:
- Email verification status
- Resend verification email
- Success confirmation

**Preserve**:
- Email verification logic

---

### 19. **Privacy Page** (`/privacy`)
**Route**: `/privacy`  
**Component**: `PrivacyPage.jsx`  
**Key Features**:
- Privacy policy content
- Terms of service
- Legal information

**Preserve**:
- All content and legal text

---

### 20. **Lesson View Page** (`/education/lessons/:lessonId`)
**Route**: `/education/lessons/:lessonId`  
**Component**: `LessonView.jsx`  
**Key Features**:
- Lesson content display
- Navigation between lessons
- Progress tracking
- Quiz integration

**Preserve**:
- Lesson navigation
- Progress tracking
- Content rendering

---

## 🧩 Reusable Component Library

Generate these reusable components that can be used across all pages:

### UI Components (`/components/ui/`)

1. **Button** (`Button.jsx`)
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
   - Sizes: `small`, `medium`, `large`
   - States: `default`, `loading`, `disabled`
   - Props: `variant`, `size`, `loading`, `disabled`, `onClick`, `children`, `className`
   - Styling: Rounded corners, proper padding, hover states, focus states

2. **Input** (`Input.jsx`)
   - Types: `text`, `email`, `password`, `number`, `date`
   - States: `default`, `error`, `disabled`
   - Features: Label, placeholder, error message, help text
   - Props: `type`, `label`, `error`, `helpText`, `disabled`, `value`, `onChange`
   - Styling: Rounded corners, border, focus ring

3. **Card** (`Card.jsx`)
   - Variants: `default`, `elevated`, `outlined`
   - Features: Header, body, footer sections
   - Props: `title`, `subtitle`, `children`, `footer`, `variant`, `className`
   - Styling: Rounded corners, shadow, padding

4. **Modal** (`Modal.jsx`)
   - Features: Backdrop, close button, header, body, footer
   - Sizes: `small`, `medium`, `large`, `xlarge`
   - Props: `isOpen`, `onClose`, `title`, `children`, `size`, `className`
   - Styling: Centered, rounded corners, backdrop blur
   - Animation: Fade in/out, scale animation

5. **LoadingSpinner** (`LoadingSpinner.jsx`)
   - Sizes: `small`, `medium`, `large`
   - Variants: `spinner`, `dots`, `pulse`
   - Props: `size`, `variant`, `className`

6. **Badge** (`Badge.jsx`)
   - Variants: `default`, `success`, `warning`, `error`, `info`
   - Sizes: `small`, `medium`
   - Props: `variant`, `size`, `children`, `className`

7. **Tabs** (`Tabs.jsx`)
   - Features: Tab navigation, active state, content panels
   - Props: `tabs`, `activeTab`, `onTabChange`, `children`

8. **Select** (`Select.jsx`)
   - Features: Dropdown, searchable (optional), multi-select (optional)
   - Props: `options`, `value`, `onChange`, `placeholder`, `searchable`, `multiple`

9. **Checkbox** (`Checkbox.jsx`)
   - States: `checked`, `unchecked`, `indeterminate`, `disabled`
   - Props: `checked`, `onChange`, `label`, `disabled`

10. **Radio** (`Radio.jsx`)
    - Features: Radio group, individual radios
    - Props: `options`, `value`, `onChange`, `name`

11. **Toast/Notification** (`Toast.jsx`)
    - Variants: `success`, `error`, `warning`, `info`
    - Features: Auto-dismiss, manual close, action buttons
    - Props: `message`, `variant`, `duration`, `onClose`, `action`

12. **Tooltip** (`Tooltip.jsx`)
    - Positions: `top`, `bottom`, `left`, `right`
    - Props: `content`, `position`, `children`

13. **ProgressBar** (`ProgressBar.jsx`)
    - Variants: `default`, `success`, `warning`, `error`
    - Props: `value`, `max`, `variant`, `showLabel`, `className`

14. **SkeletonLoader** (`SkeletonLoader.jsx`)
    - Types: `text`, `card`, `avatar`, `button`
    - Props: `type`, `width`, `height`, `className`

15. **GlassCard** (`GlassCard.jsx`) - Already exists, preserve styling approach
    - Glass morphism effect
    - Backdrop blur
    - Semi-transparent background

16. **GlassButton** (`GlassButton.jsx`) - Already exists, preserve styling approach
    - Glass morphism effect
    - Hover states

---

## 🔄 Data Flow & State Management

### Context Providers (Already Exist - Use These)
- `AuthContext` - User authentication state
- `PortfolioContext` - Portfolio data and operations
- `SimulationContext` - Simulation trading state
- `EducationContext` - Education progress
- `AchievementsContext` - Achievement tracking
- `AppContext` - Global app state (toasts, errors)
- `MarketContext` - Market data provider

### Custom Hooks (Already Exist - Use These)
- `useAuth()` - Authentication operations
- `usePortfolio()` - Portfolio data fetching
- `useAlphaVantageData()` - Market data
- `useAISuggestions()` - AI suggestions
- `useSimulation()` - Simulation state
- `useEducation()` - Education data
- `useAchievements()` - Achievement data

### API Services (Already Exist - Use These)
- `services/supabase/` - Supabase client and operations
- `services/market/` - Market data services
- `services/ai/` - AI services (OpenRouter)
- `services/portfolio/` - Portfolio calculations
- `services/api/` - API client and endpoints

**CRITICAL**: Do NOT modify any backend logic, API services, or data fetching hooks. Only redesign the UI components and pages.

---

## ✅ Functionality Preservation Checklist

For each page and component, ensure these are preserved:

### Forms
- ✅ All form inputs and validation
- ✅ Form submission handlers
- ✅ Error messages and validation feedback
- ✅ Loading states during submission
- ✅ Success/error notifications

### API Connections
- ✅ Supabase authentication (login, signup, password reset)
- ✅ Supabase database queries (portfolio, holdings, transactions)
- ✅ Supabase real-time subscriptions
- ✅ Alpha Vantage market data fetching
- ✅ OpenRouter AI API calls
- ✅ All API error handling

### Real-time Updates
- ✅ Live stock price updates
- ✅ Portfolio value recalculation
- ✅ Leaderboard real-time updates
- ✅ Chat message updates

### Data Processing
- ✅ CSV parsing and validation
- ✅ Portfolio calculations (gains, losses, diversification)
- ✅ Performance metrics
- ✅ Transaction processing

### Navigation & Routing
- ✅ All routes preserved
- ✅ Protected routes (authentication required)
- ✅ Redirects after actions
- ✅ Deep linking support

### User Interactions
- ✅ All button clicks and handlers
- ✅ Modal open/close
- ✅ Tab switching
- ✅ Form submissions
- ✅ File uploads
- ✅ Search and filtering

---

## 📦 Component Integration Instructions

### File Structure
```
frontend/src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, Card, Modal, etc.)
│   ├── portfolio/       # Portfolio-specific components
│   ├── simulation/      # Simulation-specific components
│   ├── chat/            # Chat components
│   ├── education/       # Education components
│   ├── ai-suggestions/  # AI suggestion components
│   ├── leaderboard/     # Leaderboard components
│   ├── dashboard/       # Dashboard components
│   ├── auth/            # Authentication components
│   └── common/          # Common shared components
├── pages/               # Page components (all pages to redesign)
├── contexts/            # React Context providers (DO NOT MODIFY)
├── hooks/               # Custom hooks (DO NOT MODIFY)
├── services/            # API services (DO NOT MODIFY)
└── utils/               # Utility functions (DO NOT MODIFY)
```

### Integration Steps

1. **Replace Page Components**:
   - Keep the same file names in `/pages`
   - Update imports to use new UI components
   - Preserve all hooks, context usage, and data fetching
   - Update JSX structure and styling only

2. **Update Component Imports**:
   - Import new UI components from `/components/ui/`
   - Keep existing feature component imports
   - Update styling classes to use Tailwind

3. **Preserve Props and Handlers**:
   - All component props must remain the same
   - All event handlers must be preserved
   - All state management must remain unchanged

4. **Update Styling**:
   - Replace inline styles with Tailwind classes
   - Use CSS Modules only if absolutely necessary
   - Maintain responsive breakpoints
   - Ensure dark mode support (if applicable)

5. **Test Integration**:
   - Verify all routes work
   - Test all forms and submissions
   - Verify API calls still function
   - Check responsive layouts
   - Test error states

---

## 🎯 Design Implementation Guidelines

### Card-Based Layouts
- Use cards for all major content sections
- Consistent padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
- Rounded corners: `rounded-xl` (16px)
- Shadows: `shadow-lg` for elevation
- Background: White/light gray for light mode, dark gray for dark mode

### Button Styling
- Primary buttons: Blue background (`bg-blue-600`), white text, hover: `bg-blue-700`
- Secondary buttons: Gray background (`bg-gray-200`), dark text, hover: `bg-gray-300`
- Outline buttons: Transparent background, colored border, colored text
- Size: `px-4 py-2` (medium), `px-6 py-3` (large), `px-3 py-1.5` (small)
- Rounded: `rounded-lg` (12px)
- Focus: Ring with `focus:ring-2 focus:ring-blue-500`

### Input Styling
- Border: `border border-gray-300`, focus: `border-blue-500`
- Padding: `px-4 py-2`
- Rounded: `rounded-lg` (10px)
- Focus ring: `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- Error state: `border-red-500`, error text below input

### Typography Hierarchy
- Page titles: `text-3xl font-bold` (H1)
- Section titles: `text-2xl font-semibold` (H2)
- Card titles: `text-xl font-semibold` (H3)
- Body text: `text-base` (default)
- Small text: `text-sm text-gray-600`

### Spacing
- Section spacing: `mb-8` (32px) between major sections
- Card spacing: `mb-6` (24px) between cards
- Element spacing: `mb-4` (16px) between related elements
- Tight spacing: `mb-2` (8px) for labels and small elements

### Color Usage
- Primary actions: Blue (`blue-600`, `blue-700`)
- Success: Green (`green-600`)
- Error: Red (`red-600`)
- Warning: Orange (`orange-600`)
- Text: `text-gray-900` (dark), `text-gray-600` (secondary)
- Backgrounds: `bg-white` (light), `bg-gray-50` (subtle)

---

## 🚀 Output Requirements

### For Each Page:
1. **Complete React Component**:
   - Functional component with all hooks preserved
   - All imports (existing hooks, contexts, services)
   - All state management preserved
   - All event handlers preserved
   - New UI styling with Tailwind CSS
   - Responsive design (mobile, tablet, desktop)
   - Loading states
   - Error states
   - Empty states

2. **Component Documentation**:
   - Props interface (if applicable)
   - Usage notes
   - Integration instructions

### For Reusable Components:
1. **Complete Component File**:
   - Functional component
   - TypeScript-style prop definitions (JSDoc comments)
   - All variants and states
   - Responsive design
   - Accessibility attributes (ARIA labels, roles)

2. **Usage Examples**:
   - Basic usage
   - All variants
   - With different props

### Code Quality:
- ✅ Clean, readable code
- ✅ Consistent naming conventions
- ✅ Proper prop destructuring
- ✅ Error boundaries where needed
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Performance (memoization where appropriate)
- ✅ No console.logs in production code
- ✅ Proper error handling

---

## 📝 Special Considerations

### CSV Upload Component
- Must preserve all parsing logic
- Support .csv, .xlsx, .xls files
- Drag-and-drop functionality
- File validation
- Preview before import
- Error handling for invalid rows
- Success feedback

### Charts and Visualizations
- Use existing chart libraries (Recharts, if already in use)
- Preserve all chart configurations
- Maintain data formatting
- Responsive chart sizing
- Loading states for charts

### Modals
- Preserve all modal functionality
- Backdrop click to close
- Escape key to close
- Focus trapping
- Smooth animations
- Responsive sizing

### Forms
- All validation rules preserved
- Real-time validation feedback
- Error message display
- Success states
- Loading states during submission
- Disabled states

### Real-time Features
- Preserve all Supabase real-time subscriptions
- Maintain connection status indicators
- Handle reconnection logic
- Update UI on data changes

---

## 🎨 Visual Style Examples

### Card Example:
```jsx
<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">Card Title</h3>
  <p className="text-base text-gray-600">Card content goes here.</p>
</div>
```

### Button Example:
```jsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors">
  Click Me
</button>
```

### Input Example:
```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    placeholder="Enter your email"
  />
</div>
```

---

## ✅ Final Checklist

Before delivering components, ensure:

- [ ] All pages redesigned (except HomePage)
- [ ] All reusable UI components created
- [ ] All functionality preserved (forms, APIs, real-time)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Consistent design system applied
- [ ] All imports correct and paths valid
- [ ] No breaking changes to existing functionality
- [ ] Error handling preserved
- [ ] Loading states included
- [ ] Accessibility attributes added
- [ ] Code is clean and well-structured
- [ ] Components are plug-and-play ready

---

## 🎯 Success Criteria

The redesigned components will be successful if:

1. ✅ **Visual**: Modern, clean, high-school-friendly design
2. ✅ **Functional**: All existing features work exactly as before
3. ✅ **Responsive**: Works perfectly on mobile, tablet, and desktop
4. ✅ **Integrated**: Can be directly dropped into the existing codebase
5. ✅ **Performant**: No performance regressions
6. ✅ **Accessible**: Meets basic accessibility standards
7. ✅ **Maintainable**: Clean, readable, well-structured code

---

**END OF PROMPT**

Generate all components following these specifications. Focus on creating production-ready, plug-and-play React components that can be directly integrated into the InvestX Labs codebase without breaking any existing functionality.
