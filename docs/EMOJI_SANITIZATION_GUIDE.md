# Emoji Sanitization Guide

This guide explains how to keep content emoji-free in the InvestX Labs application and how to whitelist icons if needed.

## Overview

The application includes a comprehensive emoji removal system to maintain a professional appearance. Emoji characters are automatically removed from:

- User-facing text content
- Static content files (HTML, Markdown, JSON)
- Database text fields
- Dynamically injected content (third-party widgets)

**Important:** Icon fonts (SVGs, Font Awesome, Material Icons, Lucide) are **NOT** affected by emoji sanitization.

## Architecture

### Components

1. **`stripEmojis()` utility** (`frontend/src/utils/stripEmojis.js`)
   - Core function that removes emoji Unicode characters
   - Uses modern Unicode property escapes with fallback
   - Exported functions: `stripEmojis()`, `sanitizeText()`, `hasEmojis()`

2. **DOM Sanitizer** (`frontend/src/utils/domEmojiSanitizer.js`)
   - Client-side script that sanitizes text nodes in the DOM
   - Automatically runs on page load and observes DOM mutations
   - Skips protected elements (script, style, textarea, input, code, SVG, icon fonts)

3. **Static Content Transformer** (`scripts/transform-static-content.js`)
   - Node.js script to sanitize static files
   - Processes HTML, Markdown, and JSON files
   - Supports dry-run and backup modes

4. **Database Migration** (`backend/supabase/migrations/20250120000000_sanitize_emoji_from_text_fields.sql`)
   - SQL migration that sanitizes existing database content
   - Creates backup tables for rollback capability
   - Includes PostgreSQL function `strip_emoji_from_text()`

## Usage

### For Developers

#### Sanitizing Text in Code

```javascript
import { stripEmojis, sanitizeText } from '../utils/stripEmojis';

// Basic usage
const cleanText = stripEmojis('Hello 👋 world 🌍');
// Returns: 'Hello  world '

// With whitespace normalization
const normalized = sanitizeText('Hello 👋  world 🌍');
// Returns: 'Hello world'
```

#### Sanitizing User Input

```javascript
import { stripEmojis } from '../utils/stripEmojis';

function handleUserInput(input) {
  // Sanitize before saving
  const sanitized = stripEmojis(input);
  // Save sanitized input to database
  saveToDatabase(sanitized);
}
```

#### Preserving Icons (Whitelisting)

If you need to preserve specific content from sanitization, use the `data-emoji-preserve` attribute:

```jsx
<div data-emoji-preserve="true">
  This content will not be sanitized, including any emoji 👋
</div>
```

**Note:** This should be used sparingly and only when absolutely necessary.

### Running Static Content Transformation

To sanitize static content files:

```bash
# Dry run (see what would change)
node scripts/transform-static-content.js --dry-run

# Apply changes with backup
node scripts/transform-static-content.js --backup

# Apply changes without backup
node scripts/transform-static-content.js
```

The script processes:
- `frontend/public/` - HTML files
- `frontend/src/` - Source files (HTML, Markdown, JSON)
- `docs/` - Documentation files

### Database Sanitization

To sanitize existing database content:

1. **Apply the migration:**
   ```bash
   # Using Supabase CLI
   cd backend
   supabase db push
   
   # Or manually in Supabase Dashboard SQL Editor
   # Run: backend/supabase/migrations/20250120000000_sanitize_emoji_from_text_fields.sql
   ```

2. **Verify the migration:**
   ```sql
   -- Check backup tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE '%_emoji_backup';
   ```

3. **Rollback if needed:**
   ```sql
   -- Run: backend/supabase/migrations/20250120000001_rollback_emoji_sanitization.sql
   ```

## Protected Elements

The DOM sanitizer automatically skips these elements:

- `<script>` tags
- `<style>` tags
- `<textarea>` elements
- `<input>` elements
- `<code>` and `<pre>` elements
- `<svg>` elements
- Elements with classes containing: `icon`, `fa-`, `material-icons`, `lucide`
- Elements with `data-emoji-preserve="true"` attribute

## Testing

### Unit Tests

```bash
# Run emoji utility tests
npm test -- stripEmojis.test.js

# Run DOM sanitizer tests
npm test -- domEmojiSanitizer.test.js
```

### Integration Tests

```bash
# Run integration tests
npm test -- emoji-sanitization.integration.test.js
```

## Best Practices

### 1. Sanitize at Input Time

Always sanitize user input before storing in the database:

```javascript
// ✅ Good
const sanitized = stripEmojis(userInput);
await saveToDatabase(sanitized);

// ❌ Bad
await saveToDatabase(userInput); // May contain emoji
```

### 2. Sanitize Before Display

Sanitize content before rendering, especially for user-generated content:

```javascript
// ✅ Good
<div>{stripEmojis(userContent)}</div>

// ❌ Bad
<div>{userContent}</div> // May display emoji
```

### 3. Use Icons Instead of Emoji

For UI elements, use icon libraries instead of emoji:

```jsx
// ✅ Good - Use icon library
import { CheckCircle } from 'lucide-react';
<CheckCircle className="text-green-500" />

// ❌ Bad - Don't use emoji
<span>✅ Done</span>
```

### 4. Preserve Code Examples

The sanitizer automatically skips `<code>` blocks, so code examples are safe:

```jsx
<code>
  console.log('Hello 👋'); // Emoji preserved in code blocks
</code>
```

## Troubleshooting

### Emoji Still Appearing

1. **Check if content is in a protected element:**
   - Verify the element isn't in `<script>`, `<style>`, `<code>`, etc.
   - Check if `data-emoji-preserve="true"` is set

2. **Verify DOM sanitizer is running:**
   ```javascript
   // Check console for initialization message
   // DOM sanitizer runs automatically in production
   ```

3. **Check database content:**
   - Ensure migration was applied
   - Verify backup tables exist

### Performance Concerns

The DOM sanitizer uses:
- Debounced mutation observer (100ms default)
- Efficient tree walking
- Skips protected elements early

If you notice performance issues:
- Increase debounce time: `initEmojiSanitizer({ debounceMs: 200 })`
- Disable mutation observer: `initEmojiSanitizer({ observeMutations: false })`

## Migration Checklist

When adding new text fields that might contain user content:

1. ✅ Add field to database migration backup
2. ✅ Update `strip_emoji_from_text()` function if needed
3. ✅ Sanitize in application code before saving
4. ✅ Add to integration tests
5. ✅ Update this documentation

## Rollback Procedure

If you need to rollback the database sanitization:

1. **Stop the application** (if running)

2. **Run rollback migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Run: backend/supabase/migrations/20250120000001_rollback_emoji_sanitization.sql
   ```

3. **Verify rollback:**
   ```sql
   -- Check a few records
   SELECT username FROM user_profiles LIMIT 5;
   ```

4. **Optional: Drop backup tables** (after confirming rollback success):
   ```sql
   DROP TABLE IF EXISTS public.user_profiles_emoji_backup;
   -- ... (other backup tables)
   ```

## Support

For questions or issues:
1. Check this documentation
2. Review test files for usage examples
3. Check migration SQL comments
4. Contact the development team

## Changelog

- **2025-01-20**: Initial implementation
  - Added `stripEmojis()` utility
  - Added DOM sanitizer
  - Added static content transformer
  - Added database migration
  - Added comprehensive tests

