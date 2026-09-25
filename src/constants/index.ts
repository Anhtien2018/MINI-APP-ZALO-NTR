export const API_URL = "https://cms.nguyenthinhreal.org";
export const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL as string;
// Fallback share thumbnail — must match app-config.json's `app.icon`.
export const APP_ICON_URL = "https://cms.nguyenthinhreal.org/assets/logo.png";
export const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY as string;
export const LARK_BASE_URL = "https://open.larksuite.com/open-apis";

export const ENDPOINTS = {
  webConfiguration: "/items/web_configuration",
  appConfiguration: "/items/app_configuration",
  larkProperties: "/items/lark_properties",
  businessType: "/items/lark_loai_hinh_kinh_doanh_bat_dong_san_dich_vu",
  propertyCategory: "/items/lark_danh_muc_bds",
  city: "/items/lark_tinh_thanh_pho_tw_duoc_phan_cong",
  district: "/items/lark_quan",
  ward: "/items/lark_phuong",
  priceRange: "/items/lark_khoang_tien",
  otherApartmentAmenities: "/items/lark_tien_ich_khac_tien_ich_chung_cu_neu_co",
  externalAmenities: "/items/lark_tien_ich_ben_ngoai_cua_san_pham",
  bedroomAmenities: "/items/lark_tien_ich_phong_ngu_phong_chuc_nang_khac",
  video: "/items/video",
};

export const LARK_PROPERTY_CARD_FIELDS = [
  "id",
  "lark_record_id",
  "tieu_de",
  "gia_cho_thue_gia_ban",
  "vi_tri",
  "duong_khu_dan_cu_neu_khong_co_de_trong",
  "dien_tich_m2_rong",
  "dien_tich_m2_dai",
  "tai_len_hinh_anh_cua_bds",
  "link_3d",
].join(",");

export const LARK_PROPERTY_DETAIL_FIELDS = [
  ...LARK_PROPERTY_CARD_FIELDS.split(","),
  "link_3d",
  "gia_deal_lai",
  "tien_dien_so",
  "tien_nuoc_so",
  "nguoi_tao.id",
  "nguoi_tao.first_name",
  "nguoi_tao.email",
  "nguoi_sale.id",
  "nguoi_sale.first_name",
  "nguoi_sale.email",
  "dia_diem_lan_can",
].join(",");

export const COLORS = {
  primary: "#228b22",
  primaryDark: "#16a34a",
  teal: "#00b894",
  tealDark: "#00a383",
  zalo: "#0068FF",
  accent: "#f59e0b",
  red: "#e53935",
  textPrimary: "#111",
  textSecondary: "#333",
  textMuted: "#666",
  border: "#e5e7eb",
  bgGray: "#f2f4f2",
  bgCard: "#ffffff",
  chipBg: "#e8f5e9",
  chipText: "#2e7d32",
  orange: "#ff6b35",
};

export const PAGE_LIMIT = 50;
export const VIDEO_PAGE_LIMIT = 10;
export const SEARCH_DEBOUNCE_MS = 400;

export const ROUTES = {
  HOME: "/",
  LISTINGS: "/listings",
  SEARCH: "/search",
  DETAIL: (id: string) => `/listings/${id}`,
  MAP: "/map",
  VIEW_360: "/360",
  FAVORITES: "/favorites",
};
