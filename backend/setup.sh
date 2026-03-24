#!/bin/bash
set -e

echo "=================================="
echo "Ather Feedback Monitor - Setup"
echo "=================================="

# Check for Turso CLI
if ! command -v turso &> /dev/null; then
    echo "Installing Turso CLI..."
    curl -sSfL https://get.tur.so/install.sh | bash
    export PATH="$HOME/.turso/bin:$PATH"
fi

echo ""
echo "Step 1: Getting your database credentials..."
echo ""

# Get database URL from user
read -p "Enter your Turso database URL (libsql://...turso.io): " DB_URL
read -p "Enter your Turso auth token: " AUTH_TOKEN

# Test connection
echo ""
echo "Testing connection..."
turso db shell "$DB_URL" --token "$AUTH_TOKEN" "SELECT 1" 2>/dev/null && echo "✓ Connection successful!" || echo "✗ Connection failed - check your credentials"

echo ""
echo "Step 2: Setting up schema..."
turso db shell "$DB_URL" --token "$AUTH_TOKEN" < ../libsql/schema.sql && echo "✓ Schema created!" || echo "Schema may already exist (that's fine)"

echo ""
echo "Step 3: Creating backend .env file..."
cat > .env << EOF
TURSO_URL=$DB_URL
TURSO_AUTH_TOKEN=$AUTH_TOKEN
EOF
echo "✓ Backend .env created!"

echo ""
echo "Step 4: Creating frontend .env.local file..."
cd ../frontend
cat > .env.local << EOF
TURSO_URL=$DB_URL
TURSO_AUTH_TOKEN=$AUTH_TOKEN
EOF
echo "✓ Frontend .env.local created!"

echo ""
echo "=================================="
echo "Setup complete!"
echo "=================================="
echo ""
echo "To run the scraper:"
echo "  cd backend && source venv/bin/activate && python main.py"
echo ""
echo "To run the frontend:"
echo "  cd frontend && npm run dev"
echo ""
