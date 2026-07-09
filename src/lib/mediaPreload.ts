// Preload & cache media cho VideoFeed (và nơi khác cần).
//
// - Ảnh: new Image() + Set dedupe — ảnh nằm sẵn trong HTTP/memory cache khi
//   component thật render (mirror preloadImages bên web).
// - Video: KHÔNG dùng được fetch()+blob như VideoSection bên web — Directus
//   CORS chỉ allow origin web (nguyenthinhreal.org), origin webview Zalo
//   không có Access-Control-Allow-Origin nên fetch() bị chặn. Thay vào đó
//   warm bằng phần tử <video preload="auto"> ẩn (thẻ media không cần CORS):
//   bytes buffer về nằm trong HTTP cache (/assets có Cache-Control 30 ngày +
//   Accept-Ranges) nên <video> thật mount sau đó đọc lại từ cache thay vì
//   tải lại từ đầu.

const preloadedImages = new Set<string>();

export function preloadImages(urls: Array<string | null | undefined>): void {
  for (const url of urls) {
    if (!url || preloadedImages.has(url)) continue;
    preloadedImages.add(url);
    const img = new Image();
    img.src = url;
  }
}

// Chỉ warm tối đa 2 video một lúc — video BĐS có thể nặng (bản chưa resize
// lên tới vài chục MB), warm nhiều hơn vừa tranh băng thông với video đang
// phát vừa dễ vỡ bộ nhớ webview iOS.
const MAX_WARM_VIDEOS = 2;
// Map giữ thứ tự chèn → phần tử đầu tiên là cũ nhất (LRU đơn giản)
const warmVideos = new Map<string, HTMLVideoElement>();

function disposeWarmVideo(el: HTMLVideoElement): void {
  // Gỡ src + load() để huỷ request đang chạy và giải phóng buffer đã tải
  el.removeAttribute("src");
  el.load();
  el.remove();
}

export function preloadVideo(url: string | null | undefined): void {
  if (!url) return;
  const existing = warmVideos.get(url);
  if (existing) {
    // Refresh vị trí LRU — đang được quan tâm lại thì đừng evict sớm
    warmVideos.delete(url);
    warmVideos.set(url, existing);
    return;
  }
  while (warmVideos.size >= MAX_WARM_VIDEOS) {
    const oldest = warmVideos.entries().next().value;
    if (!oldest) break;
    disposeWarmVideo(oldest[1]);
    warmVideos.delete(oldest[0]);
  }
  const el = document.createElement("video");
  el.muted = true;
  el.setAttribute("playsinline", "");
  el.preload = "auto";
  el.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
  el.src = url;
  // iOS WebKit lười tải cho phần tử tách rời — gắn vào DOM (ẩn) để chắc
  // chắn request thật sự được bắn đi.
  document.body.appendChild(el);
  el.load();
  warmVideos.set(url, el);
}

// Gọi khi rời màn hình feed — trả lại băng thông/bộ nhớ cho phần còn lại
export function releaseWarmVideos(): void {
  for (const el of warmVideos.values()) disposeWarmVideo(el);
  warmVideos.clear();
}
