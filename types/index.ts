export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  icon?: string;
}

export interface Api {
  id: number;
  name: string;
  url: string;
  exchange?: {
    id: number;
    name: string;
    price: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
  };
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  key?: string;
}

export interface Service {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  duration: number;
  min: number;
  max: number;
  price: number;
  site_id: number;
  category: number;
  api: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  percent?: number;
  auto_update?: boolean;
}

export interface FormErrors {
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  price?: string;
  percentage?: string;
  duration?: string;
  min?: string;
  max?: string;
  site_id?: string;
  api?: string;
  category?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ServiceInfo {
  name: string;
  min_quantity: number;
  max_quantity: number;
  price: number;
  percentage: string | number;
}