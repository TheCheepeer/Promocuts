export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type VideoPlatform = "tiktok" | "reels" | "shorts";

export type SiteSettings = {
    id: number;
    site_name: string;
    site_tagline: string | null;
    site_description: string | null;
    primary_color_light: string;
    secondary_color_light: string;
    primary_color_dark: string;
    secondary_color_dark: string;
    logo_url_light: string | null;
    logo_url_dark: string | null;
    logo_icon_url_light: string | null;
    logo_icon_url_dark: string | null;
    favicon_url_light: string | null;
    favicon_url_dark: string | null;
    social_instagram: string | null;
    social_tiktok: string | null;
    social_youtube: string | null;
    footer_text: string | null;
    created_at: string;
    updated_at: string;
};

export type SiteSettingsInsert = Partial<
    Omit<SiteSettings, "id" | "created_at" | "updated_at">
> & {
    id?: number;
    site_name?: string;
    primary_color_light?: string;
    secondary_color_light?: string;
    primary_color_dark?: string;
    secondary_color_dark?: string;
};

export type SiteSettingsUpdate = Partial<
    Omit<SiteSettings, "id" | "created_at" | "updated_at">
>;

export type Category = {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
};

export type CategoryInsert = Omit<
    Category,
    "id" | "created_at" | "updated_at"
> & {
    id?: string;
    display_order?: number;
};

export type CategoryUpdate = Partial<
    Omit<Category, "id" | "created_at" | "updated_at">
>;

export type Video = {
    id: string;
    category_id: string | null;
    title: string;
    slug: string;
    description: string | null;
    platform: VideoPlatform;
    original_url: string;
    platform_video_id: string;
    thumbnail_url: string | null;
    is_published: boolean;
    is_featured: boolean;
    order_weight: number;
    views_count: number;
    created_at: string;
    updated_at: string;
};

export type VideoInsert = Omit<
    Video,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_published"
    | "is_featured"
    | "order_weight"
    | "views_count"
> & {
    id?: string;
    is_published?: boolean;
    is_featured?: boolean;
    order_weight?: number;
    views_count?: number;
};

export type VideoUpdate = Partial<
    Omit<Video, "id" | "created_at" | "updated_at">
>;

export type Product = {
    id: string;
    category_id: string | null;
    name: string;
    description: string | null;
    image_url: string;
    affiliate_url: string;
    regular_price: number | null;
    discount_price: number | null;
    currency: string;
    coupon_code: string | null;
    store_name: string;
    created_at: string;
    updated_at: string;
};

export type ProductInsert = Omit<
    Product,
    "id" | "created_at" | "updated_at" | "currency"
> & {
    id?: string;
    currency?: string;
};

export type ProductUpdate = Partial<
    Omit<Product, "id" | "created_at" | "updated_at">
>;

export type VideoProduct = {
    id: string;
    video_id: string;
    product_id: string;
    display_order: number;
    created_at: string;
};

export type VideoProductInsert = Omit<
    VideoProduct,
    "id" | "created_at" | "display_order"
> & {
    id?: string;
    display_order?: number;
};

export type VideoProductUpdate = Partial<
    Omit<VideoProduct, "id" | "created_at">
>;

export type AffiliateClick = {
    id: string;
    product_id: string;
    video_id: string | null;
    created_at: string;
    user_agent: string | null;
    referrer: string | null;
};

export type AffiliateClickInsert = {
    id?: string;
    product_id: string;
    video_id?: string | null;
    created_at?: string;
    user_agent?: string | null;
    referrer?: string | null;
};

export type Database = {
    public: {
        Tables: {
            site_settings: {
                Row: SiteSettings;
                Insert: SiteSettingsInsert;
                Update: SiteSettingsUpdate;
                Relationships: [];
            };
            categories: {
                Row: Category;
                Insert: CategoryInsert;
                Update: CategoryUpdate;
                Relationships: [];
            };
            videos: {
                Row: Video;
                Insert: VideoInsert;
                Update: VideoUpdate;
                Relationships: [];
            };
            products: {
                Row: Product;
                Insert: ProductInsert;
                Update: ProductUpdate;
                Relationships: [];
            };
            video_products: {
                Row: VideoProduct;
                Insert: VideoProductInsert;
                Update: VideoProductUpdate;
                Relationships: [];
            };
            affiliate_clicks: {
                Row: AffiliateClick;
                Insert: AffiliateClickInsert;
                Update: Partial<AffiliateClickInsert>;
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            video_platform: VideoPlatform;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
