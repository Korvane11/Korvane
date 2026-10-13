# Web exports of the two Library of Congress photos (Carol M. Highsmith, public domain).
#   python3 -I export_photos.py <dir with saguaro-4000.jpg and aerial-4000.jpg> <assets/photos>
# The 4000 px sources were downscaled from the TIFF originals, LC-DIG-highsm-55932 and -55770
# (tile.loc.gov/storage-services/master/pnp/highsm/55900/55932a.tif, .../55700/55770a.tif).
import sys
from PIL import Image, ImageEnhance
Image.MAX_IMAGE_PIXELS = None
SRC, OUT = sys.argv[1], sys.argv[2]
sag = Image.open(f'{SRC}/saguaro-4000.jpg').convert('RGB')     # 4000 x 2559
aer = Image.open(f'{SRC}/aerial-4000.jpg').convert('RGB')      # 4000 x 2667

def save(im, name, w, q=80):
    im = im.copy()
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=q, method=6)
    im.save(f'{OUT}/{name}.jpg', quality=q + 2, optimize=True, progressive=True)
    print(name, im.size)

# hero, whole frame: CSS covers and positions it
save(sag, 'hero-2400', 2400); save(sag, 'hero-1400', 1400)
# phone: tall crop centred on the saguaro (x ~ 51 %), keeping sky above and brush below
H = sag.height; w = round(H * 2 / 3); cx = round(0.51 * sag.width)
save(sag.crop((cx - w // 2, 0, cx + w // 2, H)), 'hero-phone', 1080)
# window-cleaning card: the clouds only, upper right
save(sag.crop((1500, 150, 3900, 1500)), 'card-sky', 1200)
# commercial card: downtown Tucson
save(aer.crop((1100, 700, 3500, 2050)), 'card-downtown', 1200)
# about band: the city with the Santa Catalinas
save(aer.crop((0, 0, 4000, 2000)), 'tucson-2000', 2000)
# link preview, 1200 x 630
c = sag.crop((300, 500, 300 + 3600, 500 + 1890)).resize((1200, 630), Image.LANCZOS)
c.save(f'{OUT}/og-photo.jpg', quality=86); print('og-photo', c.size)
