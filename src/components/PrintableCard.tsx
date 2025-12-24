import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { ElementStyle } from '../types';
import { DEFAULT_LAYOUT } from '../types';

interface PrintableCardProps {
  theme: any;
  userPin?: string;
  userPhoto?: string;
  scale?: number;
  qrCodeValue?: string; // Allow override for "Time Capsule" links
}

const PrintableCard = forwardRef<HTMLDivElement, PrintableCardProps>(({ 
  theme, 
  userPin = "XXXXX", 
  userPhoto, 
  scale = 1, 
  qrCodeValue 
}, ref) => {
  // 1. Safety Check: Ensure layout exists, else fallback
  const layout = theme.layout || DEFAULT_LAYOUT;
  const { primaryColor, textColor, backgroundImageUrl } = theme;

  // 2. The "Landscape Engine" (Fixed Print Resolution)
  const BASE_WIDTH = 1050;
  const BASE_HEIGHT = 600;

  // 3. The "Style Factory" - Converts Dictionary to CSS
  const getStyle = (elementKey: keyof typeof layout): React.CSSProperties => {
    // @ts-ignore
    const data = layout[elementKey] as ElementStyle;
    
    if (!data || !data.visible) return { display: 'none' };

    const style: React.CSSProperties = {
      position: 'absolute',
      top: `${data.top}%`,
      left: `${data.left}%`,
      transform: `translate(-50%, -50%) scale(${data.scale})`,
      zIndex: 10,
      color: data.color || textColor, 
    };

    // Box Sizing
    if (data.width) style.width = `${data.width}%`;
    if (data.height) style.height = `${data.height}%`;

    // Backgrounds & Borders
    if (data.backgroundColor) style.backgroundColor = data.backgroundColor;
    if (data.borderRadius) style.borderRadius = `${data.borderRadius}px`;

    // The Frame Engine
    if (data.frame) {
        style.border = `4px solid ${data.frameColor || '#ffffff'}`;
        style.padding = '8px';
        style.backgroundColor = data.qrBgColor || 'white';
    }

    // The Shadow Engine (Math: Polar -> Cartesian)
    if (data.shadow) {
        const angleRad = (data.shadowAngle || 45) * (Math.PI / 180);
        const dist = data.shadowDistance || 5;
        const x = Math.round(dist * Math.cos(angleRad));
        const y = Math.round(dist * Math.sin(angleRad));
        const blur = data.shadowBlur || 5;
        const opacity = data.shadowOpacity || 0.3;
        
        style.boxShadow = `${x}px ${y}px ${blur}px rgba(0,0,0,${opacity})`;
    }

    return style;
  };

  // 4. Determine QR URL
  // Default: ecompliment.app/?t=THEME_ID (The "Time Capsule")
  const qrUrl = qrCodeValue || `https://ecompliment.app/?t=${theme.id || 'default'}`;

  return (
    // OUTER WRAPPER: Handles the scaling so it fits on screen
    <div style={{
        width: `${BASE_WIDTH * scale}px`,
        height: `${BASE_HEIGHT * scale}px`,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', // UI Shadow only
        borderRadius: '8px',
        margin: '0 auto'
    }}>
       {/* INNER CANVAS: Always renders at High-Res 1050x600 */}
       <div ref={ref} style={{
           width: `${BASE_WIDTH}px`,
           height: `${BASE_HEIGHT}px`,
           transform: `scale(${scale})`,
           transformOrigin: 'top left',
           position: 'relative',
           backgroundColor: primaryColor,
           backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           overflow: 'hidden',
           fontFamily: 'Arial, sans-serif'
       }}>
            {/* BACKGROUND BANNER STRIP */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                height: `${layout.bannerHeight}%`,
                backgroundColor: primaryColor, 
                zIndex: 1
            }} />

            {/* ELEMENT 1: WHITE BOX ZONE */}
            <div style={getStyle('whiteBox')} />

            {/* ELEMENT 2: HEADER TEXT */}
            <div style={{...getStyle('headerText'), fontSize: '32px', fontWeight:'bold', letterSpacing:'-1px'}}>
                e-compliment
            </div>
            
            {/* ELEMENT 3: FOOTER URL */}
            <div style={{...getStyle('footerText'), fontSize: '18px', fontWeight:'bold', letterSpacing:'1px', opacity:0.9}}>
                https://www.ecompliment.app
            </div>

            {/* ELEMENT 4: PIN CODE */}
            <div style={{...getStyle('pinText'), textAlign:'center'}}>
                <div style={{fontSize:'14px', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'5px', opacity:0.7}}>Secret PIN</div>
                <div style={{fontSize:'42px', fontFamily:'monospace', fontWeight:'900', letterSpacing:'4px'}}>
                    {userPin}
                </div>
            </div>

            {/* ELEMENT 5: USER PHOTO */}
            <div style={{...getStyle('photo'), overflow:'hidden', width:'180px', height:'180px', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center'}}>
                 {userPhoto ? (
                     <img src={userPhoto} alt="User" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                 ) : (
                     <div style={{width:'100%', height:'100%', background:'#cbd5e1', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', fontWeight:'bold'}}>IMG</div>
                 )}
            </div>

            {/* ELEMENT 6: QR CODE */}
            <div style={{...getStyle('qr'), display:'flex', justifyContent:'center', alignItems:'center'}}>
                <QRCodeSVG 
                    value={qrUrl} 
                    size={140} 
                    bgColor={"transparent"} 
                    fgColor={layout.qr.qrFgColor || "#000000"} 
                />
            </div>
       </div>
    </div>
  );
});

export default PrintableCard;
