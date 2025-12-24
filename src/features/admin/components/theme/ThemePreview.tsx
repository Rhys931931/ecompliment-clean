import PrintableCard from '../../../../components/PrintableCard';
import type { ThemeLayout } from '../../../../types';

interface Props {
  previewMode: 'card' | 'phone';
  themeName: string;
  primaryColor: string;
  bgImage: string;
  layout: ThemeLayout;
}

export default function ThemePreview({ previewMode, themeName, primaryColor, bgImage, layout }: Props) {
  return (
    <div style={{flex:1, background:'#cbd5e1', display:'flex', justifyContent:'center', alignItems:'center', overflow:'auto', padding:'40px', position:'relative'}}>
        {/* CHECKERBOARD BACKGROUND */}
        <div style={{
            position:'absolute', inset:0, opacity:0.1, pointerEvents:'none', 
            backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', 
            backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }} />
        
        {previewMode === 'card' ? (
            <div style={{transform: 'scale(0.85)', transformOrigin: 'center', boxShadow:'0 50px 100px -20px rgba(0,0,0,0.4)'}}>
                <PrintableCard 
                    theme={{ name: themeName, primaryColor, textColor: '#ffffff', backgroundImageUrl: bgImage, layout: layout }} 
                    qrCodeValue="12345678" 
                    userPin="ABC12" 
                    scale={1} 
                />
            </div>
        ) : (
            <div style={{width:'360px', height:'700px', background: bgImage ? `url(${bgImage})` : 'white', backgroundSize:'cover', backgroundPosition:'center', borderRadius:'40px', border:'12px solid #1e293b', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', position:'relative', overflow:'hidden'}}>
                <div style={{height:'30px', background:'rgba(0,0,0,0.3)', width:'100%', position:'absolute', top:0, zIndex:20}}></div>
                <div style={{height:'60px', background: primaryColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold', position:'absolute', top:'30px', width:'100%', zIndex:10}}>eCompliment</div>
                <div style={{marginTop:'120px', padding:'20px', display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div style={{background:'rgba(255,255,255,0.9)', padding:'20px', borderRadius:'16px', textAlign:'center', backdropFilter:'blur(10px)'}}>
                        <div style={{width:'80px', height:'80px', background:'#eee', borderRadius:'50%', margin:'0 auto 15px auto', display:'flex', alignItems:'center', justifyContent:'center'}}>User</div>
                        <h3>You are amazing!</h3>
                        <p style={{color:'#666', fontSize:'0.9rem'}}>This is how the background and colors will look on a user's phone.</p>
                        <button style={{background: primaryColor, color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', marginTop:'10px', width:'100%'}}>Claim Gift</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
