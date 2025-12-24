export interface ComplimentData {
  id: string;
  message: string;
  sender: string;
  sender_uid?: string;
  owner_index?: string; 
  sender_photo?: string;
  sender_bio?: string;
  to?: string;
  pin?: string;
  claimed?: boolean;
  ad_ids?: string[]; 
  is_severed?: boolean;
  tip_amount?: number;
}

export interface AdData {
  id: string;
  name: string;
  offer: string;
  coupon_code: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
}

// --- LAYOUT ENGINE ---
export interface ElementStyle {
  top: number;  // % from top
  left: number; // % from left
  scale: number; // 1 = 100%
  width?: number; // % width (for boxes)
  height?: number; // % height (for boxes)
  visible: boolean;
}

export interface ThemeLayout {
  bannerHeight: number; // %
  photo: ElementStyle;
  qr: ElementStyle;
  whiteBox: ElementStyle;
  pinText: ElementStyle;
  website: ElementStyle;
}

export interface ThemeData {
  id?: string;
  name: string;
  primaryColor: string;
  textColor: string;
  backgroundImageUrl: string;
  layout?: ThemeLayout; // <--- OPTIONAL NOW
}

// Default "Classic Teal" Layout
export const DEFAULT_LAYOUT: ThemeLayout = {
  bannerHeight: 22,
  photo: { top: 15, left: 10, scale: 1, visible: true },
  qr: { top: 15, left: 75, scale: 1, visible: true },
  whiteBox: { top: 55, left: 50, width: 55, height: 20, scale: 1, visible: true },
  pinText: { top: 38, left: 10, scale: 1, visible: true },
  website: { top: 92, left: 50, scale: 1, visible: true }
};

export const DEFAULT_THEME: ThemeData = {
    name: 'Classic',
    primaryColor: '#4da6a9',
    textColor: '#333333',
    backgroundImageUrl: 'linear-gradient(180deg, rgba(77, 166, 169, 0.15) 0%, #ffffff 100%)',
    layout: DEFAULT_LAYOUT
};
