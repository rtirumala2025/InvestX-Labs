#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up Supabase environment..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase --save-dev"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to the supabase directory
cd "$(dirname "$0")"

# Initialize Supabase if not already initialized
if [ ! -f "config.toml" ]; then
    echo "⚙️  Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start Supabase services
echo "🚀 Starting Supabase services..."
supabase start

# Check if the migration has already been applied
MIGRATION_FILE="migrations/20240101000000_initial_schema.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo "🔁 Applying database migrations..."
    supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres"
    
    # Apply migrations
    for file in migrations/*.sql; do
        echo "📄 Applying migration: $file"
        psql -h localhost -p 54322 -U postgres -d postgres -f "$file"
    done
    
    echo "✅ Database migrations applied successfully"
else
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Print connection details
echo ""
echo "✨ Supabase setup complete!"
echo ""
echo "🌐 Supabase Studio: http://localhost:3000"
echo "🔌 Connection details:"
echo "   Host: localhost"
echo "   Port: 54322"
echo "   Database: postgres"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
echo "🔑 Update your .env file with these credentials:"
echo "   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5pmUvmsWx4z5z8fXr1V5W3JzX1lX8Q"
echo ""
echo "🚀 Start your application and connect to the local Supabase instance!"

# Make the script executable
chmod +x setup.sh
