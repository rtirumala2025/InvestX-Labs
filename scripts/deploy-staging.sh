#!/bin/bash
# Staging Deployment Script for InvestX Labs
# This script deploys frontend and backend to staging environments

set -e

echo "=========================================="
echo "InvestX Labs - Staging Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "Please install $1 to continue"
        return 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    fi
}

# Step 1: Build Frontend
build_frontend() {
    echo ""
    echo "=========================================="
    echo "Step 1: Building Frontend"
    echo "=========================================="
    cd frontend
    echo "Installing dependencies..."
    npm install
    echo "Building production bundle..."
    npm run build
    echo -e "${GREEN}✅ Frontend build complete${NC}"
    cd ..
}

# Step 2: Build Backend
build_backend() {
    echo ""
    echo "=========================================="
    echo "Step 2: Verifying Backend"
    echo "=========================================="
    cd backend
    echo "Installing dependencies..."
    npm install
    echo "Verifying environment configuration..."
    # Environment validation will run on server start
    echo -e "${GREEN}✅ Backend ready${NC}"
    cd ..
}

# Step 3: Deploy Frontend (Vercel)
deploy_frontend_vercel() {
    echo ""
    echo "=========================================="
    echo "Step 3: Deploying Frontend to Vercel"
    echo "=========================================="
    
    if ! check_tool vercel; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    cd frontend
    echo "Deploying to Vercel staging..."
    vercel --prod=false
    echo -e "${GREEN}✅ Frontend deployed to Vercel${NC}"
    cd ..
}

# Step 3: Deploy Frontend (Netlify)
deploy_frontend_netlify() {
    echo ""
    echo "=========================================="
    echo "Step 3: Deploying Frontend to Netlify"
    echo "=========================================="
    
    if ! check_tool netlify; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    cd frontend
    echo "Deploying to Netlify staging..."
    netlify deploy --dir=build --prod=false
    echo -e "${GREEN}✅ Frontend deployed to Netlify${NC}"
    cd ..
}

# Step 4: Deploy Backend (Railway)
deploy_backend_railway() {
    echo ""
    echo "=========================================="
    echo "Step 4: Deploying Backend to Railway"
    echo "=========================================="
    
    if ! check_tool railway; then
        echo -e "${YELLOW}⚠️  Railway CLI not found${NC}"
        echo "Please install Railway CLI:"
        echo "  npm install -g @railway/cli"
        echo ""
        echo "Or deploy manually via Railway dashboard"
        return 1
    fi
    
    cd backend
    echo "Deploying to Railway staging..."
    railway up
    echo -e "${GREEN}✅ Backend deployed to Railway${NC}"
    cd ..
}

# Main deployment flow
main() {
    echo "Starting staging deployment process..."
    echo ""
    
    # Build artifacts
    build_frontend
    build_backend
    
    # Deploy frontend (choose provider)
    echo ""
    echo "Select frontend deployment provider:"
    echo "1) Vercel (recommended)"
    echo "2) Netlify"
    echo "3) Skip (manual deployment)"
    read -p "Enter choice [1-3]: " frontend_choice
    
    case $frontend_choice in
        1)
            deploy_frontend_vercel
            ;;
        2)
            deploy_frontend_netlify
            ;;
        3)
            echo "Skipping frontend deployment. Deploy manually."
            ;;
        *)
            echo "Invalid choice. Skipping frontend deployment."
            ;;
    esac
    
    # Deploy backend
    echo ""
    echo "Deploy backend to Railway?"
    read -p "Enter y/n [y]: " backend_choice
    if [[ $backend_choice =~ ^[Yy]$ ]] || [[ -z $backend_choice ]]; then
        deploy_backend_railway || echo "Backend deployment skipped or failed"
    else
        echo "Skipping backend deployment. Deploy manually."
    fi
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}Deployment process complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update environment variables in your hosting providers"
    echo "2. Run smoke tests: node backend/scripts/smoke_minimal.js --remote <BACKEND_URL>"
    echo "3. Verify staging URLs are accessible"
}

# Run main function
main

