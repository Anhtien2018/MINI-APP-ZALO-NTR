export const API_URL = "https://cms.nguyenthinhreal.org";
export const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL as string;
export const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as string;
export const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY as string;

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
  mainDirection: "/items/lark_huong_chinh",
  otherApartmentAmenities: "/items/lark_tien_ich_khac_tien_ich_chung_cu_neu_co",
  externalAmenities: "/items/lark_tien_ich_ben_ngoai_cua_san_pham",
  bedroomAmenities: "/items/lark_tien_ich_phong_ngu_phong_chuc_nang_khac",
};

export const LARK_PROPERTY_CARD_FIELDS = [
  "id",
  "lark_record_id",
  "tieu_de",
  "gia_cho_thue_gia_ban",
  "vi_tri",
  "duong_khu_dan_cu_neu_khong_co_de_trong",
  "dia_chi_cu_the",
  "dien_tich_m2_rong",
  "dien_tich_m2_dai",
  "danh_muc_bds.id",
  "danh_muc_bds.name",
  "loai_hinh_kinh_doanh_bat_dong_san_dich_vu.id",
  "loai_hinh_kinh_doanh_bat_dong_san_dich_vu.name",
  "tai_len_hinh_anh_cua_bds",
  "trang_thai.id",
  "trang_thai.name",
  "so_dien_thoai_chu_nha",
  "ten_chu_nha",
  "link_3d",
].join(",");

export const LARK_PROPERTY_DETAIL_FIELDS = [
  ...LARK_PROPERTY_CARD_FIELDS.split(","),
  "ghi_chu_them",
  "link_3d",
  "gia_deal_lai",
  "tien_dien_so",
  "tien_nuoc_so",
  "thong_tin_can_ho_bao_nhieu_tang",
  "mat_duong_bao_nhieu_met",
  "vi_tri_san_pham.id",
  "vi_tri_san_pham.name",
  "khoang_tien.id",
  "khoang_tien.name",
  "tinh_thanh_pho_tw_duoc_phan_cong.id",
  "tinh_thanh_pho_tw_duoc_phan_cong.name",
  "phuong.id",
  "phuong.name",
  "quan.lark_quan_id.*",
  "nearby_places",
  "do_thiet_bi_ban_giao.lark_do_thiet_bi_ban_giao_id.id",
  "do_thiet_bi_ban_giao.lark_do_thiet_bi_ban_giao_id.name",
  "tien_ich_ben_ngoai_cua_san_pham.lark_tien_ich_ben_ngoai_cua__id.id",
  "tien_ich_ben_ngoai_cua_san_pham.lark_tien_ich_ben_ngoai_cua__id.name",
  "tien_ich_phong_ngu_phong_chuc_nang_khac.lark_tien_ich_phong_ngu_phon_id.id",
  "tien_ich_phong_ngu_phong_chuc_nang_khac.lark_tien_ich_phong_ngu_phon_id.name",
  "tien_ich_khac_tien_ich_chung_cu_neu_co.lark_tien_ich_khac_tien_ich__id.id",
  "tien_ich_khac_tien_ich_chung_cu_neu_co.lark_tien_ich_khac_tien_ich__id.name",
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
