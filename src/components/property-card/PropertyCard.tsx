import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import type { ILarkProperty } from "@/types";
import {
  getLarkPropertyFirstImage,
  getLarkPropertyLocation,
  formatLarkPrice,
  generatePropertySlug,
} from "@/services/api";
import { useWebConfig } from "@/hooks/useConfigQueries";
import { useFavoritesStore } from "@/store";
import { ROUTES, COLORS } from "@/constants";
import "./PropertyCard.css";
import { callPhone, openZalo } from "@/lib/contact";

interface PropertyCardProps {
  data: ILarkProperty;
  layout?: "grid" | "list";
}

function PropertyCardComponent(
  { data, layout = "grid" }: PropertyCardProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const navigate = useNavigate();
  const { data: webConfig } = useWebConfig();
  const isFav = useFavoritesStore((s) => s.isFavorite(data.id));
  const addFav = useFavoritesStore((s) => s.addFavorite);
  const removeFav = useFavoritesStore((s) => s.removeFavorite);

  const agentInfo = webConfig?.agent_info ?? null;
  const phone = agentInfo?.phone ?? data.so_dien_thoai_chu_nha ?? "";
  const zalo = agentInfo?.zalo ?? phone;

  const image = getLarkPropertyFirstImage(data);
  const isRental = (data.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "")
    .toLowerCase()
    .includes("thuê");
  const price =
    formatLarkPrice(data.gia_cho_thue_gia_ban) +
    (isRental && data.gia_cho_thue_gia_ban ? " / tháng" : "");
  const location = getLarkPropertyLocation(data);
  const badge =
    data.danh_muc_bds?.name ?? data.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "";
  const slug = generatePropertySlug(data.tieu_de, data.lark_record_id);

  const [imgError, setImgError] = useState(false);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) removeFav(data.id);
    else addFav(data.id);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    void callPhone(phone);
  };

  const handleZalo = (e: React.MouseEvent) => {
    e.stopPropagation();
    void openZalo(zalo);
  };

  const handleCardClick = () => {
    navigate(ROUTES.DETAIL(slug));
  };

  const LocationIcon = ({ size = 12 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={COLORS.teal}
      style={{ flexShrink: 0 }}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );

  const NoImage = () => (
    <div className="property-card__no-img">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ccc" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="#ccc" strokeWidth="1.5" />
        <path d="M3 15l5-5 4 4 3-3 6 5" stroke="#ccc" strokeWidth="1.5" />
      </svg>
    </div>
  );

  const FavButton = () => (
    <button className="property-card__fav" onClick={handleToggleFav}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke="#228b22"
          strokeWidth="2"
          fill={isFav ? "#228b22" : "none"}
        />
      </svg>
    </button>
  );

  if (layout === "list") {
    return (
      <div className="property-card property-card--list" onClick={handleCardClick} ref={ref}>
        <div className="property-card__img-wrap property-card__img-wrap--list">
          {image && !imgError ? (
            <img
              src={image}
              alt={data.tieu_de}
              className="property-card__img"
              onError={() => setImgError(true)}
            />
          ) : (
            <NoImage />
          )}
          <FavButton />
        </div>
        <div className="property-card__body">
          {badge && <span className="property-card__badge">{badge}</span>}
          <p className="property-card__title property-card__title--list">{data.tieu_de}</p>
          <p className="property-card__price">{price}</p>
          <p className="property-card__location property-card__location--list">
            <LocationIcon />
            <span className="property-card__location-text">{location}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-card" onClick={handleCardClick} ref={ref}>
      <div className="property-card__img-wrap">
        {image && !imgError ? (
          <img
            src={image}
            alt={data.tieu_de}
            className="property-card__img"
            onError={() => setImgError(true)}
          />
        ) : (
          <NoImage />
        )}
        <FavButton />
      </div>

      <div className="property-card__body">
        {badge && <span className="property-card__badge">{badge}</span>}
        <p className="property-card__title">{data.tieu_de}</p>
        <p className="property-card__price">{price}</p>
        <p className="property-card__location">
          <LocationIcon />
          <span className="property-card__location-text">{location}</span>
        </p>
      </div>

      <div className="property-card__actions">
        <button className="property-card__btn property-card__btn--call" onClick={handleCall}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.77 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.68 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          Gọi
        </button>
        <button className="property-card__btn property-card__btn--zalo" onClick={handleZalo}>
          <svg width="15" height="15" viewBox="0 0 48 48" fill="white">
            <path d="M24 4C13 4 4 13 4 24c0 5.5 2.2 10.5 5.8 14.1L8 44l6.2-1.6C17.3 44 20.5 44.8 24 44.8 35 44.8 44 35.8 44 24S35 4 24 4zm-7.2 28.2H11l7.5-9.5H12V20h10.6l-7.4 9.5h5.6v2.7zm5.5 0h-3V20h3v12.2zm10.5 0h-3v-7.4l-3.4 7.4h-2.8V20h3v7.4l3.4-7.4h2.8v12.2z" />
          </svg>
          Zalo
        </button>
      </div>
    </div>
  );
}

export const PropertyCard = memo(React.forwardRef(PropertyCardComponent));
