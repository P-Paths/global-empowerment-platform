export type TitleStatus = "clean" | "rebuilt" | "salvage" | "other";
export type Vertical = "auto" | "home";

export interface Listing {
  id: string;
  owner_id: string;
  vertical: Vertical;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  mileage?: number | null;
  vin?: string | null;
  title_status?: TitleStatus;
  price_target?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  city?: string | null;
  state?: string | null;
  photos: string[];
  copy_draft?: string | null;
  features?: string[] | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  listing_id: string;
  created_by: string;
  buyer_name: string;
  buyer_email: string;
  hold_fee?: number | null;
  hold_window_days: number;
  status: "created" | "active" | "settled" | "canceled" | "expired";
  terms_hash?: string | null;
  created_at: string;
  updated_at: string;
}
