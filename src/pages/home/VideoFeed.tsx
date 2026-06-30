import React, { useRef, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useVideos, useWebConfig } from "@/hooks/useConfigQueries";
import { useFavoritesStore } from "@/store";
import {
  formatLarkPrice,
  generatePropertySlug,
  getLarkAttachmentUrl,
  getLarkVideoUrl,
} from "@/services/api";
import type { IVideo, IVideoProperty } from "@/types";
import { ROUTES, WEB_APP_URL } from "@/constants";
import iconHeart from "@/assets/icons/social/heart.svg";
import iconComment from "@/assets/icons/social/comment.svg";
import iconPhone from "@/assets/icons/social/phone.svg";
import iconShare from "@/assets/icons/social/share.svg";
import iconZalo from "@/assets/icons/social/zalo.svg";
import "./VideoFeed.css";

// Property's first photo, used as <video poster> so the screen never goes
// black while the actual video data is still loading.
function getVideoPosterUrl(property: IVideoProperty | null): string | null {
  const thumb = (property?.tai_len_hinh_anh_cua_bds ?? []).find(
    (img) => !img?.type?.startsWith("video/"),
  );
  return thumb ? getLarkAttachmentUrl(thumb.url) : null;
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
        onClick={() => phone && window.open(`tel:${phone}`, "_self")}
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
  const location =
    property.vi_tri?.full_address ??
    property.duong_khu_dan_cu_neu_khong_co_de_trong?.full_address ??
    property.dia_chi_cu_the ??
    "";
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

const FeedItem = forwardRef<HTMLDivElement, FeedItemProps>(({ video, active, preload }, ref) => {
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = video.video ? getLarkVideoUrl(video.video) : null;
  const posterUrl = getVideoPosterUrl(video.lark_property ?? null);

  // iOS WebKit (the Zalo Mini App webview) caps the number of concurrently
  // mounted <video> elements — mounting one per feed item crashes/silently
  // drops playback once the list grows. Only the active item and its
  // immediate neighbours (preload !== "none") get a real <video>; everything
  // else falls back to the poster image, which has no such limit.
  const mountVideo = preload !== "none";

  // Playback never starts on its own — only pause/rewind when the item
  // scrolls out of view, so returning to it always shows the play button.
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
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const retry = () => {
    setHasError(false);
    setReady(false);
    videoRef.current?.load();
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
            <path d="M12 8v5M12 16h.01" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p>Không tải được video</p>
          <span>Chạm để thử lại</span>
        </div>
      ) : posterUrl ? (
        <img src={posterUrl} alt="" className="vfeed-item__video" />
      ) : (
        <div className="vfeed-item__placeholder" />
      )}

      {/* Skeleton shimmer — shown until the first frame is actually decoded */}
      {mountVideo && !hasError && !ready && (
        <div className="vfeed-item__skeleton" />
      )}

      {/* Play icon overlay — shown once loaded and whenever paused */}
      {mountVideo && !hasError && ready && !playing && (
        <div className="vfeed-item__play-overlay" onClick={togglePlay}>
          <svg width="64" height="64" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.4)" />
            <polygon points="10,7.5 18,12 10,16.5" fill="#fff" />
          </svg>
        </div>
      )}

      {/* Buffering spinner — shown while playback is stalled on data */}
      {playing && buffering && (
        <div className="vfeed-item__buffering">
          <div className="vfeed-spinner" />
        </div>
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
  const { data: videos, isLoading } = useVideos();
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Native scroll events fire many times per frame during a fast swipe —
  // batch them to at most once per animation frame instead of recomputing
  // and re-rendering the whole list on every tick.
  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = feedRef.current;
      if (!el) return;
      setActiveIndex(Math.round(el.scrollTop / el.clientHeight));
    });
  };

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="vfeed-root">
      <div className="vfeed-feed" ref={feedRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="vfeed-spinner-wrap">
            <div className="vfeed-spinner" />
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
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <polygon points="10,9 16,12 10,15" fill="rgba(255,255,255,0.3)" />
            </svg>
            <p>Chưa có video nào</p>
          </div>
        ) : (
          videos.map((v, i) => {
            const distance = Math.abs(i - activeIndex);
            const preload: Preload = distance === 0 ? "auto" : distance === 1 ? "metadata" : "none";
            return (
              <FeedItem key={v.id} video={v} active={i === activeIndex} preload={preload} />
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
