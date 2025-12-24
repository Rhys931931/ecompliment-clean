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
      zIndex: 20, // Content sits above background
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

    // The Shadow Engine
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

  const qrUrl = qrCodeValue || `https://ecompliment.app/?t=${theme.id || 'default'}`;

  return (
    // OUTER WRAPPER: Scaling Context
    <div style={{
        width: `${BASE_WIDTH * scale}px`,
        height: `${BASE_HEIGHT * scale}px`,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        margin: '0 auto',
        position: 'relative'
    }}>
       {/* INNER CANVAS: Fixed High-Res Context */}
       <div ref={ref} style={{
           width: `${BASE_WIDTH}px`,
           height: `${BASE_HEIGHT}px`,
           transform: `scale(${scale})`,
           transformOrigin: 'top left',
           position: 'relative',
           backgroundColor: primaryColor,
           overflow: 'hidden',
           fontFamily: 'Arial, sans-serif'
       }}>
            {/* LAYER 0: BACKGROUND IMAGE (Fixed for Download) */}
            {backgroundImageUrl && (
                <img 
                    src={backgroundImageUrl}
                    crossOrigin="anonymous" // <--- THE MAGIC KEY FOR DOWNLOADING
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', 
                        objectFit: 'cover', zIndex: 0
                    }} 
                />
            )}

            {/* LAYER 1: BANNER STRIP */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                height: `${layout.bannerHeight}%`,
                backgroundColor: primaryColor, 
                zIndex: 10,
                mixBlendMode: 'multiply' // Makes it blend nicely with bg
            }} />

            {/* ELEMENTS */}
            <div style={getStyle('whiteBox')} />

            <div style={{...getStyle('headerText'), fontSize: '32px', fontWeight:'bold', letterSpacing:'-1px'}}>
                e-compliment
            </div>
            
            <div style={{...getStyle('footerText'), fontSize: '18px', fontWeight:'bold', letterSpacing:'1px', opacity:0.9}}>
                https://www.ecompliment.app
            </div>

            <div style={{...getStyle('pinText'), textAlign:'center'}}>
                <div style={{fontSize:'14px', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'5px', opacity:0.7}}>Secret PIN</div>
                <div style={{fontSize:'42px', fontFamily:'monospace', fontWeight:'900', letterSpacing:'4px'}}>
                    {userPin}
                </div>
            </div>

            <div style={{...getStyle('photo'), overflow:'hidden', width:'180px', height:'180px', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', border:'4px solid white'}}>
                 {userPhoto ? (
                     <img 
                        src={userPhoto} 
                        crossOrigin="anonymous" // <--- THE MAGIC KEY
                        alt="User" 
                        style={{width:'100%', height:'100%', objectFit:'cover'}} 
                     />
                 ) : (
                     <div style={{width:'100%', height:'100%', background:'#cbd5e1', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', fontWeight:'bold'}}>IMG</div>
                 )}
            </div>

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
