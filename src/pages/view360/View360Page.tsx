import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import iconPhone from "@/assets/icons/social/phone.svg";
import iconShare from "@/assets/icons/social/share.svg";
import iconZalo from "@/assets/icons/social/zalo.svg";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopSearchBar } from "@/components/search-bar/TopSearchBar";
import { useWebConfig } from "@/hooks/useConfigQueries";
import { useLarkPropertiesView360 } from "@/hooks/useListingsQueries";
import {
  getLarkPropertyFirstImage,
  getLarkPropertyLocation,
  formatLarkPrice,
  generatePropertySlug,
} from "@/services/api";
import { useView360Store } from "@/store";
import { preloadImages } from "@/lib/mediaPreload";
import type { ILarkProperty } from "@/types";
import { ROUTES, WEB_APP_URL } from "@/constants";
import { callPhone, openZalo } from "@/lib/contact";
import "./View360Page.css";
import { PageLayout } from "@/components/layout/PageLayout";

/* ── Action buttons ────────────────────────────────────── */

function ActionButtons({ property }: { property: ILarkProperty }) {
  const { data: webConfig } = useWebConfig();

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
      {/* Chia sẻ */}
      <button className="v360-action-btn v360-action-btn--wiggle" onClick={handleShare}>
        <img src={iconShare} width={30} height={30} className="v360-icon" alt="Chia sẻ" />
        <span>Chia sẻ</span>
      </button>

      {/* Gọi ngay */}
      <button
        className="v360-action-btn v360-action-btn--wiggle"
        onClick={() => void callPhone(phone)}
      >
        <img src={iconPhone} width={30} height={30} className="v360-icon" alt="Gọi ngay" />
        <span>Gọi ngay</span>
      </button>

      {/* Zalo */}
      <button
        className="v360-action-btn v360-action-btn--wiggle"
        onClick={() => void openZalo(zalo)}
      >
        <img src={iconZalo} width={32} height={32} className="v360-icon--zalo" alt="Zalo" />
        <span>Zalo</span>
      </button>
    </div>
  );
}

/* ── Bottom property card ──────────────────────────────── */

function PropertyCard({ property, onBook }: { property: ILarkProperty; onBook: () => void }) {
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
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
        >
          Đặt ngay
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

/* ── Feed item ─────────────────────────────────────────── */

interface FeedItemProps {
  property: ILarkProperty;
  active: boolean;
  showHint: boolean;
  // Item cuối cùng của feed → đảo chiều gợi ý (vuốt xuống để quay lại).
  hintReverse: boolean;
}

const FeedItem = forwardRef<HTMLDivElement, FeedItemProps>(
  ({ property, active, showHint, hintReverse }, ref) => {
    const { data: webConfig } = useWebConfig();
    const agentInfo = webConfig?.agent_info ?? null;
    const phone = agentInfo?.phone ?? property.so_dien_thoai_chu_nha ?? "";
    const image = getLarkPropertyFirstImage(property);

    return (
      <div className="feed-item" ref={ref}>
        {/* 360 iframe – only rendered when this item is snapped into view */}
        {active && property.link_3d ? (
          <>
            <iframe
              src={property.link_3d}
              className="feed-item__frame"
              allowFullScreen
              title={property.tieu_de}
            />
            {/* Dải vuốt mép trái: nằm TRÊN iframe (iframe nuốt touch nên không
              vuốt đổi tour được) nhưng vẫn để cuộn feed đi qua → user vuốt dọc
              ở đây là chuyển tour, phần còn lại vẫn xoay được 360. */}
            <div className="feed-item__swipe-zone" aria-hidden>
              {showHint && (
                <div
                  className={`feed-item__swipe-hint${hintReverse ? " feed-item__swipe-hint--reverse" : ""}`}
                >
                  <div className="feed-item__swipe-chevrons">
                    <svg viewBox="0 0 24 24" fill="none">
                      <polyline
                        points="6 15 12 9 18 15"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg viewBox="0 0 24 24" fill="none">
                      <polyline
                        points="6 15 12 9 18 15"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <svg className="feed-item__swipe-hand" viewBox="0 0 24 24" fill="#fff">
                    <path d="M11 2a1.5 1.5 0 0 1 1.5 1.5V11h.5V9a1.4 1.4 0 0 1 2.8 0v2h.5v-1.2a1.35 1.35 0 0 1 2.7 0V11h.5v-.4a1.3 1.3 0 0 1 2.5.5V16a6 6 0 0 1-6 6h-2.2a5.6 5.6 0 0 1-4-1.7l-3.7-3.8a1.45 1.45 0 0 1 2-2.1l1.6 1.4V3.5A1.5 1.5 0 0 1 11 2z" />
                  </svg>
                  <span className="feed-item__swipe-label">Vuốt tiếp tại đây</span>
                </div>
              )}
            </div>
          </>
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
          onBook={() => void callPhone(phone)}
        />
      </div>
    );
  },
);
FeedItem.displayName = "FeedItem";

/* ── Main page ─────────────────────────────────────────── */

export function View360Page() {
  const { data: webConfig } = useWebConfig();
  // Khởi tạo từ store để quay lại tab 360 là đứng đúng item đang xem dở
  // (danh sách do react-query cache cả phiên). Đọc 1 lần bằng getState thay vì
  // subscribe để không double-render theo store.
  const [activeIndex, setActiveIndex] = useState(() => useView360Store.getState().activeIndex);
  const feedRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const statusActive = webConfig?.status_properties?.active ?? undefined;

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useLarkPropertiesView360(statusActive);

  // flatMap tạo mảng mới mỗi render — memo theo `data` để các effect preload/
  // restore bên dưới chỉ chạy khi dữ liệu thật sự đổi (mirror VideoFeed).
  const properties = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  // Khôi phục vị trí scroll đã lưu — chạy 1 lần ngay khi danh sách render xong
  // (layout effect để nhảy thẳng tới vị trí, không nháy từ item đầu). Clamp
  // phòng khi danh sách đổi làm index cũ vượt biên (mirror VideoFeed).
  const restoredRef = useRef(false);
  useLayoutEffect(() => {
    if (restoredRef.current || properties.length === 0) return;
    restoredRef.current = true;
    const el = feedRef.current;
    const saved = Math.min(useView360Store.getState().activeIndex, properties.length - 1);
    if (!el || saved <= 0) return;
    el.scrollTop = saved * el.clientHeight;
    setActiveIndex(saved);
  }, [properties.length]);

  // Preload ảnh đại diện của item lân cận (kế trên + kế dưới) để lướt tới là
  // có thumbnail sẵn, không thấy màn đen chờ ảnh trước khi iframe 360 nạp.
  useEffect(() => {
    if (properties.length === 0) return;
    const imgs = [properties[activeIndex + 1], properties[activeIndex - 1]]
      .filter((p): p is ILarkProperty => !!p)
      .map((p) => getLarkPropertyFirstImage(p));
    preloadImages(imgs);
  }, [properties, activeIndex]);

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

  // Scroll bắn nhiều lần/frame khi vuốt nhanh — gom về tối đa 1 lần/frame
  // thay vì tính lại + re-render cả list mỗi tick (mirror VideoFeed).
  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = feedRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(index);
      // Lưu vị trí ra store (ngoài React render) để quay lại là đứng đúng item.
      useView360Store.getState().setActiveIndex(index);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <PageLayout>
      <div className="view360-feed" ref={feedRef} onScroll={handleScroll}>
        {loading ? (
          <div className="view360-spinner-wrap">
            <div className="view360-spinner" />
          </div>
        ) : properties.length === 0 ? (
          <div className="view360-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              <ellipse
                cx="12"
                cy="12"
                rx="4"
                ry="9"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
              />
              <line
                x1="3"
                y1="12"
                x2="21"
                y2="12"
                stroke="rgba(0,0,0,0.3)"
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
              showHint={i === activeIndex}
              // Item cuối đã tải và không còn trang sau → đảo chiều gợi ý.
              hintReverse={i === properties.length - 1 && !hasMore}
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
    </PageLayout>
  );
}
