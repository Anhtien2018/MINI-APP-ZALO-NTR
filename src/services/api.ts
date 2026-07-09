import axios from "axios";
import {
  API_URL,
  DIRECTUS_PUBLIC_TOKEN,
  ENDPOINTS,
  LARK_PROPERTY_CARD_FIELDS,
  LARK_PROPERTY_DETAIL_FIELDS,
  PAGE_LIMIT,
  VIDEO_PAGE_LIMIT,
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
  IVideoPropertyRow,
  ILarkAttachment,
  ILarkPropertyImage,
} from "@/types";

const http = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${DIRECTUS_PUBLIC_TOKEN}`,
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

// Media chỉ serve từ Directus Files: `id` (directus_files.id) do lark-sync/
// pull enrich vào item, /assets/<id> đọc công khai không cần token. Item
// CHƯA được pull enrich (chưa có `id`) coi như chưa có media — không còn
// fallback proxy /api/lark/image của web app nữa (mỗi request proxy phải
// resolve URL tạm của Lark rồi stream lại, chậm và phụ thuộc web app).
export function getLarkMediaUrl(
  item: ILarkPropertyImage | ILarkAttachment,
): string | null {
  return item.id ? `${API_URL}/assets/${item.id}` : null;
}

export function getLarkVideoUrl(attachment: ILarkAttachment): string | null {
  return getLarkMediaUrl(attachment);
}

// Bản thu nhỏ on-the-fly của Directus (?width&quality) cho ảnh hiển thị cỡ
// card/mosaic — ảnh gốc sau resize pipeline vẫn ~200KB/tấm, bản 480px chỉ
// còn ~27KB mà vẫn được Directus cache 30 ngày như bản gốc (mirror
// getLarkMediaThumbUrl bên web). Video giữ nguyên URL gốc — transform chỉ
// áp dụng cho ảnh.
export function getLarkMediaThumbUrl(
  item: ILarkPropertyImage | ILarkAttachment,
  width = 480,
): string | null {
  if (!item.id) return null;
  if (item.type?.startsWith("video/")) return getLarkMediaUrl(item);
  return `${API_URL}/assets/${item.id}?width=${width}&quality=80`;
}

export function getLarkPropertyImageUrls(p: ILarkProperty): string[] {
  return (p.tai_len_hinh_anh_cua_bds ?? [])
    .filter((img) => !!img?.id && !img?.type?.startsWith("video/"))
    .map((img) => getLarkMediaUrl(img) as string);
}

export function getLarkPropertyFirstImage(p: ILarkProperty): string {
  return getLarkPropertyImageUrls(p)[0] ?? "";
}

// `quan` là junction M2M — với fields=quan.lark_quan_id.name thì lark_quan_id
// là object {name,...} lúc runtime dù type khai báo có thể khác; đọc qua
// helper để không lệ thuộc type đó (mirror web larkPropertyMapper).
function relationNameOf(v: unknown): string | null {
  if (v && typeof v === "object") {
    const name = (v as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name;
  }
  return null;
}

// Vị trí hiển thị CÔNG KHAI (card/detail/popup/feed): chỉ phường, quận, thành
// phố — KHÔNG được rơi về dia_chi_cu_the hay full_address của field Location,
// cả 2 đều có thể chứa số nhà/vị trí ghim chính xác làm lộ địa chỉ BĐS.
// Đồng bộ với getLarkPropertyLocation bên web.
export function getLarkPropertyLocation(p: {
  phuong?: ILarkPhuong | null;
  quan?: Array<{ lark_quan_id: ILarkDistrict }> | null;
  tinh_thanh_pho_tw_duoc_phan_cong?: ILarkStatusOption | null;
}): string {
  const parts = [
    p.phuong?.name,
    relationNameOf(p.quan?.[0]?.lark_quan_id),
    p.tinh_thanh_pho_tw_duoc_phan_cong?.name,
  ].filter((s): s is string => !!s);
  return parts.join(", ");
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

const VIDEO_FEED_FIELDS = [
  "id",
  "lark_record_id",
  "tieu_de",
  "video",
  "gia_cho_thue_gia_ban",
  "vi_tri",
  "duong_khu_dan_cu_neu_khong_co_de_trong",
  "dia_chi_cu_the",
  "phuong.name",
  "quan.lark_quan_id.name",
  "tinh_thanh_pho_tw_duoc_phan_cong.name",
  "tai_len_hinh_anh_cua_bds",
  "loai_hinh_kinh_doanh_bat_dong_san_dich_vu.id",
  "loai_hinh_kinh_doanh_bat_dong_san_dich_vu.name",
  "danh_muc_bds.id",
  "danh_muc_bds.name",
].join(",");

// Video lấy từ CHÍNH property (field `video` trên lark_properties, pull
// enrich từ Lark kèm resize ~500KB) — đồng bộ với getLarkPropertyVideos bên
// web, thay cho collection `video` rời trước đây. Chỉ lấy tin active (truyền
// statusId từ webConfig.status_properties.active). Map mỗi row về shape
// IVideo cũ để VideoFeed giữ nguyên.
export async function getVideos(
  page = 1,
  limit = VIDEO_PAGE_LIMIT,
  statusId?: string | null,
): Promise<{ data: IVideo[]; total: number }> {
  let url =
    `${ENDPOINTS.larkProperties}` +
    `?fields=${VIDEO_FEED_FIELDS}` +
    `&filter[video][_nnull]=true` +
    `&sort=-thoi_gian_tao,id` +
    `&limit=${limit}` +
    `&page=${page}` +
    `&meta=filter_count`;
  if (statusId) url += `&filter[trang_thai][_eq]=${encodeURIComponent(statusId)}`;

  const res = await http.get<{ data: IVideoPropertyRow[]; meta?: { filter_count?: number } }>(url);
  return {
    data: res.data.data.map((row) => ({
      id: row.id,
      video: row.video ?? null,
      lark_property: row,
    })),
    total: res.data.meta?.filter_count ?? 0,
  };
}

export type MediaItem = {
  type: "image" | "video";
  /** Bản gốc — dùng cho lightbox/phóng to */
  url: string;
  /** Bản thu nhỏ cho ô mosaic/preview list (mirror MediaItem bên web) */
  thumbUrl: string;
};

export function getLarkPropertyMedia(p: ILarkProperty): MediaItem[] {
  return (p.tai_len_hinh_anh_cua_bds ?? [])
    .filter((img) => !!img?.id)
    .map((img) => ({
      type: img?.type?.startsWith("video/") ? "video" : "image",
      url: getLarkMediaUrl(img) as string,
      thumbUrl: getLarkMediaThumbUrl(img) as string,
    }));
}
