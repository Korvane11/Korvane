"""favicon.ico (16, 32, 48) from the tab icons make_icons.cjs wrote."""
import os
from PIL import Image
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'brand')
im = Image.open(os.path.join(B, 'tab-64.png')).convert('RGBA')
im.save(os.path.join(B, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
for f in ('tab-64.png', 'tab-32.png'):
    os.remove(os.path.join(B, f))
