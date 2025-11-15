# InvestX Labs - Complete Directory Map

**Generated:** November 3, 2025  
**Purpose:** Visual overview of project structure for cleanup and organization

---

## 🎯 Key Findings

### ⚠️ Duplicated Files
- **Backend Supabase Clients** (4 versions): `supabaseClient.js`, `supabaseClient 2.js`, `supabaseClient.new.js`, `supabaseClientEnhanced.js`
- **Context Directories** (2 locations): `/contexts/` and `/context/`
- **Dashboard Components**: Multiple Dashboard files in different locations
- **AI Service Files**: Duplicated `aiService.js` in multiple service folders

### 🔐 Auth-Related Files (Highlighted)
- **Frontend**: AuthContext.js, auth.js (API), LoginForm.jsx, SignupForm.jsx, ProtectedRoute.jsx
- **Backend**: Supabase auth services, Firebase admin SDK files
- **Config**: Firebase rules, Supabase migrations

### 📁 Misplaced Files
- **Root-level SQL files** (should be in migrations/): 11+ migration SQL files
- **Multiple test files** at root level
- **Documentation scattered** across root, docs/, and subdirectories

---

## 📂 Complete Directory Structure

```
InvestX Labs/
│
├── 📄 Configuration Files (Root)
│   ├── package.json (root workspace)
│   ├── package-lock.json
│   ├── .gitignore
│   └── README.md
│
├── 🗂️ FRONTEND/ (React Application)
│   ├── 📦 Configuration
│   │   ├── package.json
│   │   ├── jest.config.js
│   │   ├── tailwind.config.js
│   │   └── verify-auth-consolidation.js
│   │
│   ├── 📂 public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── env.js
│   │
│   ├── 📂 src/ (204 files total)
│   │   ├── 📄 Entry Points
│   │   │   ├── index.js (main entry)
│   │   │   ├── index.css
│   │   │   ├── App.jsx
│   │   │   ├── App.css
│   │   │   └── setupProxy.js
│   │   │
│   │   ├── 🎨 Styles/
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   ├── tailwind.css
│   │   │   ├── liquid-glass.css
│   │   │   └── liquid-glass-enhanced.css
│   │   │
│   │   ├── 🔐 Auth & Context (⚠️ DUPLICATED STRUCTURE)
│   │   │   │
│   │   │   ├── contexts/ (Folder 1)
│   │   │   │   ├── 🔑 AuthContext.js ⭐
│   │   │   │   ├── AppContext.jsx
│   │   │   │   ├── ChatContext.jsx
│   │   │   │   └── MarketContext.jsx
│   │   │   │
│   │   │   └── context/ (Folder 2 - ⚠️ DUPLICATE)
│   │   │       ├── PortfolioContext.js
│   │   │       ├── ThemeContext.js
│   │   │       └── UserContext.js
│   │   │
│   │   ├── 🧩 Components/
│   │   │   ├── auth/ 🔐
│   │   │   │   ├── 🔑 LoginForm.jsx ⭐
│   │   │   │   ├── 🔑 SignupForm.jsx ⭐
│   │   │   │   └── 🔑 ProtectedRoute.jsx ⭐
│   │   │   │
│   │   │   ├── chat/ (10 files)
│   │   │   │   ├── AIChat.jsx
│   │   │   │   ├── AIChat.jsx.backup (⚠️ backup file)
│   │   │   │   ├── AIChat.module.css
│   │   │   │   ├── ChatInterface.jsx
│   │   │   │   ├── ChatInterface.css
│   │   │   │   ├── ChatInterfaceDemo.jsx
│   │   │   │   ├── FloatingChatButton.jsx
│   │   │   │   ├── FloatingChatButton.css
│   │   │   │   ├── __tests__/ (2 files)
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── dashboard/ (8 files)
│   │   │   │   ├── Dashboard.js (⚠️ duplicate)
│   │   │   │   ├── Dashboard.jsx (⚠️ duplicate)
│   │   │   │   ├── AISuggestions.jsx
│   │   │   │   ├── PortfolioPerformance.jsx
│   │   │   │   ├── QuickActions.jsx
│   │   │   │   ├── QuickStats.jsx
│   │   │   │   ├── RecentActivity.jsx
│   │   │   │   └── UserProfile.jsx
│   │   │   │
│   │   │   ├── portfolio/ (5 files)
│   │   │   │   ├── AddAssetForm.jsx
│   │   │   │   ├── AssetAllocation.jsx
│   │   │   │   ├── PortfolioChart.jsx
│   │   │   │   ├── PortfolioSummary.jsx
│   │   │   │   └── TransactionHistory.jsx
│   │   │   │
│   │   │   ├── ai-suggestions/ (4 files)
│   │   │   │   ├── AIExplanation.jsx
│   │   │   │   ├── SuggestionCard.jsx
│   │   │   │   ├── SuggestionDetails.jsx
│   │   │   │   └── SuggestionsList.jsx
│   │   │   │
│   │   │   ├── education/ (6 files)
│   │   │   │   ├── ArticleList.jsx
│   │   │   │   ├── CourseCard.jsx
│   │   │   │   ├── LearningPath.jsx
│   │   │   │   ├── ProgressTracker.jsx
│   │   │   │   ├── QuizComponent.jsx
│   │   │   │   └── VideoPlayer.jsx
│   │   │   │
│   │   │   ├── onboarding/ (6 files)
│   │   │   │   ├── ExperienceStep.jsx
│   │   │   │   ├── GoalsStep.jsx
│   │   │   │   ├── OnboardingFlow.jsx
│   │   │   │   ├── ProgressIndicator.jsx
│   │   │   │   ├── RiskToleranceStep.jsx
│   │   │   │   └── welcomeData.js
│   │   │   │
│   │   │   ├── market/
│   │   │   │   └── MarketTicker.jsx
│   │   │   │
│   │   │   ├── common/ (14 files)
│   │   │   │   ├── Button.jsx, Card.jsx, ErrorBoundary.jsx
│   │   │   │   ├── GlassButton.jsx, GlassCard.jsx
│   │   │   │   ├── LoadingSpinner.jsx, Modal.jsx
│   │   │   │   ├── Navbar.jsx, Sidebar.jsx, Toast.jsx
│   │   │   │   └── (+ 4 more components)
│   │   │   │
│   │   │   ├── ui/ (14 files)
│   │   │   │   ├── Alert.jsx, Badge.jsx, Chart.jsx
│   │   │   │   ├── Input.jsx, Select.jsx, Tooltip.jsx
│   │   │   │   └── (+ 8 more UI components)
│   │   │   │
│   │   │   ├── debug/ (3 files in components/)
│   │   │   ├── dev/ (DevTools.jsx)
│   │   │   ├── diagnostic/ (DiagnosticFlow.jsx)
│   │   │   ├── privacy/ (PrivacySettings.jsx)
│   │   │   │
│   │   │   └── Standalone Components
│   │   │       ├── Dashboard.jsx (⚠️ another duplicate)
│   │   │       ├── ConnectionTester.jsx
│   │   │       ├── LearningCenter.jsx
│   │   │       ├── MarketTrends.jsx
│   │   │       └── GlassCard.jsx
│   │   │
│   │   ├── 📄 Pages/ (15 files)
│   │   │   ├── 🔑 LoginPage.jsx ⭐
│   │   │   ├── 🔑 SignupPage.jsx ⭐
│   │   │   ├── 🔑 ForgotPasswordPage.jsx ⭐
│   │   │   ├── 🔑 ResetPasswordPage.jsx ⭐
│   │   │   ├── 🔑 VerifyEmailPage.jsx ⭐
│   │   │   ├── HomePage.jsx (+ HomePage.css)
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── EducationPage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── PortfolioPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── PrivacyPage.jsx
│   │   │   ├── SuggestionsPage.jsx
│   │   │   └── DiagnosticPage.jsx
│   │   │
│   │   ├── 🔌 Services/ (40+ files)
│   │   │   ├── 🔐 supabase/ ⭐
│   │   │   │   ├── 🔑 auth.js ⭐
│   │   │   │   ├── 🔑 config.js ⭐
│   │   │   │   └── db.js
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── 🔑 auth.js ⭐ (⚠️ another auth file)
│   │   │   │   ├── aiService.js
│   │   │   │   ├── apiClient.js
│   │   │   │   ├── apiConfig.js
│   │   │   │   ├── index.js
│   │   │   │   ├── marketService.js
│   │   │   │   └── mcpService.js
│   │   │   │
│   │   │   ├── ai/ (6 files)
│   │   │   │   ├── aiService.js (⚠️ duplicate name)
│   │   │   │   ├── claudeAPI.js
│   │   │   │   ├── explanationGenerator.js
│   │   │   │   ├── llamaService.js
│   │   │   │   ├── riskAssessment.js
│   │   │   │   └── suggestionEngine.js
│   │   │   │
│   │   │   ├── chat/ (17 files)
│   │   │   │   ├── api.js
│   │   │   │   ├── chatService.js
│   │   │   │   ├── conversationManager.js
│   │   │   │   ├── multiDeviceSync.js
│   │   │   │   ├── performanceMonitor.js
│   │   │   │   ├── promptTemplates.js
│   │   │   │   ├── queryClassifier.js
│   │   │   │   ├── responseFormatter.js
│   │   │   │   ├── responseTemplates.js
│   │   │   │   ├── safetyGuardrails.js
│   │   │   │   ├── systemPromptBuilder.js
│   │   │   │   ├── testScenarios.js
│   │   │   │   ├── __tests__/ (4 test files)
│   │   │   │   └── FINALIZATION_SUMMARY.md
│   │   │   │
│   │   │   ├── market/ (4 files)
│   │   │   │   ├── marketData.js
│   │   │   │   ├── marketService.js
│   │   │   │   ├── stockPrices.js
│   │   │   │   └── yahooFinance.js
│   │   │   │
│   │   │   ├── portfolio/ (3 files)
│   │   │   │   ├── diversificationAnalysis.js
│   │   │   │   ├── performanceTracking.js
│   │   │   │   └── portfolioCalculations.js
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── mockAnalytics.js
│   │   │   │
│   │   │   ├── chat.js (⚠️ standalone, may duplicate)
│   │   │   ├── marketService.js (⚠️ duplicate name)
│   │   │   ├── userService.js
│   │   │   └── socket.js
│   │   │
│   │   ├── 🪝 Hooks/ (13 files)
│   │   │   ├── 🔑 useAuth.js ⭐
│   │   │   ├── useFirestore.js
│   │   │   ├── useChat.js
│   │   │   ├── useInvestIQChat.js
│   │   │   ├── useLlamaAI.js
│   │   │   ├── useMarketData.js
│   │   │   ├── useAlphaVantageData.js
│   │   │   ├── usePortfolio.js
│   │   │   ├── useAIRecommendations.js
│   │   │   ├── useAISuggestions.js
│   │   │   ├── useMCPContext.js
│   │   │   ├── useLocalStorage.js
│   │   │   └── useTranslation.js
│   │   │
│   │   ├── 🛠️ Utils/ (14 files)
│   │   │   ├── constants.js
│   │   │   ├── dateUtils.js
│   │   │   ├── envTest.js
│   │   │   ├── firebaseErrorHandler.js
│   │   │   ├── formatting.js
│   │   │   ├── helpers.js
│   │   │   ├── logger.js
│   │   │   ├── networkMonitor.js
│   │   │   ├── popupBlocker.js
│   │   │   ├── portfolioSimulator.js
│   │   │   ├── tokenCounter.js
│   │   │   ├── validation.js
│   │   │   ├── verificationLogger.js
│   │   │   └── __tests__/ (1 test file)
│   │   │
│   │   ├── 📦 Assets/
│   │   │   ├── educationalContent.js
│   │   │   ├── investmentStrategies.js
│   │   │   ├── mockData.js
│   │   │   └── riskProfiles.js
│   │   │
│   │   ├── 🌍 Locales/ (i18n)
│   │   │   ├── en.json
│   │   │   └── es.json
│   │   │
│   │   ├── 🔥 Firebase/
│   │   │   └── config.js
│   │   │
│   │   ├── 🐛 Debug/
│   │   │   ├── index.js
│   │   │   └── components/ (3 components)
│   │   │
│   │   ├── 📚 Docs/
│   │   │   └── LLAMA_INTEGRATION.md
│   │   │
│   │   ├── config/ (empty directory)
│   │   ├── lib/ (empty directory)
│   │   │
│   │   └── Standalone Files
│   │       ├── EnvTest.js
│   │       ├── HomePage.jsx (⚠️ duplicate with pages/)
│   │       ├── GlassCard.jsx (⚠️ duplicate)
│   │       └── theme.js
│   │
│   ├── 📂 scripts/ (3 files)
│   │   ├── testIntegration.js
│   │   ├── testMarketService.js
│   │   └── testUserService.js
│   │
│   ├── 🧪 __tests__/ (2 files)
│   │   ├── marketService.test.js
│   │   └── userService.test.js
│   │
│   └── 🧪 tests/ (11 files)
│       ├── accessibility/
│       │   └── accessibility.test.js
│       ├── components/
│       │   ├── Button.test.js
│       │   ├── GlassButton.test.js
│       │   └── GlassCard.test.js
│       ├── hooks/
│       │   ├── useAuth.test.js
│       │   ├── useFirestore.test.js
│       │   ├── usePortfolio.test.js
│       │   └── useTranslation.test.js
│       ├── services/
│       │   └── firebase.test.js
│       ├── utils/
│       │   └── testUtils.js
│       └── setup.js
│
├── 🗂️ BACKEND/ (Node.js + Python)
│   ├── 📦 Configuration
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── index.js (main entry)
│   │   ├── README.md
│   │   └── requirements-llama.txt
│   │
│   ├── 🔐 Firebase Admin SDK Files ⭐
│   │   └── investx-labs-firebase-adminsdk-fbsvc-6f47476ace.json
│   │
│   ├── 🤖 ai-services/ (Node.js) ⚠️ DUPLICATED SUPABASE CLIENTS
│   │   ├── aiEngine.js
│   │   ├── dataInsights.js
│   │   ├── ruleBase.js
│   │   ├── testConnection.js
│   │   ├── utils.js
│   │   ├── 🔑 supabaseClient.js ⭐ (PRIMARY)
│   │   ├── ⚠️ supabaseClient 2.js (DUPLICATE #1)
│   │   ├── ⚠️ supabaseClient.new.js (DUPLICATE #2)
│   │   └── ⚠️ supabaseClientEnhanced.js (DUPLICATE #3)
│   │
│   ├── 🐍 ai_services/ (Python - 2 files)
│   │   ├── analytics.py
│   │   └── queryClassifier.py
│   │
│   ├── 🐍 ai-investment-backend/ (Python Full Stack)
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── nginx.conf
│   │   ├── README.md
│   │   ├── API_DOCUMENTATION.md
│   │   ├── DEPLOYMENT.md
│   │   ├── FRONTEND_INTEGRATION.md
│   │   │
│   │   ├── api/ (5 files)
│   │   │   ├── app.py (main Flask/FastAPI app)
│   │   │   ├── chat_endpoints.py
│   │   │   ├── data_endpoints.py
│   │   │   ├── llama_scout_endpoints.py
│   │   │   └── user_endpoints.py
│   │   │
│   │   ├── chatbot/ (4 files)
│   │   │   ├── chat_handler.py
│   │   │   ├── conversation_manager.py
│   │   │   ├── personality.py
│   │   │   └── safety_filters.py
│   │   │
│   │   ├── config/ (3 files)
│   │   │   ├── model_config.py
│   │   │   ├── prompts.py
│   │   │   └── settings.py
│   │   │
│   │   ├── database/ (3 files)
│   │   │   ├── cache_manager.py
│   │   │   ├── firestore_client.py
│   │   │   └── vector_store.py
│   │   │
│   │   ├── ai_models/
│   │   │   ├── recommendation_engine.py
│   │   │   ├── fine_tuning/
│   │   │   │   └── model_trainer.py
│   │   │   └── rag_system/ (3 files)
│   │   │       ├── context_retriever.py
│   │   │       ├── response_generator.py
│   │   │       └── vector_search.py
│   │   │
│   │   ├── ai_services/
│   │   │   └── llama_scout/ (1 file)
│   │   │
│   │   ├── data_pipeline/
│   │   │   ├── scheduler.py
│   │   │   ├── processors/ (3 files)
│   │   │   └── scrapers/ (3 files)
│   │   │
│   │   ├── services/
│   │   │   └── supabase_service.py
│   │   │
│   │   └── utils/ (3 files)
│   │       ├── error_handlers.py
│   │       ├── logging_config.py
│   │       └── validation.py
│   │
│   ├── 🔌 routes/ (5 files)
│   │   ├── ai.js
│   │   ├── aiRoute.js
│   │   ├── market.js
│   │   ├── mcp.js
│   │   └── mcpRoute.js
│   │
│   ├── 📊 market/
│   │   └── marketService.js
│   │
│   ├── 🔗 mcp/ (MCP Server Integration)
│   │   ├── mcpServer.js
│   │   ├── contextManager.js
│   │   └── adapters/
│   │       ├── alphaVantageAdapter.js
│   │       ├── openrouterAdapter.js
│   │       └── supabaseAdapter.js
│   │
│   ├── 🔧 middleware/
│   │   └── requestTracker.js
│   │
│   ├── 🛠️ utils/ (2 files)
│   │   ├── cache.js
│   │   └── logger.js
│   │
│   ├── ⚙️ config/
│   │   └── env.validation.js
│   │
│   ├── 🗄️ supabase/
│   │   ├── config.toml
│   │   ├── setup.sh
│   │   ├── migrations/ (6 SQL files)
│   │   │   ├── 20240101000000_initial_schema.sql
│   │   │   ├── 20240102000000_add_rpc_functions.sql
│   │   │   ├── 20240103000000_add_market_data.sql
│   │   │   ├── 20240104000000_add_alpha_vantage.sql
│   │   │   ├── 20240105000000_add_user_preferences.sql
│   │   │   └── 20240106000000_add_chat_history.sql
│   │   │
│   │   └── functions/
│   │       └── fetch-alpha-vantage/ (1 TypeScript file)
│   │
│   ├── ⚡ functions/ (Cloud Functions)
│   │   ├── index.js
│   │   ├── package.json
│   │   ├── jest.config.js
│   │   ├── chat/
│   │   │   ├── chatService.js
│   │   │   ├── chatService.test.js
│   │   │   ├── latencyMiddleware.js
│   │   │   └── testChatService.js
│   │   ├── __tests__/
│   │   │   └── chat.test.js
│   │   └── coverage/ (test coverage reports)
│   │
│   ├── 📜 scripts/ (24 files)
│   │   ├── Migration Scripts
│   │   │   ├── apply_rpc_functions.js
│   │   │   ├── apply_supabase_migrations.js
│   │   │   ├── run_migrations.js
│   │   │   └── run_migrations.cjs
│   │   │
│   │   ├── Supabase Testing
│   │   │   ├── checkSupabaseRPCs.js
│   │   │   ├── debug_supabase.cjs
│   │   │   ├── diagnose_supabase.mjs
│   │   │   ├── test_connection.js
│   │   │   ├── test_connection_detailed.mjs
│   │   │   ├── test_enhanced_connection.mjs
│   │   │   ├── test_got_connection.js
│   │   │   ├── test_minimal_supabase.js
│   │   │   ├── test_supabase_connection.js
│   │   │   ├── test_supabase_connection.cjs
│   │   │   └── test_supabase_connection 2.js (⚠️ duplicate)
│   │   │
│   │   ├── WebSocket Servers
│   │   │   ├── basic-websocket-server.js
│   │   │   └── simple-websocket-server.js
│   │   │
│   │   ├── MCP Testing
│   │   │   ├── start-mcp-server.js
│   │   │   └── test_mcp_pipeline.js
│   │   │
│   │   ├── AI Testing
│   │   │   ├── test_ai_engine.js
│   │   │   └── test_ai_pipeline.js
│   │   │
│   │   ├── HTTPS Testing
│   │   │   ├── test_https.js
│   │   │   └── test_https.mjs
│   │   │
│   │   └── test_utils.js
│   │
│   ├── 🧪 test-server/ (Python)
│   │   └── test_server.py
│   │
│   └── 📋 logs/ (Application Logs)
│       ├── application.log
│       ├── application-2025-10-21.log
│       ├── application-2025-10-22.log
│       ├── error.log
│       ├── error-2025-10-21.log
│       ├── error-2025-10-22.log
│       ├── error-2025-10-23.log
│       ├── exceptions.log
│       └── test-error-*.json (6 files)
│
├── 📜 scripts/ (Root Level - 7 files)
│   ├── add-sample-data.js
│   ├── firestore-setup.js
│   ├── initialize-database.js
│   ├── migrate-data-to-firestore.js
│   ├── seed-landing-features.js
│   ├── test-database.js
│   └── 🔐 investx-labs-firebase-adminsdk-fbsvc-11abdc63e1.json ⭐
│
├── ⚙️ config/ (Root Level)
│   ├── env.example
│   ├── 🔐 firebase.json ⭐
│   ├── 🔐 firestore.indexes.json ⭐
│   ├── 🔐 firestore.rules ⭐
│   └── 🔐 storage.rules ⭐
│
├── 📚 docs/
│   ├── api/
│   │   └── endpoints.md
│   ├── deployment/
│   │   └── production.md
│   └── setup/
│       ├── environment.md
│       ├── database.md
│       ├── authentication.md
│       ├── firebase.md
│       └── supabase.md
│
├── 🗄️ Database/Migration Files (⚠️ SHOULD BE ORGANIZED)
│   ├── ⚠️ Root Level SQL Files (11 files - should be in migrations/)
│   │   ├── BULLETPROOF_FIX.sql
│   │   ├── check_functions.sql
│   │   ├── COMPLETE_SUPABASE_MIGRATION.sql
│   │   ├── CREATE_TABLES_FIRST.sql
│   │   ├── FINAL_DEFINITIVE_FIX.sql
│   │   ├── FINAL_FIX.sql
│   │   ├── FIX_TYPO.sql
│   │   ├── FIXED_MIGRATION.sql
│   │   ├── INSERT_API_KEY.sql
│   │   ├── MINIMAL_TEST.sql
│   │   ├── SIMPLE_MIGRATION.sql
│   │   ├── SUPER_SIMPLE_FIX.sql
│   │   ├── test_functions.sql
│   │   ├── ULTIMATE_FIX.sql
│   │   └── VERIFY_SETUP.sql
│   │
│   └── Root Level JS Test Files
│       ├── apply_supabase_migration.js
│       ├── test_supabase_connection.js
│       ├── test-auth-complete.js
│       ├── test-safety.js
│       └── test-safety.cjs
│
├── 📝 Documentation Files (Root Level - 40+ files)
│   ├── 📖 Main Documentation
│   │   ├── README.md (main)
│   │   ├── PROJECT_STRUCTURE.md
│   │   └── ENV_TEMPLATE.md
│   │
│   ├── 🔐 Authentication Documentation ⭐
│   │   ├── AUTH_AUDIT_REPORT.md
│   │   ├── AUTH_CONSOLIDATION_SUMMARY.md
│   │   ├── AUTH_FIXES_COMPLETE.md
│   │   ├── AUTH_IMPLEMENTATION_COMPLETE.md
│   │   ├── AUTH_TESTING_COMPLETE_SUMMARY.md
│   │   ├── SUPABASE_AUTH_AUDIT_REPORT.md
│   │   └── SUPABASE_MANUAL_SETUP_CHECKLIST.md
│   │
│   ├── 🗄️ Database & Migration Docs
│   │   ├── SUPABASE_MIGRATION_GUIDE.md
│   │   ├── SUPABASE_MIGRATION_URGENT.md
│   │   ├── CONNECTION_FIXES_SUMMARY.md
│   │   └── FIX_CONNECTION_ISSUES.md
│   │
│   ├── 🚀 Deployment & Setup
│   │   ├── APPLICATION_READY.md
│   │   ├── CURRENT_STATUS_AND_NEXT_STEPS.md
│   │   ├── FINAL_STATUS_SUMMARY.md
│   │   ├── PORT_CONFIGURATION_READY.md
│   │   ├── QUICK_START_GUIDE.md
│   │   ├── QUICK_FIX_GUIDE.md
│   │   ├── STEP_BY_STEP_FIX.md
│   │   └── WEBSOCKET_SERVER_READY.md
│   │
│   ├── 🔌 API & Integration
│   │   ├── ALPHA_VANTAGE_SETUP.md
│   │   ├── ALPHA_VANTAGE_FILE_GUIDE.md
│   │   ├── INTEGRATION_STATUS.md
│   │   ├── INTEGRATION_VALIDATION.md
│   │   ├── MARKET_SERVICE_IMPLEMENTATION.md
│   │   └── FRONTEND_FRAMEWORK_AUDIT.md
│   │
│   ├── 🧪 Testing Documentation
│   │   ├── TESTING_QUICK_REFERENCE.md
│   │   ├── QUICK_TEST_REFERENCE.md
│   │   └── USER_SERVICE_TESTING_GUIDE.md
│   │
│   ├── 📦 Service Documentation
│   │   ├── USER_SERVICE_ARCHITECTURE.md
│   │   ├── USER_SERVICE_CHECKLIST.md
│   │   ├── USER_SERVICE_IMPLEMENTATION.md
│   │   └── USER_SERVICE_VALIDATION_COMPLETE.md
│   │
│   ├── 🎯 Phase Documentation
│   │   ├── PHASE_2_COMPLETE.md
│   │   ├── PHASE_3_ALPHA_VANTAGE_COMPLETE.md
│   │   ├── PHASE_3_GIT_SUMMARY.md
│   │   ├── README_PHASE_2.md
│   │   └── GIT_COMMIT_SUMMARY.md
│   │
│   └── 🔧 Frontend & Implementation
│       ├── FRONTEND_FIXED.md
│       ├── IMPLEMENTATION_COMPLETE.txt
│       └── START_CHAT_INTEGRATION.sh
│
├── 📋 logs/ (Root Level)
│   ├── application.log
│   ├── application-2025-10-21.log
│   ├── error.log
│   ├── error-2025-10-21.log
│   └── exceptions.log
│
└── 📦 Dependencies
    └── node_modules/ (root workspace)

```

---

## 📊 File Statistics

### Frontend
- **Total Source Files:** 204
- **JavaScript Files:** 91
- **JSX Components:** 88
- **CSS Files:** 19
- **Test Files:** 13
- **Services:** 40+
- **Hooks:** 13
- **Pages:** 15
- **Components:** 50+

### Backend
- **Node.js Files:** 50+
- **Python Files:** 32
- **Configuration Files:** 10+
- **SQL Migration Files:** 6 (organized) + 14 (scattered)
- **Test Scripts:** 24
- **Documentation:** 40+ markdown files

---

## 🔍 Detailed Issue Analysis

### 1. **Duplicate Supabase Client Files** ⚠️
**Location:** `/backend/ai-services/`
```
✅ supabaseClient.js          (Keep - Primary)
❌ supabaseClient 2.js         (Delete)
❌ supabaseClient.new.js       (Delete)
❌ supabaseClientEnhanced.js   (Evaluate - may have features to merge)
```

### 2. **Duplicate Context Directories** ⚠️
**Locations:** `/frontend/src/contexts/` AND `/frontend/src/context/`
```
contexts/ (4 files):
  - AuthContext.js  🔐
  - AppContext.jsx
  - ChatContext.jsx
  - MarketContext.jsx

context/ (3 files):
  - PortfolioContext.js
  - ThemeContext.js
  - UserContext.js
```
**Recommendation:** Merge into single `contexts/` directory

### 3. **Duplicate Dashboard Files** ⚠️
```
✅ /components/dashboard/Dashboard.jsx (Keep - Component directory)
❌ /components/dashboard/Dashboard.js  (Remove - duplicate)
❌ /components/Dashboard.jsx           (Remove - standalone duplicate)
```

### 4. **Multiple Auth Service Files** ⚠️
```
Primary Auth Files (Keep):
  ✅ /contexts/AuthContext.js
  ✅ /services/supabase/auth.js
  ✅ /hooks/useAuth.js

Secondary/Duplicate (Review):
  ⚠️ /services/api/auth.js (May handle different auth aspects)
```

### 5. **Scattered SQL Migration Files** ⚠️
**Issue:** 14+ SQL files at root level instead of organized in migrations folder
**Recommendation:** Move to `/backend/supabase/migrations/archive/` or delete if obsolete

### 6. **Backup Files** ⚠️
```
❌ /frontend/src/components/chat/AIChat.jsx.backup (Delete)
❌ /backend/scripts/test_supabase_connection 2.js (Delete)
```

### 7. **Duplicate Service Files** ⚠️
```
aiService.js locations:
  - /services/ai/aiService.js
  - /services/api/aiService.js

marketService.js locations:
  - /services/market/marketService.js
  - /services/marketService.js (standalone)

Recommendation: Consolidate into organized service structure
```

---

## ✅ Recommended Cleanup Actions

### Priority 1: Critical Cleanup
1. **Delete duplicate Supabase clients** (keep primary only)
2. **Merge context directories** (contexts/ and context/)
3. **Remove backup files** (.backup, " 2" files)
4. **Archive or delete scattered SQL files** at root

### Priority 2: Organization
5. **Consolidate duplicate service files**
6. **Remove duplicate Dashboard components**
7. **Organize documentation** into `/docs` subdirectories
8. **Clean up test files** (move to appropriate test directories)

### Priority 3: Structure Improvement
9. **Standardize auth file locations**
10. **Review and consolidate log files**
11. **Remove obsolete migration attempts**
12. **Document final service architecture**

---

## 🏗️ Recommended Final Structure

```
InvestX Labs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/          (merged, single location)
│   │   ├── utils/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── api/
│   ├── services/
│   ├── routes/
│   ├── supabase/
│   │   └── migrations/        (all SQL files here)
│   └── ...
│
├── docs/                      (all documentation)
│   ├── api/
│   ├── auth/
│   ├── deployment/
│   ├── migration/
│   └── setup/
│
├── scripts/                   (utility scripts only)
└── config/                    (configuration files)
```

---

**Generated:** November 3, 2025  
**Next Steps:** Use this map to guide systematic cleanup and reorganization

