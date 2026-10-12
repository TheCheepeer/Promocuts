export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type VideoPlatform =
    | "tiktok"
    | "reels"
    | "shorts"
    | "bilibili"
    | "pinterest"
    | "twitch"
    | "vimeo"
    | (string & {});

export type BioStorefrontBannerStyle = "banner" | "compact" | "hidden";

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
    bio_avatar_url_light: string | null;
    bio_avatar_url_dark: string | null;
    bio_show_storefront_banner: BioStorefrontBannerStyle;
    bio_show_qrcode: boolean;
    bio_title: string | null;
    bio_description: string | null;
    bio_primary_color_light: string | null;
    bio_primary_color_dark: string | null;
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

export type ProductLink = {
    id: string;
    product_id: string;
    store_name: string;
    affiliate_url: string;
    regular_price: number | null;
    discount_price: number | null;
    coupon_code: string | null;
    is_available: boolean;
    last_checked_at: string | null;
    status_code: number | null;
    display_order: number;
    created_at: string;
    updated_at: string;
};

export type ProductLinkInsert = Omit<
    ProductLink,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_available"
    | "last_checked_at"
    | "status_code"
    | "display_order"
> & {
    id?: string;
    is_available?: boolean;
    last_checked_at?: string | null;
    status_code?: number | null;
    display_order?: number;
};

export type ProductLinkUpdate = Partial<
    Omit<ProductLink, "id" | "created_at" | "updated_at">
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
    product_links?: ProductLink[];
};

export type ProductInsert = Omit<
    Product,
    "id" | "created_at" | "updated_at" | "currency" | "product_links"
> & {
    id?: string;
    currency?: string;
};

export type ProductUpdate = Partial<
    Omit<Product, "id" | "created_at" | "updated_at" | "product_links">
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
    link_id: string | null;
    store_name: string | null;
    created_at: string;
    user_agent: string | null;
    referrer: string | null;
};

export type AffiliateClickInsert = {
    id?: string;
    product_id: string;
    video_id?: string | null;
    link_id?: string | null;
    store_name?: string | null;
    created_at?: string;
    user_agent?: string | null;
    referrer?: string | null;
};

export type BioLink = {
    id: string;
    title: string;
    url: string;
    icon: string | null;
    badge_text: string | null;
    is_active: boolean;
    is_highlighted: boolean;
    display_order: number;
    clicks_count: number;
    created_at: string;
    updated_at: string;
};

export type BioLinkInsert = Omit<
    BioLink,
    "id" | "created_at" | "updated_at" | "clicks_count"
> & {
    id?: string;
    is_active?: boolean;
    is_highlighted?: boolean;
    display_order?: number;
    clicks_count?: number;
};

export type BioLinkUpdate = Partial<
    Omit<BioLink, "id" | "created_at" | "updated_at">
>;

export type BioLinkClick = {
    id: string;
    bio_link_id: string;
    created_at: string;
    user_agent: string | null;
    referrer: string | null;
};

export type BioLinkClickInsert = {
    id?: string;
    bio_link_id: string;
    created_at?: string;
    user_agent?: string | null;
    referrer?: string | null;
};

export type BrandSocialLink = {
    id: string;
    platform: string;
    url: string;
    show_in_storefront: boolean;
    show_in_bio: boolean;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type BrandSocialLinkInsert = Omit<
    BrandSocialLink,
    "id" | "created_at" | "updated_at"
> & {
    id?: string;
    show_in_storefront?: boolean;
    show_in_bio?: boolean;
    display_order?: number;
    is_active?: boolean;
};

export type BrandSocialLinkUpdate = Partial<
    Omit<BrandSocialLink, "id" | "created_at" | "updated_at">
>;

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
            product_links: {
                Row: ProductLink;
                Insert: ProductLinkInsert;
                Update: ProductLinkUpdate;
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
            bio_links: {
                Row: BioLink;
                Insert: BioLinkInsert;
                Update: BioLinkUpdate;
                Relationships: [];
            };
            bio_link_clicks: {
                Row: BioLinkClick;
                Insert: BioLinkClickInsert;
                Update: Partial<BioLinkClickInsert>;
                Relationships: [];
            };
            brand_social_links: {
                Row: BrandSocialLink;
                Insert: BrandSocialLinkInsert;
                Update: BrandSocialLinkUpdate;
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
