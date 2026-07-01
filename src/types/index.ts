export interface IWebConfiguration {
  id: string;
  logo_header: string;
  logo_footer: string;
  favicon: string;
  facebook_link: string;
  youtube_link: string;
  zalo_link: string;
  email: string;
  logo_slogan: string;
  logo_title: string;
  phone: string;
  address: string;
  description: string;
  listing_type: IListingType[];
  status_properties: {
    active: string;
    pending: string;
    cancelled: string;
    sold: string;
  } | null;
  agent_info: IAgentInfo | null;
  role: {
    admin: string;
    sale: string;
    user: string;
  } | null;
}

export interface IListingType {
  id: string;
  name: string;
}

export interface IAgentInfo {
  agent_name: string;
  agent_avatar_url: string;
  agent_position: string;
  phone: string;
  zalo: string;
  agent_description: string;
  contact_message: string;
}

export interface IHomeConfiguration {
  id: string;
  banner_listing: string | null;
  company_name: string;
  hero_title: string;
  hero_description: string;
  seo_title: string;
  seo_description: string;
  statistics: { title: string; value: string }[];
}

export interface ILarkStatusOption {
  id: string;
  id_status_lark: string;
  name: string;
  color: number;
}

export interface ILarkDistrict extends ILarkStatusOption {
  province_id: string;
}

export interface ILarkPhuong extends ILarkStatusOption {
  district_id: string;
}

export interface ILarkViTri {
  address: string;
  adname: string;
  cityname: string;
  full_address: string;
  location: string;
  name: string;
  pname: string;
}

export interface ILarkPropertyImage {
  file_token: string;
  name: string;
  size: number;
  type: string;
  url: string;
  tmp_url?: string;
}

export interface ILarkProperty {
  id: string;
  lark_record_id: string;
  tieu_de: string;
  dia_chi_cu_the: string;
  gia_cho_thue_gia_ban: number;
  gia_deal_lai: number | null;
  dien_tich_m2_rong: string | null;
  dien_tich_m2_dai: string | null;
  ten_chu_nha: string;
  so_dien_thoai_chu_nha: string;
  thoi_gian_tao: string;
  vi_tri: ILarkViTri | null;
  duong_khu_dan_cu_neu_khong_co_de_trong: ILarkViTri | null;
  tai_len_hinh_anh_cua_bds: ILarkPropertyImage[] | null;
  danh_muc_bds: ILarkStatusOption | null;
  loai_hinh_kinh_doanh_bat_dong_san_dich_vu: ILarkStatusOption | null;
  trang_thai: ILarkStatusOption | null;
  khoang_tien: ILarkStatusOption | null;
  vi_tri_san_pham: ILarkStatusOption | null;
  ghi_chu_them: string | null;
  link_3d: string | null;
  tien_dien_so: number | null;
  tien_nuoc_so: number | null;
  thong_tin_can_ho_bao_nhieu_tang: string | null;
  mat_duong_bao_nhieu_met: string | null;
  tinh_thanh_pho_tw_duoc_phan_cong: ILarkStatusOption | null;
  phuong: ILarkPhuong | null;
  quan: Array<{ id: number; lark_properties_id: string; lark_quan_id: ILarkDistrict }>;
  nguoi_tao: { id: string; first_name: string; email: string } | null;
  nguoi_sale: { id: string; first_name: string; email: string } | null;
  dia_diem_lan_can: Record<
    string,
    Array<{
      place_id: string;
      name: string;
      formatted_address?: string;
      lat: number;
      lng: number;
      distanceMeters: number;
    }>
  > | null;
  do_thiet_bi_ban_giao: Array<{ lark_do_thiet_bi_ban_giao_id: ILarkStatusOption }>;
  tien_ich_ben_ngoai_cua_san_pham: Array<{ lark_tien_ich_ben_ngoai_cua__id: ILarkStatusOption }>;
  tien_ich_phong_ngu_phong_chuc_nang_khac: Array<{
    lark_tien_ich_phong_ngu_phon_id: ILarkStatusOption;
  }>;
  tien_ich_khac_tien_ich_chung_cu_neu_co: Array<{
    lark_tien_ich_khac_tien_ich__id: ILarkStatusOption;
  }>;
}

export interface IPropertiesResponse {
  data: ILarkProperty[];
  meta?: { filter_count?: number };
}

export interface IFavorite {
  propertyId: string;
  savedAt: string;
}

export type Status = "active" | "in_active";

export interface ILarkAttachment {
  file_token: string;
  name: string;
  size?: number;
  type: string;
  url?: string;
  tmp_url?: string;
}

export interface IVideoProperty {
  id: string;
  lark_record_id: string;
  tieu_de: string;
  gia_cho_thue_gia_ban?: number | null;
  vi_tri?: ILarkViTri | null;
  duong_khu_dan_cu_neu_khong_co_de_trong?: ILarkViTri | null;
  dia_chi_cu_the?: string | null;
  tai_len_hinh_anh_cua_bds?: ILarkPropertyImage[] | null;
  loai_hinh_kinh_doanh_bat_dong_san_dich_vu?: ILarkStatusOption | null;
  danh_muc_bds?: ILarkStatusOption | null;
}

export interface IVideo {
  id: string;
  status?: Status | null;
  video?: ILarkAttachment | null;
  lark_property?: IVideoProperty | null;
}
