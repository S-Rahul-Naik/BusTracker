from PIL import Image, ImageDraw, ImageFont

# Create icon (1024x1024)
icon = Image.new('RGB', (1024, 1024), color='#2563eb')
draw = ImageDraw.Draw(icon)
try:
    font = ImageFont.truetype("arial.ttf", 150)
except:
    font = ImageFont.load_default()
draw.text((512, 512), "🚌", fill='white', anchor='mm', font=font)
icon.save('assets/icon.png')

# Create adaptive icon (1024x1024)
adaptive = Image.new('RGB', (1024, 1024), color='#2563eb')
draw2 = ImageDraw.Draw(adaptive)
draw2.text((512, 512), "🚌", fill='white', anchor='mm', font=font)
adaptive.save('assets/adaptive-icon.png')

# Create splash (1284x2778)
splash = Image.new('RGB', (1284, 2778), color='#2563eb')
splash.save('assets/splash.png')

# Create favicon (48x48)
favicon = Image.new('RGB', (48, 48), color='#2563eb')
favicon.save('assets/favicon.png')

print("✅ All icons created successfully!")
