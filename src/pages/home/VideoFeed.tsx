import iconComment from "@/assets/icons/social/comment.svg";
import iconHeart from "@/assets/icons/social/heart.svg";
import iconPhone from "@/assets/icons/social/phone.svg";
import iconShare from "@/assets/icons/social/share.svg";
import iconZalo from "@/assets/icons/social/zalo.svg";
import { PageLayout } from "@/components/layout/PageLayout";
import { ROUTES, WEB_APP_URL } from "@/constants";
import { useVideos, useWebConfig } from "@/hooks/useConfigQueries";
import { preloadImages, preloadVideo, releaseWarmVideos } from "@/lib/mediaPreload";
import {
  formatLarkPrice,
  generatePropertySlug,
  getLarkMediaUrl,
  getLarkPropertyLocation,
  getLarkVideoUrl,
} from "@/services/api";
import { useFavoritesStore, useVideoFeedStore } from "@/store";
import type { IVideo, IVideoProperty } from "@/types";
import React, { forwardRef, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VideoFeed.css";

// Property's first photo, used as <video poster> so the screen never goes
// black while the actual video data is still loading.
function getVideoPosterUrl(property: IVideoProperty | null): string | null {
  const thumb = (property?.tai_len_hinh_anh_cua_bds ?? []).find(
    (img) => !!img?.id && !img?.type?.startsWith("video/"),
  );
  return thumb ? getLarkMediaUrl(thumb) : null;
}

/* ── Right-side action icon list ──────────────────────────── */

function ActionButtons({ property, active }: { property: IVideoProperty | null; active: boolean }) {
  const { data: webConfig } = useWebConfig();
  const isFav = useFavoritesStore((s) => s.isFavorite(property?.id ?? ""));
  const addFav = useFavoritesStore((s) => s.addFavorite);
  const removeFav = useFavoritesStore((s) => s.removeFavorite);

  const agentInfo = webConfig?.agent_info ?? null;
  const phone = agentInfo?.phone ?? "";
  const zalo = agentInfo?.zalo ?? phone;
  const slug = property ? generatePropertySlug(property.tieu_de, property.lark_record_id) : "";
  // Wiggle is a continuous CSS animation — only run it on the item the user
  // can actually see, otherwise every off-screen item burns CPU/GPU forever.
  const wiggleClass = active ? " vfeed-action-btn--wiggle" : "";

  const handleShare = async () => {
    const link = WEB_APP_URL && slug ? `${WEB_APP_URL}/listings/${slug}` : window.location.href;
    try {
      const { openShareSheet } = await import("zmp-sdk/apis");
      await openShareSheet({ type: "link", data: { link } });
    } catch {
      navigator.share?.({ title: property?.tieu_de ?? "", url: link });
    }
  };

  return (
    <div className="vfeed-actions">
      <button
        className={`vfeed-action-btn${wiggleClass}`}
        onClick={() => property && (isFav ? removeFav(property.id) : addFav(property.id))}
      >
        <img
          src={iconHeart}
          width={30}
          height={30}
          className={isFav ? "vfeed-icon vfeed-icon--heart-active" : "vfeed-icon"}
          alt="Yêu thích"
        />
        <span>Yêu thích</span>
      </button>

      <button
        className={`vfeed-action-btn${wiggleClass}`}
        onClick={() => phone && window.open(`sms:${phone}`, "_self")}
      >
        <img src={iconComment} width={30} height={30} className="vfeed-icon" alt="Bình luận" />
        <span>Bình luận</span>
      </button>

      <button className={`vfeed-action-btn${wiggleClass}`} onClick={handleShare}>
        <img src={iconShare} width={30} height={30} className="vfeed-icon" alt="Chia sẻ" />
        <span>Chia sẻ</span>
      </button>

      <button
        className={`vfeed-action-btn${wiggleClass}`}
        onClick={() => phone && window.open(`tel:${phone}`, "_self")}
      >
        <img src={iconPhone} width={30} height={30} className="vfeed-icon" alt="Gọi ngay" />
        <span>Gọi ngay</span>
      </button>

      <button
        className={`vfeed-action-btn${wiggleClass}`}
        onClick={() => zalo && window.open(`https://zalo.me/${zalo}`, "_blank")}
      >
        <img src={iconZalo} width={32} height={32} className="vfeed-icon--zalo" alt="Zalo" />
        <span>Zalo</span>
      </button>
    </div>
  );
}

/* ── Bottom property card ──────────────────────────────────── */

function VideoPropertyCard({ property }: { property: IVideoProperty | null }) {
  const navigate = useNavigate();
  if (!property) return null;

  const slug = generatePropertySlug(property.tieu_de, property.lark_record_id);
  const isRental = (property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "")
    .toLowerCase()
    .includes("thuê");
  const price =
    formatLarkPrice(property.gia_cho_thue_gia_ban ?? null) +
    (isRental && property.gia_cho_thue_gia_ban ? " /tháng" : "");
  // Chỉ hiện phường/quận/thành phố — không lộ địa chỉ chính xác (đồng bộ web)
  const location = getLarkPropertyLocation(property);
  const thumbUrl = getVideoPosterUrl(property);

  return (
    <div className="vfeed-card" onClick={() => navigate(ROUTES.DETAIL(slug))}>
      <div className="vfeed-card__img">
        {thumbUrl ? (
          <img src={thumbUrl} alt={property.tieu_de} />
        ) : (
          <div className="vfeed-card__img-placeholder" />
        )}
      </div>

      <div className="vfeed-card__body">
        <p className="vfeed-card__title">{property.tieu_de}</p>
        {price && <p className="vfeed-card__price">Chỉ từ {price}</p>}
        {location && (
          <p className="vfeed-card__location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#888">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {location}
          </p>
        )}
        <button
          className="vfeed-card__detail"
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.DETAIL(slug));
          }}
        >
          Xem chi tiết
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Feed item ─────────────────────────────────────────────── */

type Preload = "none" | "metadata" | "auto";

interface FeedItemProps {
  video: IVideo;
  active: boolean;
  preload: Preload;
}

// Người dùng đã chủ động bật tiếng chưa — nhớ xuyên suốt phiên để video sau
// thử autoplay CÓ tiếng luôn (iOS chỉ cho phát có tiếng sau khi đã có tương
// tác; nếu bị policy chặn thì tự rơi về muted).
const soundPref = { on: false };

const FeedItem = forwardRef<HTMLDivElement, FeedItemProps>(({ video, active, preload }, ref) => {
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(!soundPref.on);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = video.video ? getLarkVideoUrl(video.video) : null;
  const posterUrl = getVideoPosterUrl(video.lark_property ?? null);

  // iOS WebKit (the Zalo Mini App webview) caps the number of concurrently
  // mounted <video> elements — mounting one per feed item crashes/silently
  // drops playback once the list grows. Only the active item and its
  // immediate neighbours (preload !== "none") get a real <video>; everything
  // else falls back to the poster image, which has no such limit.
  const mountVideo = preload !== "none";

  // Autoplay kiểu TikTok: lướt tới item nào là phát luôn item đó. iOS chỉ
  // cho autoplay khi muted+playsinline → mặc định phát không tiếng; nếu
  // người dùng đã bật tiếng (soundPref) thì thử phát có tiếng trước, bị
  // policy chặn mới rơi về muted. play() cũng chính là cú hích buộc iOS
  // bắt đầu tải dữ liệu (WebKit bỏ qua preload).
  React.useEffect(() => {
    if (!active || !videoUrl || hasError) return;
    const el = videoRef.current;
    if (!el) return;
    el.preload = "auto";
    setBuffering(true);
    el.muted = !soundPref.on;
    setMuted(el.muted);
    el.play().catch(() => {
      el.muted = true;
      setMuted(true);
      el.play().catch(() => setBuffering(false));
    });
  }, [active, videoUrl, hasError]);

  // Pause/rewind khi item rời khỏi màn hình — quay lại sẽ autoplay từ đầu.
  React.useEffect(() => {
    if (active) return;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    setBuffering(false);
  }, [active]);

  // Reset error/ready state whenever the item leaves the mounted window, so
  // scrolling back to it gives the video a fresh attempt to load.
  React.useEffect(() => {
    if (!mountVideo) {
      setHasError(false);
      setReady(false);
    }
  }, [mountVideo]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    // play()/pause() can race (e.g. tap then immediately swipe away) —
    // an interrupted play() request rejects with AbortError, which is
    // harmless here but would otherwise surface as an unhandled rejection.
    if (el.paused) {
      // iOS WebKit hầu như không preload dữ liệu video — trước cú tap đầu
      // tiên el có thể chưa có byte nào (ready=false). Bật spinner ngay để
      // người dùng biết đang buffer thay vì tưởng app treo.
      if (!ready) setBuffering(true);
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const retry = () => {
    setHasError(false);
    setReady(false);
    videoRef.current?.load();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const nextMuted = !el.muted;
    el.muted = nextMuted;
    soundPref.on = !nextMuted;
    setMuted(nextMuted);
  };

  return (
    <div className="vfeed-item" ref={ref}>
      {mountVideo && videoUrl && !hasError ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          className="vfeed-item__video"
          playsInline
          muted={muted}
          preload={preload}
          loop
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onLoadedData={() => setReady(true)}
          onError={() => setHasError(true)}
        />
      ) : hasError ? (
        <div className="vfeed-item__error" onClick={retry}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <path
              d="M12 8v5M12 16h.01"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p>Không tải được video</p>
          <span>Chạm để thử lại</span>
        </div>
      ) : posterUrl ? (
        <img src={posterUrl} alt="" className="vfeed-item__video" />
      ) : (
        <div className="vfeed-item__placeholder" />
      )}

      {/* Skeleton shimmer — indicator loading duy nhất của feed (không dùng
          spinner). Có poster thì dùng bản sheen trong suốt quét ngang ĐÈ lên
          poster (pointer-events none nên không nuốt tap); không có poster
          mới dùng bản nền đặc. */}
      {mountVideo && !hasError && (buffering || (!ready && !posterUrl)) && (
        <div className={`vfeed-item__skeleton${posterUrl ? "" : " vfeed-item__skeleton--solid"}`} />
      )}

      {/* Play icon overlay — chỉ còn xuất hiện khi người dùng CHỦ ĐỘNG
          pause (autoplay lo phần phát); không đợi ready để luôn tap được. */}
      {mountVideo && !hasError && !playing && !buffering && (
        <div className="vfeed-item__play-overlay" onClick={togglePlay}>
          <svg width="64" height="64" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.4)" />
            <polygon points="10,7.5 18,12 10,16.5" fill="#fff" />
          </svg>
        </div>
      )}

      {/* Bật/tắt tiếng — autoplay bắt buộc khởi đầu muted (policy iOS),
          user bật tiếng 1 lần thì các video sau tự phát có tiếng luôn */}
      {mountVideo && !hasError && (
        <button className="vfeed-item__sound" onClick={toggleMute}>
          {muted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      )}

      <div className="vfeed-item__gradient" />

      <ActionButtons property={video.lark_property ?? null} active={active} />
      <VideoPropertyCard property={video.lark_property ?? null} />
    </div>
  );
});
FeedItem.displayName = "FeedItem";

/* ── Main feed ─────────────────────────────────────────────── */

export function VideoFeed() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useVideos();
  // flatMap tạo mảng mới mỗi render — memo theo `data` để effect preload
  // bên dưới chỉ chạy khi dữ liệu/vị trí thật sự đổi.
  const videos = useMemo(() => data?.pages.flatMap((p) => p.data), [data]);
  // Khởi tạo từ store để quay lại Trang chủ là đứng đúng video đang xem dở
  // (danh sách video do react-query cache cả phiên — xem useVideos); đọc 1
  // lần bằng getState thay vì subscribe để không double-render theo store.
  const [activeIndex, setActiveIndex] = useState(() => useVideoFeedStore.getState().activeIndex);
  const feedRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Khôi phục vị trí scroll đã lưu — chạy 1 lần ngay khi danh sách render
  // xong (layout effect để nhảy thẳng tới vị trí, không thấy màn nháy từ
  // video đầu). Clamp phòng khi danh sách đổi làm index cũ vượt biên.
  const restoredRef = useRef(false);
  React.useLayoutEffect(() => {
    if (restoredRef.current || !videos || videos.length === 0) return;
    restoredRef.current = true;
    const el = feedRef.current;
    const saved = Math.min(useVideoFeedStore.getState().activeIndex, videos.length - 1);
    if (!el || saved <= 0) return;
    el.scrollTop = saved * el.clientHeight;
    setActiveIndex(saved);
  }, [videos]);

  // Preload trước media của các item lân cận để lướt tới là có sẵn:
  // - poster (±2 item): ảnh nhẹ, nằm sẵn trong cache → không còn màn đen
  //   chờ ảnh lúc vừa lướt tới.
  // - video kế tiếp (hướng cuộn chủ đạo là xuống): warm buffer qua HTTP
  //   cache, item sau mount <video> là phát được gần như ngay.
  React.useEffect(() => {
    if (!videos || videos.length === 0) return;
    const posters: Array<string | null> = [];
    for (const i of [activeIndex + 1, activeIndex + 2, activeIndex - 1]) {
      const v = videos[i];
      if (v) posters.push(getVideoPosterUrl(v.lark_property ?? null));
    }
    preloadImages(posters);

    const next = videos[activeIndex + 1];
    if (next?.video) preloadVideo(getLarkVideoUrl(next.video));
  }, [videos, activeIndex]);

  // Rời màn feed thì nhả các video đang warm — trả băng thông/bộ nhớ
  React.useEffect(() => releaseWarmVideos, []);

  // Native scroll events fire many times per frame during a fast swipe —
  // batch them to at most once per animation frame instead of recomputing
  // and re-rendering the whole list on every tick.
  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = feedRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(index);
      // Lưu vị trí vào store (ngoài React render) — quay lại trang là đứng
      // đúng video này. Gọi qua getState để component không subscribe store.
      useVideoFeedStore.getState().setActiveIndex(index);

      // Load the next page once the user is within 3 items of the end,
      // so scrolling never outruns the data.
      if (videos && hasNextPage && !isFetchingNextPage && index >= videos.length - 3) {
        void fetchNextPage();
      }
    });
  };

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <PageLayout>
      <div className="vfeed-feed" ref={feedRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="vfeed-item">
            <div className="vfeed-item__skeleton vfeed-item__skeleton--solid" />
          </div>
        ) : !videos || videos.length === 0 ? (
          <div className="vfeed-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
              />
              <polygon points="10,9 16,12 10,15" fill="rgba(0,0,0,0.3)" />
            </svg>
            <p>Chưa có video nào</p>
          </div>
        ) : (
          videos.map((v, i) => {
            const distance = Math.abs(i - activeIndex);
            const preload: Preload = distance === 0 ? "auto" : distance === 1 ? "metadata" : "none";
            return <FeedItem key={v.id} video={v} active={i === activeIndex} preload={preload} />;
          })
        )}
      </div>
    </PageLayout>
  );
}
