#!/bin/bash

# HRMS Environment Setup Script
# This script helps set up the environment configuration for HRMS

set -e

echo "=========================================="
echo "HRMS Environment Setup"
echo "=========================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy example file
echo "📋 Copying .env.example to .env..."
cp .env.example .env

echo "✅ .env file created!"
echo ""
echo "=========================================="
echo "Configuration Steps"
echo "=========================================="
echo ""
echo "1. Database Configuration"
echo "   Edit .env and set:"
echo "   - DB_NAME"
echo "   - DB_USER"
echo "   - DB_PASSWORD"
echo "   - DB_HOST"
echo "   - DB_PORT"
echo ""
echo "2. Security Configuration"
echo "   Generate a new SECRET_KEY:"
echo "   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
echo ""
echo "3. Email Configuration"
echo "   For development: Keep EMAIL_BACKEND as console"
echo "   For production: Configure SMTP settings"
echo ""
echo "4. Onboarding Configuration"
echo "   Set ORGANIZATION_NAME and PORTAL_URL"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Edit .env file with your configuration"
echo "2. Validate configuration:"
echo "   python manage.py validate_config --summary"
echo ""
echo "3. Setup database:"
echo "   python manage.py migrate"
echo "   python manage.py createsuperuser"
echo ""
echo "4. Run development server:"
echo "   python manage.py runserver"
echo ""
echo "For detailed documentation, see:"
echo "- ENVIRONMENT_VARIABLES.md"
echo "- DEPLOYMENT.md"
echo "- ONBOARDING_CONFIGURATION.md"
echo ""
