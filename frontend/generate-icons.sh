#!/bin/bash

# Icon Generator Script for RecallAI
# This script helps generate .icns (macOS) and .ico (Windows) icons from a PNG source

echo "🎨 RecallAI Icon Generator"
echo "=========================="
echo ""

# Check if input file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: ./generate-icons.sh <path-to-png-file>"
    echo "Example: ./generate-icons.sh icon.png"
    echo ""
    echo "Requirements:"
    echo "  - PNG file (recommended 1024x1024 or larger)"
    echo "  - ImageMagick installed (brew install imagemagick)"
    echo "  - iconutil (comes with macOS)"
    exit 1
fi

SOURCE_PNG="$1"

# Check if source file exists
if [ ! -f "$SOURCE_PNG" ]; then
    echo "❌ Error: File '$SOURCE_PNG' not found"
    exit 1
fi

echo "📁 Source file: $SOURCE_PNG"
echo ""

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it:"
    echo "   brew install imagemagick"
    exit 1
fi

# Determine ImageMagick command
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Create output directory
ICONS_DIR="./build/icons"
mkdir -p "$ICONS_DIR"

# ========================================
# Generate Windows .ico file
# ========================================
echo "🪟 Generating Windows icon (icon.ico)..."
$CONVERT_CMD "$SOURCE_PNG" -resize 256x256 "$ICONS_DIR/icon.ico"

if [ $? -eq 0 ]; then
    echo "✅ Windows icon created: $ICONS_DIR/icon.ico"
else
    echo "❌ Failed to create Windows icon"
fi
echo ""

# ========================================
# Generate macOS .icns file
# ========================================
echo "🍎 Generating macOS icon (icon.icns)..."

# Create iconset directory
ICONSET_DIR="./icon.iconset"
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes
echo "  Creating icon sizes..."
sips -z 16 16     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
sips -z 1024 1024 "$SOURCE_PNG" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1

# Convert iconset to icns
echo "  Converting to .icns format..."
iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"

if [ $? -eq 0 ]; then
    echo "✅ macOS icon created: $ICONS_DIR/icon.icns"
    # Clean up
    rm -rf "$ICONSET_DIR"
else
    echo "❌ Failed to create macOS icon"
fi

echo ""
echo "🎉 Icon generation complete!"
echo ""
echo "Next steps:"
echo "1. Verify the icons in: $ICONS_DIR/"
echo "2. Run: npm run dist"
echo "3. Check the packaged app icon"
