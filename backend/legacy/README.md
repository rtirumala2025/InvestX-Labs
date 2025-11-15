# Legacy Code Archive

⚠️ **WARNING: This directory is archived and not part of the current MVP**

This directory contains archived legacy Python backend code that is **NOT** used by the current Node.js/Express backend.

## Status

- ❌ **Not included in MVP**
- ❌ **Not imported at runtime**
- ❌ **Not actively maintained**
- ✅ **Preserved for reference/historical purposes**

## Contents

The `ai-investment-backend` subdirectory contains the previous Python-based backend implementation. This code has been superseded by the current Node.js implementation in the parent directories.

## Migration Notes

If you need functionality from this legacy code:
1. Check the current Node.js implementation first (e.g., `backend/ai-system/`, `backend/controllers/`)
2. The current system uses Supabase for data storage instead of the previous database
3. AI features are handled via OpenRouter API integration
4. Market data uses Alpha Vantage API with Supabase caching

## Do Not Import

**DO NOT** import or reference any code from this directory in:
- Main backend application code
- Frontend code
- Production deployments
- Active development work

This directory exists solely for historical reference.

