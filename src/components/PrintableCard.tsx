import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { ThemeData } from '../types'; // Type-only import
import { DEFAULT_LAYOUT } from '../types';

interface PrintableCardProps {
  theme: ThemeData;
  code: string;
  userPhoto?: string;
  userPin: string;
  scale?: number;
}

const PrintableCard = forwardRef<HTMLDivElement, PrintableCardProps>(({ theme, userPhoto, userPin, scale = 1 }, ref) => {
  // Use provided layout or fallback to default
  const layout = theme.layout || DEFAULT_LAYOUT;

  const BASE_WIDTH = 1050;
  const BASE_HEIGHT = 600;
  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;

  const qrUrl = `https://ecompliment.app/?theme=${theme.id || 'default'}`;

  return (
    <div ref={ref} style={{
      width: `${width}px`, height: `${height}px`, position: 'relative',
      backgroundColor: 'white', overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif'
    }}>
      {/* 1. BACKGROUND */}
      {theme.backgroundImageUrl && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${theme.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
      )}

      {/* 2. BANNER */}
      <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, 
          height: `${layout.bannerHeight}%`,
          backgroundColor: theme.primaryColor,
          display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 2
      }}>
          <h1 style={{margin: 0, color: theme.textColor, fontSize: `${36 * scale}px`, fontWeight: 'bold', fontStyle: 'italic', letterSpacing: '-1px'}}>eCompliment</h1>
      </div>

      {/* 3. WHITE BOX */}
      {layout.whiteBox.visible && (
        <div style={{
            position: 'absolute', 
            top: `${layout.whiteBox.top}%`, left: `${layout.whiteBox.left}%`,
            width: `${layout.whiteBox.width}%`, height: `${layout.whiteBox.height! * 6}px`, // Roughly scaled
            transform: `translate(-50%, -50%) scale(${layout.whiteBox.scale})`,
            backgroundColor: 'white', border: `2px solid ${theme.primaryColor}`, borderRadius: '10px',
            zIndex: 1, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
        }}>
             {/* Hint Text */}
             <div style={{position:'absolute', bottom:'5px', width:'100%', textAlign:'center', color:'#ccc', fontSize:`${10*scale}px`}}>WRITE CODE HERE</div>
        </div>
      )}

      {/* 4. USER PHOTO */}
      {layout.photo.visible && (
        <div style={{
            position: 'absolute', 
            top: `${layout.photo.top}%`, left: `${layout.photo.left}%`,
            transform: `scale(${layout.photo.scale})`, zIndex: 3
        }}>
            <div style={{
                width: `${180 * scale}px`, height: `${180 * scale}px`,
                borderRadius: '50%', border: `${6 * scale}px solid white`,
                backgroundColor: '#f0f0f0', overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {userPhoto ? <img src={userPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#999', fontSize:`${40*scale}px`}}>IMG</div>}
            </div>
        </div>
      )}

      {/* 5. PIN TEXT */}
      {layout.pinText.visible && (
        <div style={{
            position: 'absolute', 
            top: `${layout.pinText.top}%`, left: `${layout.pinText.left}%`,
            transform: `scale(${layout.pinText.scale})`, zIndex: 3, textAlign:'center'
        }}>
            <div style={{color: theme.primaryColor, fontSize:`${12*scale}px`, fontWeight:'bold'}}>5-DIGIT PIN:</div>
            <div style={{fontSize:`${24*scale}px`, fontWeight:'bold', fontFamily:'monospace', color:'#333'}}>{userPin}</div>
        </div>
      )}

      {/* 6. QR CODE */}
      {layout.qr.visible && (
        <div style={{
            position: 'absolute', 
            top: `${layout.qr.top}%`, left: `${layout.qr.left}%`,
            transform: `scale(${layout.qr.scale})`, zIndex: 3,
            background: 'white', padding: '10px', borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `3px solid ${theme.primaryColor}`
        }}>
             <QRCodeSVG value={qrUrl} size={120 * scale} level="H" fgColor="#333"/>
        </div>
      )}

      {/* 7. WEBSITE FOOTER */}
      {layout.website.visible && (
        <div style={{
            position: 'absolute', 
            top: `${layout.website.top}%`, left: `${layout.website.left}%`,
            transform: `translate(-50%, -50%) scale(${layout.website.scale})`,
            fontSize: `${16 * scale}px`, fontWeight: 'bold', color: theme.primaryColor, zIndex: 3, width:'100%', textAlign:'center'
        }}>
            https://ecompliment.app
        </div>
      )}

    </div>
  );
});

export default PrintableCard;
