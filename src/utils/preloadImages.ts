const preloadedUrls = new Set<string>();

export function preloadImages(urls: (string | undefined | null)[]): void {
  for (const url of urls) {
    if (!url || preloadedUrls.has(url)) continue;
    preloadedUrls.add(url);
    const img = new Image();
    img.src = url;
  }
}
