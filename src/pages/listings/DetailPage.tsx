import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/search-bar/SearchBar";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import {
  getLarkPropertyMedia,
  getLarkPropertyLocation,
  getLarkPropertyCoordinates,
  formatLarkPrice,
  extractLarkRecordId,
  type MediaItem,
} from "@/services/api";
import { useWebConfig } from "@/hooks/useConfigQueries";
import { preloadImages } from "@/lib/mediaPreload";
import { usePropertyDetail, useRelatedProperties } from "@/hooks/useListingsQueries";
import type { ILarkProperty } from "@/types";
import { COLORS, API_URL } from "@/constants";
import { GoongMap } from "@/components/goong-map/GoongMap";
import "./DetailPage.css";

type AmenityKey = "handover" | "exterior" | "interior" | "other";
type MediaTabKey = "image" | "video" | "360";

const MEDIA_TABS: { key: MediaTabKey; label: string }[] = [
  { key: "image", label: "Hình" },
  { key: "video", label: "Video" },
  { key: "360", label: "360 độ" },
];

const AMENITY_TABS: { key: AmenityKey; label: string }[] = [
  { key: "handover", label: "Bàn giao" },
  { key: "exterior", label: "Bên ngoài" },
  { key: "interior", label: "Bên trong" },
  { key: "other", label: "Khác" },
];

const NEARBY_CATEGORIES = [
  { label: "Trường học", keyword: "trường học", color: "#3b82f6", Icon: SchoolIcon },
  { label: "Bệnh viện", keyword: "bệnh viện", color: "#ef4444", Icon: HospitalIcon },
  { label: "Siêu thị", keyword: "siêu thị", color: "#f59e0b", Icon: CartIcon },
  { label: "Công viên", keyword: "công viên", color: "#16a34a", Icon: ParkIcon },
] as const;

export function DetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: webConfig } = useWebConfig();

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [mediaTab, setMediaTab] = useState<MediaTabKey>("image");
  const [amenityTab, setAmenityTab] = useState<AmenityKey | null>(null);
  const relatedObserverRef = useRef<IntersectionObserver | null>(null);
  const relatedMidpointRef = useRef<HTMLDivElement>(null);

  const recordId = extractLarkRecordId(slug);
  const agentInfo = webConfig?.agent_info ?? null;
  const statusActive = webConfig?.status_properties?.active ?? undefined;

  const { data: property = null, isLoading: loading } = usePropertyDetail(recordId);

  const phone = agentInfo?.phone ?? property?.so_dien_thoai_chu_nha ?? "";
  const zalo = agentInfo?.zalo ?? phone;
  const agentName = agentInfo?.agent_name ?? property?.ten_chu_nha ?? "";
  const agentAvatar = agentInfo?.agent_avatar_url
    ? `${API_URL}/assets/${agentInfo.agent_avatar_url}`
    : null;
  const agentInitial = agentName?.[0]?.toUpperCase() ?? "?";
  const agentPosition = agentInfo?.agent_position ?? "Môi giới bất động sản";

  const categoryId = property?.danh_muc_bds?.id;
  const {
    data: relatedData,
    hasNextPage: relatedHasMore,
    isFetchingNextPage: isLoadingMoreRelated,
    fetchNextPage: fetchMoreRelated,
  } = useRelatedProperties(property?.id, categoryId, statusActive);
  const related = relatedData?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    if (relatedObserverRef.current) relatedObserverRef.current.disconnect();
    if (!categoryId) return;
    relatedObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && relatedHasMore && !isLoadingMoreRelated) {
          fetchMoreRelated();
        }
      },
      { threshold: 0.1 },
    );
    // Watch the card halfway through the currently loaded list (not the very
    // last one) so the next page starts loading before the user hits bottom.
    if (relatedMidpointRef.current) relatedObserverRef.current.observe(relatedMidpointRef.current);
    return () => relatedObserverRef.current?.disconnect();
  }, [relatedHasMore, isLoadingMoreRelated, categoryId, fetchMoreRelated, related.length]);

  if (loading) {
    return (
      <PageLayout hideBottomNav>
        <SearchBar />
        <DetailSkeleton />
      </PageLayout>
    );
  }

  if (!property) {
    return (
      <PageLayout>
        <SearchBar />
        <div className="detail-not-found">
          <p>Không tìm thấy bất động sản</p>
          <button onClick={() => navigate(-1)}>Quay lại</button>
        </div>
      </PageLayout>
    );
  }

  const media = getLarkPropertyMedia(property);
  const imageMedia = media.filter((m) => m.type === "image");
  const videoMedia = media.filter((m) => m.type === "video");
  const activeMediaList = mediaTab === "video" ? videoMedia : imageMedia;
  const location = getLarkPropertyLocation(property);
  const isRental = (property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "")
    .toLowerCase()
    .includes("thuê");
  const price =
    formatLarkPrice(property.gia_cho_thue_gia_ban) +
    (isRental && property.gia_cho_thue_gia_ban ? " / tháng" : "");

  const has3D = !!property.link_3d;
  const area = property.dien_tich_m2_rong ?? property.dien_tich_m2_dai ?? null;
  const coords = getLarkPropertyCoordinates(property);

  const amenityMap: Record<AmenityKey, string[]> = {
    handover: (property.do_thiet_bi_ban_giao ?? [])
      .map((x) => x.lark_do_thiet_bi_ban_giao_id?.name)
      .filter((n): n is string => !!n),
    exterior: (property.tien_ich_ben_ngoai_cua_san_pham ?? [])
      .map((x) => x.lark_tien_ich_ben_ngoai_cua__id?.name)
      .filter((n): n is string => !!n),
    interior: (property.tien_ich_phong_ngu_phong_chuc_nang_khac ?? [])
      .map((x) => x.lark_tien_ich_phong_ngu_phon_id?.name)
      .filter((n): n is string => !!n),
    other: (property.tien_ich_khac_tien_ich_chung_cu_neu_co ?? [])
      .map((x) => x.lark_tien_ich_khac_tien_ich__id?.name)
      .filter((n): n is string => !!n),
  };
  const visibleAmenityTabs = AMENITY_TABS.filter((t) => amenityMap[t.key].length > 0);
  const currentAmenityTab =
    amenityTab && amenityMap[amenityTab]?.length > 0 ? amenityTab : visibleAmenityTabs[0]?.key;
  const currentAmenities = currentAmenityTab ? amenityMap[currentAmenityTab] : [];
  const relatedMidpointIndex = Math.max(0, Math.floor(related.length / 2) - 1);

  return (
    <PageLayout hideBottomNav>
      <SearchBar />

      {/* Media gallery */}
      <div className="detail-media">
        {/* Tabs */}
        <div className="detail-media__tabs">
          {/* Tab chỉ hiện khi có nội dung thật (đồng bộ PropertyGallery web):
              Video cần >=1 video trong media, 360 cần link3d — không bắt
              người dùng bấm vào tab trống "Chưa có video". */}
          {MEDIA_TABS.filter((t) => {
            if (t.key === "video") return videoMedia.length > 0;
            if (t.key === "360") return has3D;
            return true;
          }).map((t) => (
            <button
              key={t.key}
              className={`detail-media__tab${mediaTab === t.key ? " detail-media__tab--active" : ""}`}
              onClick={() => setMediaTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mediaTab === "360" ? (
          has3D ? (
            <iframe
              src={property.link_3d!}
              className="detail-media__360-frame"
              allowFullScreen
              title="Tour 360°"
            />
          ) : (
            <div className="detail-media__empty">Chưa có dữ liệu 360 độ</div>
          )
        ) : activeMediaList.length > 0 ? (
          mediaTab === "video" && activeMediaList.length === 1 ? (
            <div className="detail-media__single">
              <video
                src={activeMediaList[0].url}
                controls
                autoPlay
                className="detail-media__item"
              />
            </div>
          ) : (
            <GalleryMosaic
              items={activeMediaList}
              title={property.tieu_de}
              onOpen={(i) => setLightboxIdx(i)}
            />
          )
        ) : (
          <div className="detail-media__no-img">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ddd" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#ddd" strokeWidth="1.5" />
              <path d="M3 15l5-5 4 4 3-3 6 5" stroke="#ddd" strokeWidth="1.5" />
            </svg>
            <span>{mediaTab === "video" ? "Chưa có video" : "Chưa có hình ảnh"}</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          items={activeMediaList}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onIndexChange={setLightboxIdx}
        />
      )}

      {/* Info */}
      <div className="detail-info">
        {/* Price + chips */}
        <div className="detail-price-row">
          <span className="detail-price">{price}</span>
          {property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name && (
            <span className="detail-chip detail-chip--transaction">
              {property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu.name.toUpperCase()}
            </span>
          )}
          {property.danh_muc_bds?.name && (
            <span className="detail-chip detail-chip--category">
              {property.danh_muc_bds.name.toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="detail-title">{property.tieu_de}</h1>

        <p className="detail-location">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={COLORS.teal}
            style={{ flexShrink: 0 }}
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="detail-location__text">{location}</span>
        </p>

        {/* Map */}
        <div
          className="detail-map"
          onClick={() => coords && window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, "_blank")}
          style={coords ? { cursor: "pointer" } : undefined}
        >
          {coords ? (
            <>
              <GoongMap lat={coords.lat} lng={coords.lng} />
              <div className="detail-map__open-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Mở bản đồ
              </div>
            </>
          ) : (
            <div className="detail-map__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill={COLORS.teal}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="detail-info-grid">
          <InfoGridItem
            icon={<MoneyIcon />}
            label="Tiền cọc"
            value={property.gia_deal_lai ? formatLarkPrice(property.gia_deal_lai) : "Thỏa thuận"}
          />
          <InfoGridItem icon={<AreaIcon />} label="Diện tích" value={area ? `${parseFloat(area)} m²` : "—"} />
          <InfoGridItem
            icon={<HomeWorkIcon />}
            label="Tình trạng"
            value={property.trang_thai?.name ?? "—"}
          />
          <InfoGridItem
            icon={<BoltIcon />}
            label="Tiền điện"
            value={
              property.tien_dien_so
                ? `${property.tien_dien_so.toLocaleString("vi-VN")} đ/số`
                : "Thỏa thuận"
            }
          />
          <InfoGridItem
            icon={<WaterIcon />}
            label="Tiền nước"
            value={
              property.tien_nuoc_so
                ? `${property.tien_nuoc_so.toLocaleString("vi-VN")} đ/m³`
                : "Thỏa thuận"
            }
          />
          <InfoGridItem
            icon={<ExploreIcon />}
            label="Vị trí"
            value={property.vi_tri_san_pham?.name ?? "—"}
          />
        </div>

        {/* Amenities */}
        {visibleAmenityTabs.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section__title">Tiện ích và công năng</h3>
            <div className="detail-amenities-tabs">
              {visibleAmenityTabs.map((t) => (
                <button
                  key={t.key}
                  className={`detail-amenities-tab${currentAmenityTab === t.key ? " detail-amenities-tab--active" : ""}`}
                  onClick={() => setAmenityTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="detail-amenities-list">
              {currentAmenities.map((name, i) => (
                <div key={i} className="detail-amenities-item">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  >
                    <circle cx="12" cy="12" r="10" fill="#4ade80" />
                    <path
                      d="M8 12.5l2.5 2.5L16 9.5"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby places */}
        <NearbyPlacesSection cachedPlaces={property.dia_diem_lan_can} />

        {/* Description */}
        {property.ghi_chu_them && (
          <div className="detail-section">
            <h3 className="detail-section__title">Mô tả</h3>
            <p className="detail-description">{property.ghi_chu_them}</p>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="detail-section">
            <div className="detail-section__header">
              <span className="detail-section__bar" />
              <h3 className="detail-section__title detail-section__title--no-margin">
                Bất động sản cùng loại
              </h3>
            </div>
            <div className="detail-related">
              {related.map((p, i) => (
                <PropertyCard
                  key={p.id}
                  data={p}
                  ref={i === relatedMidpointIndex ? relatedMidpointRef : undefined}
                />
              ))}
              {isLoadingMoreRelated &&
                Array.from({ length: 2 }, (_, i) => <RelatedCardSkeleton key={`more-${i}`} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile contact bar */}
      <div className="detail-mobile-bar">
        <div className="detail-mobile-bar__avatar">
          {agentAvatar ? <img src={agentAvatar} alt={agentName} /> : <span>{agentInitial}</span>}
        </div>
        <div className="detail-mobile-bar__info">
          <span className="detail-mobile-bar__name">{agentName}</span>
          <span className="detail-mobile-bar__position">{agentPosition}</span>
        </div>
        <a href={`tel:${phone}`} className="detail-mobile-bar__btn detail-mobile-bar__btn--call">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.77 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.68 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          Gọi ngay
        </a>
        <a
          href={`https://zalo.me/${zalo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-mobile-bar__btn detail-mobile-bar__btn--zalo"
        >
          <svg width="14" height="14" viewBox="0 0 48 48" fill="white">
            <path d="M24 4C13 4 4 13 4 24c0 5.5 2.2 10.5 5.8 14.1L8 44l6.2-1.6C17.3 44 20.5 44.8 24 44.8 35 44.8 44 35.8 44 24S35 4 24 4zm-7.2 28.2H11l7.5-9.5H12V20h10.6l-7.4 9.5h5.6v2.7zm5.5 0h-3V20h3v12.2zm10.5 0h-3v-7.4l-3.4 7.4h-2.8V20h3v7.4l3.4-7.4h2.8v12.2z" />
          </svg>
          Zalo
        </a>
      </div>
    </PageLayout>
  );
}

function MosaicCell({
  item,
  title,
  onClick,
  className,
  overlay,
}: {
  item: MediaItem;
  title: string;
  onClick: () => void;
  className?: string;
  overlay?: React.ReactNode;
}) {
  return (
    <div className={`gallery-mosaic__cell${className ? ` ${className}` : ""}`} onClick={onClick}>
      {item.type === "video" ? (
        <video src={item.thumbUrl} muted preload="metadata" className="gallery-mosaic__media" />
      ) : (
        // Ô mosaic dùng bản thu nhỏ 480px (~27KB thay vì ~200KB bản gốc);
        // bản gốc chỉ tải khi mở lightbox — đồng bộ PropertyGallery bên web
        <img src={item.thumbUrl} alt={title} className="gallery-mosaic__media" />
      )}
      {item.type === "video" && (
        <div className="gallery-mosaic__play">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.35)" />
            <path d="M9.5 7.5v9l7-4.5-7-4.5z" />
          </svg>
        </div>
      )}
      {overlay}
    </div>
  );
}

function GalleryMosaic({
  items,
  title,
  onOpen,
}: {
  items: MediaItem[];
  title: string;
  onOpen: (idx: number) => void;
}) {
  const count = items.length;

  if (count === 1) {
    return (
      <div className="gallery-mosaic gallery-mosaic--single">
        <MosaicCell item={items[0]} title={title} onClick={() => onOpen(0)} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="gallery-mosaic gallery-mosaic--2">
        {items.map((item, i) => (
          <MosaicCell key={i} item={item} title={title} onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="gallery-mosaic gallery-mosaic--3">
        <MosaicCell
          item={items[0]}
          title={title}
          onClick={() => onOpen(0)}
          className="gallery-mosaic__cell--main"
        />
        {[1, 2].map((i) => (
          <MosaicCell key={i} item={items[i]} title={title} onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="gallery-mosaic gallery-mosaic--4">
        {items.map((item, i) => (
          <MosaicCell key={i} item={item} title={title} onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  const extra = count - 5;
  return (
    <div className="gallery-mosaic gallery-mosaic--5">
      <MosaicCell
        item={items[0]}
        title={title}
        onClick={() => onOpen(0)}
        className="gallery-mosaic__cell--main"
      />
      {[1, 2, 3, 4].map((i) => (
        <MosaicCell
          key={i}
          item={items[i]}
          title={title}
          onClick={() => onOpen(i)}
          overlay={
            i === 4 && extra > 0 ? (
              <div className="gallery-mosaic__more">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="14"
                    rx="2"
                    stroke="white"
                    strokeWidth="1.6"
                  />
                  <circle cx="8" cy="8.5" r="1.3" fill="white" />
                  <path d="M3 15l5-4.5 4 3.5 3-2.5 6 4.5" stroke="white" strokeWidth="1.4" />
                </svg>
                <span>+{extra} ảnh</span>
              </div>
            ) : null
          }
        />
      ))}
    </div>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const item = items[index];
  // Skeleton chờ ảnh GỐC tải xong (mosaic chỉ tải bản 480px nên lần đầu mở
  // lightbox bản gốc chưa chắc có sẵn) — reset mỗi lần đổi ảnh
  const [loaded, setLoaded] = useState(false);
  React.useEffect(() => setLoaded(false), [index]);

  const goPrev = React.useCallback(
    () => onIndexChange((index - 1 + items.length) % items.length),
    [index, items.length, onIndexChange],
  );
  const goNext = React.useCallback(
    () => onIndexChange((index + 1) % items.length),
    [index, items.length, onIndexChange],
  );

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goPrev();
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    goNext();
  };

  // Đang xem ảnh N thì tải trước bản GỐC của N±1 — bấm/vuốt chuyển ảnh hiện
  // tức thì thay vì chờ tải (preloadImages tự dedupe, đồng bộ web)
  React.useEffect(() => {
    if (items.length < 2) return;
    const neighbors = [
      items[(index + 1) % items.length],
      items[(index - 1 + items.length) % items.length],
    ];
    preloadImages(neighbors.filter((m) => m?.type === "image").map((m) => m.url));
  }, [index, items]);

  // Esc/mũi tên — rẻ, hữu ích khi chạy trong browser ngoài Zalo
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  // Vuốt ngang trên backdrop để chuyển ảnh; vuốt ngắn/chéo dọc coi như tap
  // và rơi xuống close-on-backdrop-click (mirror PropertyGallery web)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    didSwipeRef.current = false;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    didSwipeRef.current = true;
    if (dx > 0) goPrev();
    else goNext();
  };
  const handleBackdropClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    onClose();
  };

  if (!item) return null;

  return (
    <div
      className="lightbox"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="lightbox__close" onClick={onClose}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className="lightbox__counter">
        {index + 1} / {items.length}
      </span>

      {items.length > 1 && (
        <button className="lightbox__nav lightbox__nav--prev" onClick={prev}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div className="lightbox__media" onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <video
            src={item.url}
            controls
            autoPlay
            playsInline
            className="lightbox__media-item"
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt=""
            className="lightbox__media-item"
            onLoad={() => setLoaded(true)}
          />
        )}
        {!loaded && <div className="lightbox__loading" />}
      </div>

      {items.length > 1 && (
        <button className="lightbox__nav lightbox__nav--next" onClick={next}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function InfoGridItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="detail-info-grid__item">
      {icon}
      <div className="detail-info-grid__text">
        <span className="detail-info-grid__label">{label}</span>
        <span className="detail-info-grid__value">{value}</span>
      </div>
    </div>
  );
}

const infoIconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" } as const;

function MoneyIcon() {
  return (
    <svg {...infoIconProps}>
      <circle cx="12" cy="12" r="9" stroke={COLORS.primary} strokeWidth="1.6" />
      <path
        d="M9.5 9.2a2 2 0 012-1.7h1a2 2 0 010 4h-1a2 2 0 000 4h1a2 2 0 002-1.7"
        stroke={COLORS.primary}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="6.2"
        x2="12"
        y2="7.5"
        stroke={COLORS.primary}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="16.5"
        x2="12"
        y2="17.8"
        stroke={COLORS.primary}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg {...infoIconProps}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="1.5"
        stroke={COLORS.primary}
        strokeWidth="1.6"
      />
      <path d="M3.5 20L20 3.5" stroke={COLORS.primary} strokeWidth="1.2" strokeDasharray="2 2.5" />
    </svg>
  );
}

function HomeWorkIcon() {
  return (
    <svg {...infoIconProps}>
      <path
        d="M3 21V10l6-4 6 4v11"
        stroke={COLORS.primary}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M15 21V7l6 3v11" stroke={COLORS.primary} strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="3" y1="21" x2="21" y2="21" stroke={COLORS.primary} strokeWidth="1.6" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...infoIconProps}>
      <path
        d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
        stroke={COLORS.primary}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg {...infoIconProps}>
      <path
        d="M12 3c3 4 6 7.5 6 11a6 6 0 01-12 0c0-3.5 3-7 6-11z"
        stroke={COLORS.primary}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg {...infoIconProps}>
      <circle cx="12" cy="12" r="9" stroke={COLORS.primary} strokeWidth="1.6" />
      <path
        d="M15 9l-2 5-5 2 2-5 5-2z"
        stroke={COLORS.primary}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function View360Icon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#9ca3af" strokeWidth="1.3" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="#9ca3af" strokeWidth="1.3" />
    </svg>
  );
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function NearbyPlacesSection({ cachedPlaces }: { cachedPlaces: ILarkProperty["dia_diem_lan_can"] }) {
  const [tab, setTab] = useState(0);

  if (!cachedPlaces) return null;

  const visibleCategories = NEARBY_CATEGORIES.filter(
    ({ keyword }) => (cachedPlaces[keyword]?.length ?? 0) > 0,
  );
  if (visibleCategories.length === 0) return null;

  const safeTab = Math.min(tab, visibleCategories.length - 1);
  const { keyword, Icon: ActiveIcon, color } = visibleCategories[safeTab];
  const places = cachedPlaces[keyword] ?? [];

  return (
    <div className="detail-section">
      <h3 className="detail-section__title">Địa điểm lân cận</h3>
      <div className="detail-nearby-tabs">
        {visibleCategories.map((cat, i) => (
          <button
            key={cat.label}
            className={`detail-nearby-tab${safeTab === i ? " detail-nearby-tab--active" : ""}`}
            onClick={() => setTab(i)}
          >
            <cat.Icon size={14} color={cat.color} />
            {cat.label}
          </button>
        ))}
      </div>
      <div className="detail-nearby-list">
        {places.map((place, i) => (
          <div key={place.place_id ?? i} className="detail-nearby-item">
            <div className="detail-nearby-item__icon" style={{ background: `${color}1f` }}>
              <ActiveIcon size={16} color={color} />
            </div>
            <div className="detail-nearby-item__text">
              <span className="detail-nearby-item__name">{place.name}</span>
              {place.formatted_address && (
                <span className="detail-nearby-item__address">{place.formatted_address}</span>
              )}
            </div>
            <div className="detail-nearby-item__dist">
              <WalkIcon size={12} color="#9ca3af" />
              {fmtDist(place.distanceMeters)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolIcon({ size = 16, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 10v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" stroke={color} strokeWidth="1.6" />
      <line
        x1="21"
        y1="7.5"
        x2="21"
        y2="14"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HospitalIcon({ size = 16, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4" width="17" height="17" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M12 8.5v7M8.5 12h7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon({ size = 16, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 4h2l2.4 12.4a1.5 1.5 0 001.5 1.2h8.2a1.5 1.5 0 001.5-1.2L20 8H6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20" r="1.3" fill={color} />
      <circle cx="17" cy="20" r="1.3" fill={color} />
    </svg>
  );
}

function ParkIcon({ size = 16, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l4 6h-2.5l3.5 5h-3l3 5H7l3-5h-3l3.5-5H8l4-6z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalkIcon({ size = 12, color = "#9ca3af" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4" r="1.8" fill={color} />
      <path
        d="M10 22l1.5-6-2-1.5.5-5 3-2 3 2.5 2.5 1.5M9.5 15l-3 2M14 14.5l2.5 1.5.5 4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RelatedCardSkeleton() {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden" }}>
      <div className="skeleton-pulse" style={{ aspectRatio: "3/2", borderRadius: 0 }} />
      <div style={{ padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton-pulse skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton-pulse skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton-pulse skeleton-line" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      {/* Media gallery */}
      <div className="detail-media">
        <div className="detail-media__tabs">
          {MEDIA_TABS.slice(0, 2).map((t) => (
            <div
              key={t.key}
              className="skeleton-pulse"
              style={{ width: 64, height: 30, borderRadius: 8, flexShrink: 0 }}
            />
          ))}
        </div>
        <div
          className="skeleton-pulse"
          style={{ aspectRatio: "4/3", margin: "0 12px", borderRadius: 10 }}
        />
      </div>

      {/* Info */}
      <div className="detail-info">
        <div className="detail-price-row">
          <div className="skeleton-pulse" style={{ width: 130, height: 26, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: 76, height: 21, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: 76, height: 21, borderRadius: 6 }} />
        </div>

        <div
          className="skeleton-pulse skeleton-line"
          style={{ width: "92%", height: 18, marginBottom: 6 }}
        />
        <div
          className="skeleton-pulse skeleton-line"
          style={{ width: "65%", height: 18, marginBottom: 16 }}
        />

        <div className="detail-location">
          <div
            className="skeleton-pulse"
            style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0 }}
          />
          <div className="skeleton-pulse skeleton-line" style={{ width: "75%" }} />
        </div>

        <div className="detail-map">
          <div className="skeleton-pulse" style={{ width: "100%", height: "100%" }} />
        </div>

        <div className="detail-info-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="detail-info-grid__item">
              <div
                className="skeleton-pulse"
                style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }}
              />
              <div className="detail-info-grid__text" style={{ width: "100%" }}>
                <div className="skeleton-pulse skeleton-line" style={{ width: "50%", height: 9 }} />
                <div className="skeleton-pulse skeleton-line" style={{ width: "75%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Amenities */}
        <div className="detail-section">
          <div
            className="skeleton-pulse skeleton-line"
            style={{ width: 150, height: 16, marginBottom: 12 }}
          />
          <div className="detail-amenities-tabs">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="skeleton-pulse"
                style={{ width: 64, height: 26, borderRadius: 6, flexShrink: 0 }}
              />
            ))}
          </div>
          <div className="detail-amenities-list">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton-pulse skeleton-line" style={{ width: "85%" }} />
            ))}
          </div>
        </div>

        {/* Nearby places */}
        <div className="detail-section">
          <div
            className="skeleton-pulse skeleton-line"
            style={{ width: 140, height: 16, marginBottom: 12 }}
          />
          <div className="detail-nearby-tabs">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="skeleton-pulse"
                style={{ width: 84, height: 28, borderRadius: 20, flexShrink: 0 }}
              />
            ))}
          </div>
          <div className="detail-nearby-list">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="detail-nearby-item">
                <div
                  className="skeleton-pulse"
                  style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }}
                />
                <div className="detail-nearby-item__text" style={{ gap: 6 }}>
                  <div className="skeleton-pulse skeleton-line" style={{ width: "55%" }} />
                  <div className="skeleton-pulse skeleton-line" style={{ width: "35%" }} />
                </div>
                <div className="skeleton-pulse" style={{ width: 36, height: 11, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <div
            className="skeleton-pulse skeleton-line"
            style={{ width: 70, height: 16, marginBottom: 10 }}
          />
          <div className="skeleton-pulse skeleton-line" style={{ width: "100%", marginBottom: 8 }} />
          <div className="skeleton-pulse skeleton-line" style={{ width: "100%", marginBottom: 8 }} />
          <div className="skeleton-pulse skeleton-line" style={{ width: "55%" }} />
        </div>

        {/* Related */}
        <div className="detail-section">
          <div className="detail-section__header">
            <span className="detail-section__bar" />
            <div className="skeleton-pulse skeleton-line" style={{ width: 170, height: 16 }} />
          </div>
          <div className="detail-related">
            {Array.from({ length: 2 }, (_, i) => (
              <RelatedCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="detail-mobile-bar">
        <div
          className="skeleton-pulse"
          style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}
        />
        <div className="detail-mobile-bar__info" style={{ gap: 6 }}>
          <div className="skeleton-pulse skeleton-line" style={{ width: "55%" }} />
          <div className="skeleton-pulse skeleton-line" style={{ width: "35%" }} />
        </div>
        <div className="skeleton-pulse" style={{ width: 84, height: 34, borderRadius: 8, flexShrink: 0 }} />
        <div className="skeleton-pulse" style={{ width: 64, height: 34, borderRadius: 8, flexShrink: 0 }} />
      </div>
    </>
  );
}
