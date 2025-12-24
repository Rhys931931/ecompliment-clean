import { FieldValue } from 'firebase/firestore';

// --- APP DATA TYPES ---
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
  magic_token?: string;
  claimer_name?: string;
  status?: string;
  createdAt?: any;
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
  type?: string;
  senderUid?: string;
  senderName?: string;
}

// --- THEME & LAYOUT ENGINE (V5 High Fidelity) ---

export interface ElementStyle {
  // Positioning
  top: number;      // %
  left: number;     // %
  scale: number;    // Multiplier
  visible: boolean;
  
  // Dimensions
  width?: number;   // %
  height?: number;  // %
  
  // Styling
  color?: string;           // Text color / Main color
  backgroundColor?: string; // Box background
  borderRadius?: number;    // px
  
  // QR Specifics
  frame?: boolean;
  frameColor?: string;
  qrFgColor?: string; // Specific QR dots color
  qrBgColor?: string; // Specific QR background
  
  // Shadow Engine
  shadow?: boolean;       // On/Off
  shadowAngle?: number;   // Degrees (0-360)
  shadowDistance?: number;// px
  shadowBlur?: number;    // px
  shadowOpacity?: number; // 0-1
}

export interface ThemeLayout {
  bannerHeight: number;
  photo: ElementStyle;
  qr: ElementStyle;
  whiteBox: ElementStyle;
  pinText: ElementStyle;
  headerText: ElementStyle;
  footerText: ElementStyle;
}

export interface ThemeData {
  id?: string;
  name: string;
  status?: 'active' | 'archived'; // <--- NEW: The Purgatory Flag
  primaryColor: string;
  textColor: string;
  backgroundImageUrl?: string;
  layout: ThemeLayout;
  createdAt?: FieldValue;
}

// Default "Classic Business Card" Layout (With your Custom Numbers)
export const DEFAULT_LAYOUT: ThemeLayout = {
    bannerHeight: 25,
    
    headerText: { 
        top: 11, left: 21, scale: 1.8, visible: true, color: '#ffffff', shadow: false 
    },
    footerText: { 
        top: 90, left: 57, scale: 2.2, visible: true, color: '#ffffff', shadow: false 
    },
    
    photo: { 
        top: 45, left: 17, scale: 1.6, visible: true,
        shadow: true, shadowAngle: 45, shadowDistance: 5, shadowBlur: 10, shadowOpacity: 0.3
    },
    
    qr: { 
        top: 50, left: 85, scale: 1.2, visible: true,
        frame: true, frameColor: '#176c70', qrBgColor: '#ffffff', qrFgColor: '#000000',
        shadow: true, shadowAngle: 59, shadowDistance: 15, shadowBlur: 8, shadowOpacity: 0.5
    },
    
    whiteBox: { 
        top: 61, left: 50, width: 55, height: 30, scale: 1.0, visible: true,
        borderRadius: 12, backgroundColor: '#ffffff',
        shadow: true, shadowAngle: 33, shadowDistance: 31, shadowBlur: 15, shadowOpacity: 0.4
    },
    
    pinText: { 
        top: 81, left: 13, scale: 1.0, visible: true, color: '#272f4e' 
    }
};

export const DEFAULT_THEME: ThemeData = {
    name: 'New Custom Theme',
    status: 'active',
    primaryColor: '#4da6a9',
    textColor: '#ffffff',
    backgroundImageUrl: '',
    layout: DEFAULT_LAYOUT
};
