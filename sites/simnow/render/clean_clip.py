"""Clean a TikTok clip for the background: cut the end card, paint out the
watermark, turn it upright, and encode the MP4 and WebM the site plays (full
quality, plus a lighter pair for phones).

    python3 -I clean_clip.py SRC.mp4 OUT_DIR --frames 382 --switch 150 \
        --box-a 0,455,150,570 --box-b 440,765,576,875 --rotate ccw

--frames  how many frames to keep (the end card starts after them)
--switch  the frame where the watermark jumps from box A to box B
--box-a/b x0,y0,x1,y1 around each watermark position, in the source frame
--rotate  ccw / cw / none: TikTok clips of landscape footage are often
          stored on their side in a vertical frame

The watermark is found, not boxed: within each box, the pixels that stay
bright across every frame of that stretch are the overlay (the footage moves,
the watermark doesn't). Only those pixels, grown by a few px, are repainted
(OpenCV inpaint), so the picture around them is untouched. Needs numpy,
opencv-python-headless and ffmpeg (libx264, libvpx-vp9).
"""
import argparse
import os
import subprocess

import cv2
import numpy as np


def probe(src):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout
    w, h = out.strip().split(',')[:2]
    return int(w), int(h)


def frames(src, w, h, n):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-frames:v', str(n), '-f', 'rawvideo',
                          '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    while True:
        buf = p.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


def overlay_mask(stack, box, w, h):
    x0, y0, x1, y1 = box
    darkest = stack[:, y0:y1, x0:x1].max(axis=3).min(axis=0)   # dimmest brightest-channel per pixel
    mask = np.zeros((h, w), np.uint8)
    mask[y0:y1, x0:x1] = (darkest > 140).astype(np.uint8) * 255
    return cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--frames', type=int, required=True)
    ap.add_argument('--switch', type=int, required=True)
    ap.add_argument('--box-a', required=True); ap.add_argument('--box-b', required=True)
    ap.add_argument('--rotate', choices=['ccw', 'cw', 'none'], default='none')
    a = ap.parse_args()
    box = lambda s: [int(v) for v in s.split(',')]
    w, h = probe(a.src)
    stack = np.stack(list(frames(a.src, w, h, a.frames)))
    m_a = overlay_mask(stack[:a.switch], box(a.box_a), w, h)
    m_b = overlay_mask(stack[a.switch:], box(a.box_b), w, h)
    both = cv2.max(m_a, m_b)

    os.makedirs(a.out, exist_ok=True)
    master = os.path.join(a.out, 'master.mp4')
    vf = {'ccw': ['-vf', 'transpose=2'], 'cw': ['-vf', 'transpose=1'], 'none': []}[a.rotate]
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}',
                            '-r', '30', '-i', '-', *vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12',
                            '-pix_fmt', 'yuv420p', master], stdin=subprocess.PIPE)
    for i, f in enumerate(stack):
        m = both if abs(i - a.switch) <= 3 else (m_a if i < a.switch else m_b)
        enc.stdin.write(cv2.inpaint(f, m, 6, cv2.INPAINT_TELEA).tobytes())
    enc.stdin.close(); enc.wait()

    # drive-phone: the same frames at about half the bitrate, for the phone layout (the band across
    # the top), where the picture is already enlarged and the difference doesn't show; it starts
    # sooner on cell data
    for name, crf_h264, crf_vp9 in (('drive', 21, 32), ('drive-phone', 27, 38)):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libx264', '-preset', 'slow',
                        '-crf', str(crf_h264), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                        os.path.join(a.out, f'{name}.mp4')], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0',
                        '-crf', str(crf_vp9), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
                        os.path.join(a.out, f'{name}.webm')], check=True)
    print('wrote drive.mp4|webm and drive-phone.mp4|webm in', a.out)


if __name__ == '__main__':
    main()
