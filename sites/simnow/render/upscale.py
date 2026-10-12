"""4x upscale a photo with Real-ESRGAN, using only numpy and pillow.

    python3 -I upscale.py RealESRGAN_x4plus.pth in.jpg out.png

Weights: RealESRGAN_x4plus.pth from github.com/xinntao/Real-ESRGAN releases
(BSD-3-Clause), sha256 4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1.
The .pth file is read directly (a zip holding a pickle and raw tensors), so
PyTorch isn't needed. The network is the standard RRDBNet (23 blocks), run on
the CPU in overlapping tiles.
"""
import pickle
import sys
import time
import zipfile

import numpy as np
from PIL import Image

# ------------------------------------------------------------------ weights

_DTYPES = {'FloatStorage': np.float32, 'HalfStorage': np.float16, 'DoubleStorage': np.float64,
           'LongStorage': np.int64, 'IntStorage': np.int32}


def load_pth(path):
    zf = zipfile.ZipFile(path)
    names = zf.namelist()
    prefix = names[0].split('/')[0]
    pkl = next(n for n in names if n.endswith('data.pkl'))

    class StorageType:
        def __init__(self, name):
            self.dtype = _DTYPES[name]

    def rebuild_tensor(storage, offset, size, stride, *args):
        item = storage.itemsize
        return np.lib.stride_tricks.as_strided(storage[offset:], shape=tuple(size),
                                               strides=tuple(s * item for s in stride)).copy()

    class Unpickler(pickle.Unpickler):
        def find_class(self, module, name):
            if module == 'torch._utils' and name == '_rebuild_tensor_v2':
                return rebuild_tensor
            if module == 'torch' and name.endswith('Storage'):
                return StorageType(name)
            if module == 'collections' and name == 'OrderedDict':
                import collections
                return collections.OrderedDict
            raise pickle.UnpicklingError(f'unexpected global {module}.{name}')

        def persistent_load(self, pid):
            _, stype, key, _location, _numel = pid
            raw = zf.read(f'{prefix}/data/{key}')
            return np.frombuffer(raw, dtype=stype.dtype)

    state = Unpickler(zf.open(pkl)).load()
    return state.get('params_ema', state.get('params', state))


# ------------------------------------------------------------------ network

def conv(x, wb):
    """3x3 conv, stride 1, padding 1. x: (C, H, W) float32; wb: (weight, bias)."""
    W, b = wb
    C, H, Wd = x.shape
    O = W.shape[0]
    xp = np.pad(x, ((0, 0), (1, 1), (1, 1)))
    cols = np.empty((C, 3, 3, H, Wd), np.float32)
    for i in range(3):
        for j in range(3):
            cols[:, i, j] = xp[:, i:i + H, j:j + Wd]
    out = W.reshape(O, C * 9) @ cols.reshape(C * 9, H * Wd)
    out += b[:, None]
    return out.reshape(O, H, Wd)


def lrelu(x):
    return np.where(x > 0, x, x * 0.2)


def up2(x):
    return x.repeat(2, axis=1).repeat(2, axis=2)


def rrdbnet(p, x):
    g = lambda name: (p[name + '.weight'].astype(np.float32), p[name + '.bias'].astype(np.float32))  # noqa: E731
    feat = conv(x, g('conv_first'))
    h = feat
    for n in range(23):
        r = h
        for k in (1, 2, 3):
            pre = f'body.{n}.rdb{k}.'
            y = r
            parts = [y]
            for c in (1, 2, 3, 4):
                parts.append(lrelu(conv(np.concatenate(parts, 0), g(pre + f'conv{c}'))))
            y5 = conv(np.concatenate(parts, 0), g(pre + 'conv5'))
            r = y5 * 0.2 + r
        h = r * 0.2 + h
    feat = feat + conv(h, g('conv_body'))
    feat = lrelu(conv(up2(feat), g('conv_up1')))
    feat = lrelu(conv(up2(feat), g('conv_up2')))
    return conv(lrelu(conv(feat, g('conv_hr'))), g('conv_last'))


def upscale(p, img, tile=96, pad=10):
    a = np.asarray(img, dtype=np.float32).transpose(2, 0, 1) / 255.0
    _, H, W = a.shape
    out = np.zeros((3, H * 4, W * 4), np.float32)
    t0 = time.time()
    tiles = [(y, x) for y in range(0, H, tile) for x in range(0, W, tile)]
    for i, (y0, x0) in enumerate(tiles):
        y1, x1 = min(y0 + tile, H), min(x0 + tile, W)
        py0, px0, py1, px1 = max(y0 - pad, 0), max(x0 - pad, 0), min(y1 + pad, H), min(x1 + pad, W)
        o = rrdbnet(p, a[:, py0:py1, px0:px1])
        oy, ox = (y0 - py0) * 4, (x0 - px0) * 4
        out[:, y0 * 4:y1 * 4, x0 * 4:x1 * 4] = o[:, oy:oy + (y1 - y0) * 4, ox:ox + (x1 - x0) * 4]
        print(f'tile {i + 1}/{len(tiles)} {time.time() - t0:.0f}s', flush=True)
    return Image.fromarray((np.clip(out.transpose(1, 2, 0), 0, 1) * 255 + 0.5).astype(np.uint8))


def main():
    weights, src, dst = sys.argv[1:4]
    p = load_pth(weights)
    upscale(p, Image.open(src).convert('RGB')).save(dst)


if __name__ == '__main__':
    main()
