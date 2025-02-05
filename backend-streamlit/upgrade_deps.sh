#!/bin/bash

echo "🔄 Starting dependency upgrade process..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🚀 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip itself
echo "⬆️  Upgrading pip..."
python3 -m pip install --upgrade pip

# Get all current dependencies with versions
echo "📝 Backing up current requirements..."
pip freeze > requirements.backup.txt

# Upgrade all packages
echo "🔄 Upgrading all packages..."
python3 -m pip install --upgrade -r requirements.txt

# Generate new requirements file with updated versions
echo "📝 Updating requirements.txt with new versions..."
pip freeze > requirements.txt.new

# Show diff between old and new requirements
echo "📊 Changes in dependencies:"
diff requirements.backup.txt requirements.txt.new

# Replace old requirements with new ones
mv requirements.txt.new requirements.txt
rm requirements.backup.txt

echo "✅ Upgrade complete! New versions are saved in requirements.txt"
echo "🔍 Please test the application to ensure everything works correctly." 