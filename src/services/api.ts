import axios from "axios";
import {
  API_URL,
  WEB_APP_URL,
  DIRECTUS_TOKEN,
  ENDPOINTS,
  LARK_PROPERTY_CARD_FIELDS,
  LARK_PROPERTY_DETAIL_FIELDS,
  LARK_BASE_URL,
  PAGE_LIMIT,
} from "@/constants";
import type {
  IWebConfiguration,
  IHomeConfiguration,
  ILarkProperty,
  ILarkStatusOption,
  ILarkDistrict,
  ILarkPhuong,
  IPropertiesResponse,
  IVideo,
  ILarkAttachment,
} from "@/types";

const http = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function get<T>(endpoint: string): Promise<T> {
  const res = await http.get<{ data: T }>(endpoint);
  return res.data.data;
}

export async function getWebConfiguration(): Promise<IWebConfiguration> {
  return get<IWebConfiguration>(ENDPOINTS.webConfiguration);
}

export async function getHomeConfiguration(): Promise<IHomeConfiguration> {
  return get<IHomeConfiguration>(ENDPOINTS.appConfiguration);
}

export async function getBusinessTypes(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(`${ENDPOINTS.businessType}?sort=sort`);
}

export async function getPropertyCategories(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(`${ENDPOINTS.propertyCategory}?sort=sort`);
}

export async function getCities(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(ENDPOINTS.city);
}

export async function getDistricts(): Promise<ILarkDistrict[]> {
  return get<ILarkDistrict[]>(ENDPOINTS.district);
}

export async function getWards(): Promise<ILarkPhuong[]> {
  return get<ILarkPhuong[]>(ENDPOINTS.ward);
}

export async function getPriceRanges(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(`${ENDPOINTS.priceRange}?sort=-sort`);
}

export async function getMainDirections(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(`${ENDPOINTS.mainDirection}?sort=sort`);
}

export async function getOtherApartmentAmenities(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(ENDPOINTS.otherApartmentAmenities);
}

export async function getExternalAmenities(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(ENDPOINTS.externalAmenities);
}

export async function getBedroomAmenities(): Promise<ILarkStatusOption[]> {
  return get<ILarkStatusOption[]>(ENDPOINTS.bedroomAmenities);
}

export async function getLarkPropertiesByType(
  listingTypeId: string,
  statusId: string | null,
  limit = 6,
): Promise<ILarkProperty[]> {
  let url =
    `${ENDPOINTS.larkProperties}` +
    `?fields=${LARK_PROPERTY_CARD_FIELDS}` +
    `&sort=-thoi_gian_tao` +
    `&limit=${limit}` +
    `&filter[loai_hinh_kinh_doanh_bat_dong_san_dich_vu][_eq]=${encodeURIComponent(listingTypeId)}`;
  if (statusId) {
    url += `&filter[trang_thai][_eq]=${encodeURIComponent(statusId)}`;
  }
  return get<ILarkProperty[]>(url);
}

export interface IListingsFilter {
  page?: number;
  limit?: number;
  status?: string;
  transactionType?: string;
  propertyType?: string;
  city?: string;
  district?: string;
  search?: string;
  priceRange?: string;
  features?: string[];
  hasLink3d?: boolean;
}

export async function getLarkPropertiesPaginated(
  filter: IListingsFilter,
): Promise<{ data: ILarkProperty[]; total: number }> {
  const {
    page = 1,
    limit = PAGE_LIMIT,
    status,
    transactionType,
    propertyType,
    city,
    district,
    search,
    priceRange,
    features,
    hasLink3d,
  } = filter;

  let url =
    `${ENDPOINTS.larkProperties}` +
    `?fields=${LARK_PROPERTY_CARD_FIELDS}` +
    `&sort=-thoi_gian_tao` +
    `&limit=${limit}` +
    `&page=${page}` +
    `&meta=filter_count`;

  if (status) url += `&filter[trang_thai][_eq]=${encodeURIComponent(status)}`;
  if (transactionType)
    url += `&filter[loai_hinh_kinh_doanh_bat_dong_san_dich_vu][_eq]=${encodeURIComponent(transactionType)}`;
  if (propertyType) url += `&filter[danh_muc_bds][_eq]=${encodeURIComponent(propertyType)}`;
  if (city) url += `&filter[tinh_thanh_pho_tw_duoc_phan_cong][id][_eq]=${encodeURIComponent(city)}`;
  if (district) url += `&filter[quan][lark_quan_id][id][_eq]=${encodeURIComponent(district)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (priceRange) url += `&filter[khoang_tien][_eq]=${encodeURIComponent(priceRange)}`;
  if (hasLink3d) url += `&filter[link_3d][_nnull]=true`;
  if (features && features.length > 0) {
    const ids = features.map(encodeURIComponent).join(",");
    url +=
      `&filter[_or][0][tien_ich_ben_ngoai_cua_san_pham][lark_tien_ich_ben_ngoai_cua__id][_in]=${ids}` +
      `&filter[_or][1][tien_ich_phong_ngu_phong_chuc_nang_khac][lark_tien_ich_phong_ngu_phon_id][_in]=${ids}` +
      `&filter[_or][2][tien_ich_khac_tien_ich_chung_cu_neu_co][lark_tien_ich_khac_tien_ich__id][_in]=${ids}`;
  }

  const res = await http.get<IPropertiesResponse>(url);
  return {
    data: res.data.data,
    total: res.data.meta?.filter_count ?? 0,
  };
}

export async function getLarkPropertyByRecordId(
  larkRecordId: string,
): Promise<ILarkProperty | null> {
  const url =
    `${ENDPOINTS.larkProperties}` +
    `?fields=${LARK_PROPERTY_DETAIL_FIELDS}` +
    `&filter[lark_record_id][_eq]=${encodeURIComponent(larkRecordId)}` +
    `&limit=1`;
  const results = await get<ILarkProperty[]>(url);
  return results[0] ?? null;
}

export async function getRelatedProperties(
  currentId: string,
  categoryId: string,
  statusId?: string,
  limit = 6,
  page = 1,
): Promise<{ data: ILarkProperty[]; total: number }> {
  let url =
    `${ENDPOINTS.larkProperties}` +
    `?fields=${LARK_PROPERTY_CARD_FIELDS}` +
    `&sort=-thoi_gian_tao` +
    `&limit=${limit}` +
    `&page=${page}` +
    `&meta=filter_count` +
    `&filter[id][_neq]=${encodeURIComponent(currentId)}` +
    `&filter[danh_muc_bds][_eq]=${encodeURIComponent(categoryId)}`;
  if (statusId) url += `&filter[trang_thai][_eq]=${encodeURIComponent(statusId)}`;

  const res = await http.get<IPropertiesResponse>(url);
  return {
    data: res.data.data,
    total: res.data.meta?.filter_count ?? 0,
  };
}

// Lark attachment URLs require Authorization header — proxy qua Next.js web app
function toLarkProxyUrl(url: string): string {
  return `${WEB_APP_URL}/api/lark/image?url=${encodeURIComponent(url)}`;
}

export function getLarkAttachmentUrl(url: string): string {
  return toLarkProxyUrl(url);
}

// Videos are uploaded via /drive/v1/files/upload_all (not attached to any
// Bitable record), so they carry only a file_token — no ready-made url like
// Bitable-synced property images. Must download via the Drive Files API
// (/drive/v1/files/:token/download), not the Bitable Media API
// (/drive/v1/medias/:token/download), which 403s for record-less tokens.
export function getLarkVideoUrl(attachment: ILarkAttachment): string {
  const rawUrl = attachment.url || `${LARK_BASE_URL}/drive/v1/files/${attachment.file_token}/download`;
  return toLarkProxyUrl(rawUrl);
}

export function getLarkPropertyImageUrls(p: ILarkProperty): string[] {
  return (p.tai_len_hinh_anh_cua_bds ?? [])
    .filter((img) => !img?.type?.startsWith("video/"))
    .map((img) => toLarkProxyUrl(img.url));
}

export function getLarkPropertyFirstImage(p: ILarkProperty): string {
  return getLarkPropertyImageUrls(p)[0] ?? "";
}

export function getLarkPropertyLocation(p: ILarkProperty): string {
  return (
    p.vi_tri?.full_address ??
    p.duong_khu_dan_cu_neu_khong_co_de_trong?.full_address ??
    p.dia_chi_cu_the
  );
}

export function getLarkPropertyCoordinates(p: ILarkProperty): { lat: number; lng: number } | null {
  const viTri = p.vi_tri ?? p.duong_khu_dan_cu_neu_khong_co_de_trong;
  if (!viTri?.location) return null;
  const [lng, lat] = viTri.location.split(",").map(Number);
  if (!lat || !lng) return null;
  return { lat, lng };
}

export function formatLarkPrice(amount: number | null): string {
  if (!amount) return "Liên hệ";
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    return `${ty % 1 === 0 ? ty : ty.toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    const trieu = amount / 1_000_000;
    return `${trieu % 1 === 0 ? trieu : trieu.toFixed(1)} triệu`;
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function generatePropertySlug(title: string, larkRecordId: string): string {
  const slug = (title ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${slug}-${larkRecordId}`;
}

export function extractLarkRecordId(slug: string): string {
  const idx = slug.lastIndexOf("-");
  return idx === -1 ? slug : slug.slice(idx + 1);
}

const VIDEO_FIELDS = [
  "id",
  "status",
  "video",
  "lark_property.id",
  "lark_property.lark_record_id",
  "lark_property.tieu_de",
  "lark_property.gia_cho_thue_gia_ban",
  "lark_property.vi_tri",
  "lark_property.duong_khu_dan_cu_neu_khong_co_de_trong",
  "lark_property.dia_chi_cu_the",
  "lark_property.tai_len_hinh_anh_cua_bds",
  "lark_property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu.id",
  "lark_property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu.name",
  "lark_property.danh_muc_bds.id",
  "lark_property.danh_muc_bds.name",
].join(",");

export async function getVideos(): Promise<IVideo[]> {
  return get<IVideo[]>(
    `${ENDPOINTS.video}?filter[status][_eq]=active&fields=${VIDEO_FIELDS}`,
  );
}

export type MediaItem = { type: "image" | "video"; url: string };

export function getLarkPropertyMedia(p: ILarkProperty): MediaItem[] {
  return (p.tai_len_hinh_anh_cua_bds ?? []).map((img) => ({
    type: img?.type?.startsWith("video/") ? "video" : "image",
    url: toLarkProxyUrl(img.url),
  }));
}
