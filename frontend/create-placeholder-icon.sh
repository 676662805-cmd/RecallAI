#!/bin/bash

# Create a simple placeholder icon for testing
# This creates a basic 1024x1024 PNG with "RecallAI" text

echo "🎨 Creating placeholder icon for testing..."

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not installed. Installing..."
    echo "Please run: brew install imagemagick"
    echo ""
    echo "Or download a PNG icon (1024x1024) and save it as 'icon-source.png'"
    echo "Then run: ./generate-icons.sh icon-source.png"
    exit 1
fi

# Determine ImageMagick command
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Create a simple placeholder icon
TEMP_ICON="temp-icon.png"

# Create a gradient background with text
$CONVERT_CMD -size 1024x1024 \
    -define gradient:angle=135 \
    gradient:'#4A90E2-#357ABD' \
    -gravity center \
    -pointsize 180 \
    -font "Helvetica-Bold" \
    -fill white \
    -annotate +0-50 'Recall' \
    -pointsize 160 \
    -annotate +0+100 'AI' \
    "$TEMP_ICON"

if [ $? -eq 0 ]; then
    echo "✅ Created placeholder PNG: $TEMP_ICON"
    echo ""
    echo "🔄 Generating icon files..."
    ./generate-icons.sh "$TEMP_ICON"
    
    # Clean up
    rm "$TEMP_ICON"
    
    echo ""
    echo "✨ Done! You can now run: npm run dist"
    echo ""
    echo "📝 Note: Replace build/icons/icon.icns and icon.ico with your own custom icons later"
else
    echo "❌ Failed to create placeholder icon"
    echo ""
    echo "Alternative: Create a 1024x1024 PNG manually and run:"
    echo "  ./generate-icons.sh your-icon.png"
fi
