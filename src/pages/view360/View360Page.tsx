import React, { useState, useEffect, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import iconHeart from "@/assets/icons/social/heart.svg";
import iconComment from "@/assets/icons/social/comment.svg";
import iconPhone from "@/assets/icons/social/phone.svg";
import iconShare from "@/assets/icons/social/share.svg";
import iconZalo from "@/assets/icons/social/zalo.svg";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWebConfig } from "@/hooks/useConfigQueries";
import { useLarkPropertiesView360 } from "@/hooks/useListingsQueries";
import {
  getLarkPropertyFirstImage,
  getLarkPropertyLocation,
  formatLarkPrice,
  generatePropertySlug,
} from "@/services/api";
import { useFavoritesStore } from "@/store";
import type { ILarkProperty } from "@/types";
import { ROUTES, WEB_APP_URL } from "@/constants";
import "./View360Page.css";

/* ── Action buttons ────────────────────────────────────── */

function ActionButtons({ property }: { property: ILarkProperty }) {
  const { data: webConfig } = useWebConfig();
  const isFav = useFavoritesStore((s) => s.isFavorite(property.id));
  const addFav = useFavoritesStore((s) => s.addFavorite);
  const removeFav = useFavoritesStore((s) => s.removeFavorite);

  const agentInfo = webConfig?.agent_info ?? null;
  const phone = agentInfo?.phone ?? property.so_dien_thoai_chu_nha ?? "";
  const zalo = agentInfo?.zalo ?? phone;
  const slug = generatePropertySlug(property.tieu_de, property.lark_record_id);

  const handleShare = async () => {
    const link = WEB_APP_URL ? `${WEB_APP_URL}/listings/${slug}` : window.location.href;
    try {
      const { openShareSheet } = await import("zmp-sdk/apis");
      await openShareSheet({ type: "link", data: { link } });
    } catch {
      navigator.share?.({ title: property.tieu_de, url: link });
    }
  };

  return (
    <div className="v360-actions">
      {/* Tim */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={() => (isFav ? removeFav(property.id) : addFav(property.id))}>
        <img
          src={iconHeart}
          width={30}
          height={30}
          className={isFav ? "v360-icon v360-icon--heart-active" : "v360-icon"}
          alt="Yêu thích"
        />
        <span>Yêu thích</span>
      </button>

      {/* Bình luận */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={() => phone && window.open(`tel:${phone}`, "_self")}>
        <img src={iconComment} width={30} height={30} className="v360-icon" alt="Bình luận" />
        <span>Bình luận</span>
      </button>

      {/* Chia sẻ */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={handleShare}>
        <img src={iconShare} width={30} height={30} className="v360-icon" alt="Chia sẻ" />
        <span>Chia sẻ</span>
      </button>

      {/* Gọi ngay */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={() => phone && window.open(`tel:${phone}`, "_self")}>
        <img src={iconPhone} width={30} height={30} className="v360-icon" alt="Gọi ngay" />
        <span>Gọi ngay</span>
      </button>

      {/* Zalo */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={() => zalo && window.open(`https://zalo.me/${zalo}`, "_blank")}>
        <img src={iconZalo} width={32} height={32} className="v360-icon--zalo" alt="Zalo" />
        <span>Zalo</span>
      </button>
    </div>
  );
}

/* ── Bottom property card ──────────────────────────────── */

function PropertyCard({
  property,
  onBook,
}: {
  property: ILarkProperty;
  onBook: () => void;
}) {
  const navigate = useNavigate();
  const image = getLarkPropertyFirstImage(property);
  const isRental = (property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "")
    .toLowerCase()
    .includes("thuê");
  const price =
    formatLarkPrice(property.gia_cho_thue_gia_ban) +
    (isRental && property.gia_cho_thue_gia_ban ? " /tháng" : "");
  const location = getLarkPropertyLocation(property);
  const area = property.dien_tich_m2_rong ?? property.dien_tich_m2_dai ?? null;
  const slug = generatePropertySlug(property.tieu_de, property.lark_record_id);

  return (
    <div className="v360-card" onClick={() => navigate(ROUTES.DETAIL(slug))}>
      {/* Thumbnail left */}
      <div className="v360-card__img">
        {image ? (
          <img src={image} alt={property.tieu_de} />
        ) : (
          <div className="v360-card__img-placeholder" />
        )}
      </div>

      {/* Info */}
      <div className="v360-card__body">
        <p className="v360-card__title">{property.tieu_de}</p>
        {price && <p className="v360-card__price">Chỉ từ {price}</p>}
        {location && (
          <p className="v360-card__location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#888">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {location}
          </p>
        )}
        <button
          className="v360-card__book"
          onClick={(e) => { e.stopPropagation(); onBook(); }}
        >
          Đặt ngay
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Feed item ─────────────────────────────────────────── */

interface FeedItemProps {
  property: ILarkProperty;
  active: boolean;
}

const FeedItem = forwardRef<HTMLDivElement, FeedItemProps>(({ property, active }, ref) => {
  const { data: webConfig } = useWebConfig();
  const agentInfo = webConfig?.agent_info ?? null;
  const phone = agentInfo?.phone ?? property.so_dien_thoai_chu_nha ?? "";
  const image = getLarkPropertyFirstImage(property);

  return (
    <div className="feed-item" ref={ref}>
      {/* 360 iframe – only rendered when this item is snapped into view */}
      {active && property.link_3d ? (
        <iframe
          src={property.link_3d}
          className="feed-item__frame"
          allowFullScreen
          title={property.tieu_de}
        />
      ) : (
        /* Thumbnail shown while scrolling / before snap */
        <div className="feed-item__thumb">
          {image ? (
            <img src={image} alt={property.tieu_de} className="feed-item__thumb-img" />
          ) : (
            <div className="feed-item__thumb-placeholder" />
          )}
          <div className="feed-item__gradient" />
          {/* Badge shown on inactive items so user knows it's 360 */}
          {!active && (
            <div className="feed-item__badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8" />
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.8" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="1.8" />
              </svg>
              <span>360°</span>
            </div>
          )}
        </div>
      )}

      <ActionButtons property={property} />

      <PropertyCard
        property={property}
        onBook={() => phone && window.open(`tel:${phone}`, "_self")}
      />
    </div>
  );
});
FeedItem.displayName = "FeedItem";

/* ── Main page ─────────────────────────────────────────── */

export function View360Page() {
  const { data: webConfig } = useWebConfig();
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  const statusActive = webConfig?.status_properties?.active ?? undefined;

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useLarkPropertiesView360(statusActive);

  const properties = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  /* Infinite scroll trigger at midpoint */
  const observerRef = useRef<IntersectionObserver | null>(null);
  const midpointRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    if (midpointRef.current) observerRef.current.observe(midpointRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, isLoadingMore, fetchNextPage, properties.length]);

  const midpointIndex = Math.max(0, Math.floor(properties.length / 2) - 1);

  /* Track which item is snapped into view */
  const handleScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(index);
  };

  return (
    <div className="view360-root">
      <div className="view360-feed" ref={feedRef} onScroll={handleScroll}>
        {loading ? (
          <div className="view360-spinner-wrap">
            <div className="view360-spinner" />
          </div>
        ) : properties.length === 0 ? (
          <div className="view360-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <ellipse
                cx="12"
                cy="12"
                rx="4"
                ry="9"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <line
                x1="3"
                y1="12"
                x2="21"
                y2="12"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
            </svg>
            <p>Chưa có tour 360° nào</p>
          </div>
        ) : (
          properties.map((p, i) => (
            <FeedItem
              key={p.id}
              property={p}
              active={i === activeIndex}
              ref={i === midpointIndex ? midpointRef : undefined}
            />
          ))
        )}

        {isLoadingMore && (
          <div className="view360-spinner-wrap">
            <div className="view360-spinner" />
          </div>
        )}

        {!loading && !hasMore && properties.length > 0 && (
          <div className="view360-end">Đã xem hết {total} tour ảo</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
