"""
Аккуратная нарезка поз Шуни из листа public/shunya/shunya-poses.png.

- удаляем ТОЛЬКО белый фон, связанный с краями (flood по меткам) — светлая
  шерсть/глаза-блики внутри не дырявятся;
- лёгкий фезеринг альфы;
- автонарезка по связным областям: каждая поза кропается по своим реальным
  границам (полные уши!), без ручных прямоугольников.

Запуск: py -3.9 tools/cut_poses.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "shunya")
SRC = os.path.join(ROOT, "shunya-poses.png")

img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
h, w = arr.shape[:2]

# 1. Маска «почти белое» (кремовая шерсть #FFF6EC имеет min=236 — не попадёт).
mn = arr[:, :, :3].astype(np.int16).min(axis=2)
white = mn >= 238

# 2. Удаляем только тот белый, что связан с краями картинки (это фон).
lbl, _ = ndimage.label(white)
border = set(lbl[0, :]).union(lbl[-1, :], lbl[:, 0], lbl[:, -1])
border.discard(0)
bg = np.isin(lbl, list(border))
arr[:, :, 3] = np.where(bg, 0, 255).astype(np.uint8)

# 3. Лёгкий фезеринг краёв альфы.
arr[:, :, 3] = np.array(
    Image.fromarray(arr[:, :, 3]).filter(ImageFilter.GaussianBlur(0.7))
)
out = Image.fromarray(arr, "RGBA")

# 4. Связные области корги (по альфе) -> 5 крупнейших.
solid = arr[:, :, 3] > 40
clbl, _ = ndimage.label(solid)
counts = np.bincount(clbl.ravel())
counts[0] = 0
labels = [i for i in np.argsort(counts)[::-1] if counts[i] > 8000][:5]

comps = []
for lab in labels:
    ys, xs = np.where(clbl == lab)
    comps.append(
        {
            "lab": int(lab),
            "bbox": (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())),
            "cy": float(ys.mean()),
            "cx": float(xs.mean()),
        }
    )

assert len(comps) == 5, f"ожидалось 5 поз, найдено {len(comps)}"

# 5. Раскладываем по позициям: верх (2), центр (1), низ (2).
by_y = sorted(comps, key=lambda c: c["cy"])
top_row = sorted(by_y[:2], key=lambda c: c["cx"])
middle = by_y[2]
bottom_row = sorted(by_y[3:], key=lambda c: c["cx"])
mapping = {
    "wave": top_row[0],
    "grumpy": top_row[1],
    "happy": middle,
    "sneaky": bottom_row[0],
    "surprised": bottom_row[1],
}

# 6. Кроп каждой позы по её реальным границам + небольшой отступ.
PAD = 12
for name, c in mapping.items():
    x0, y0, x1, y1 = c["bbox"]
    x0 = max(0, x0 - PAD)
    y0 = max(0, y0 - PAD)
    x1 = min(w, x1 + PAD)
    y1 = min(h, y1 + PAD)
    # оставляем только пиксели этой позы (без фрагментов соседей в рамке)
    only = arr.copy()
    only[:, :, 3] = np.where(clbl == c["lab"], arr[:, :, 3], 0).astype(np.uint8)
    crop = Image.fromarray(only, "RGBA").crop((x0, y0, x1, y1))
    crop.save(os.path.join(ROOT, f"pose-{name}-cut.png"))
    print(f"{name}: {x1 - x0}x{y1 - y0}")

print("done")
