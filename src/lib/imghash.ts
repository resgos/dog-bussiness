/**
 * Перцептивный dHash (difference hash) по data URL изображения.
 * 9×8 в градациях серого → 64 бита (сравнение соседних пикселей в строке) → 16 hex.
 * Только клиент (canvas/Image). Возвращает null вне браузера или при ошибке.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function dHash(dataUrl: string): Promise<string | null> {
  if (typeof document === "undefined" || !dataUrl) return null;
  try {
    const img = await loadImage(dataUrl);
    const W = 9;
    const H = 8;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);
    const gray: number[] = [];
    for (let i = 0; i < W * H; i++) {
      gray.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    }
    let bits = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W - 1; x++) {
        bits += gray[y * W + x] < gray[y * W + x + 1] ? "1" : "0";
      }
    }
    let hex = "";
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return null;
  }
}
