import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Layers, Move, Palette, Sun, RefreshCw, Smartphone, CreditCard, type LucideIcon } from 'lucide-react';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, storage } from '../../../config/firebase.prod';
import PrintableCard from '../../../components/PrintableCard';
import type { ThemeData, ElementStyle } from '../../../types'; 
import { DEFAULT_LAYOUT, DEFAULT_THEME } from '../../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon, title: string }) => (
    <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#94a3b8', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase', marginTop:'20px', marginBottom:'10px', borderBottom:'1px solid #334155', paddingBottom:'5px'}}>
        <Icon size={14}/> {title}
    </div>
);

const ControlRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'0.8rem', color:'#cbd5e1', marginBottom:'4px'}}>{label}</div>
        {children}
    </div>
);

export default function ThemeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!!editId);
  const [previewMode, setPreviewMode] = useState<'card' | 'phone'>('card');
  
  const [themeName, setThemeName] = useState(DEFAULT_THEME.name);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primaryColor);
  const [bgImage, setBgImage] = useState(DEFAULT_THEME.backgroundImageUrl || '');
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [status, setStatus] = useState<'active'|'archived'>('active');
  
  const [activeControl, setActiveControl] = useState<string>('banner');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const allowedAdmins = ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com'];
      if (!currentUser || !allowedAdmins.includes(currentUser.email || '')) {
         navigate('/dashboard');
         return;
      }
      if (editId) {
          try {
              const docSnap = await getDoc(doc(db, 'themes', editId));
              if (docSnap.exists()) {
                  const data = docSnap.data() as ThemeData;
                  setThemeName(data.name);
                  setPrimaryColor(data.primaryColor);
                  setBgImage(data.backgroundImageUrl || '');
                  setStatus(data.status || 'active');
                  setLayout({ ...DEFAULT_LAYOUT, ...data.layout }); 
              }
          } catch(e) { console.error(e); }
          setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate, editId]);

  const updateElement = (key: string, field: string, value: any) => {
      setLayout(prev => {
          // @ts-ignore
          const target = prev[key];
          if (!target) return prev;
          return { ...prev, [key]: { ...target, [field]: value } };
      });
  };

  const handleImageUpload = async (e: any) => {
      if(!e.target.files[0]) return;
      setLoading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `theme-backgrounds/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setBgImage(url);
      setLoading(false);
  };

  const saveTheme = async () => {
      const themeData: ThemeData = {
          name: themeName,
          status,
          primaryColor,
          textColor: '#ffffff',
          backgroundImageUrl: bgImage,
          layout: layout
      };
      
      try {
          if (editId) {
              await updateDoc(doc(db, 'themes', editId), { ...themeData });
              alert("Theme Updated!");
          } else {
              await addDoc(collection(db, 'themes'), { ...themeData, createdAt: serverTimestamp() });
              alert("New Theme Created!");
          }
          navigate('/superadmin');
      } catch(e) { alert("Error saving theme"); }
  };

  const renderControls = () => {
      if (activeControl === 'banner') {
          return (
             <>
                <SectionHeader icon={Palette} title="Global Styles" />
                <ControlRow label="Theme Name"><input className="dark-input" value={themeName} onChange={e=>setThemeName(e.target.value)} /></ControlRow>
                <ControlRow label="Primary Color"><input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} style={{width:'100%', height:'40px', cursor:'pointer'}}/></ControlRow>
                <ControlRow label="Background Image"><input type="file" onChange={handleImageUpload} style={{color:'white', fontSize:'0.8rem'}} />{loading && <span style={{color:'#4da6a9', fontSize:'0.8rem'}}>Uploading...</span>}</ControlRow>
                
                <SectionHeader icon={Layers} title="Layout" />
                <ControlRow label={`Banner Height: ${layout.bannerHeight}%`}><input type="range" className="dark-range" min="0" max="100" value={layout.bannerHeight} onChange={e=>setLayout(p=>({...p, bannerHeight: parseInt(e.target.value)}))} /></ControlRow>
             </>
          );
      }
      // @ts-ignore
      const el = layout[activeControl] as ElementStyle;
      if (!el) return null;
      return (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', background:'#334155', padding:'10px', borderRadius:'8px'}}><span style={{fontWeight:'bold', color:'white', textTransform:'capitalize'}}>{activeControl.replace(/([A-Z])/g, ' $1').trim()}</span><label style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem', color:'white'}}><input type="checkbox" checked={el.visible} onChange={e=>updateElement(activeControl, 'visible', e.target.checked)} /> Visible</label></div>
            <SectionHeader icon={Move} title="Position & Size" />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Top %"><input type="number" className="dark-input" value={el.top} onChange={e=>updateElement(activeControl, 'top', parseInt(e.target.value))} /></ControlRow><ControlRow label="Left %"><input type="number" className="dark-input" value={el.left} onChange={e=>updateElement(activeControl, 'left', parseInt(e.target.value))} /></ControlRow></div>
            <ControlRow label={`Scale: ${el.scale}x`}><input type="range" className="dark-range" min="0.1" max="3" step="0.1" value={el.scale} onChange={e=>updateElement(activeControl, 'scale', parseFloat(e.target.value))} /></ControlRow>
            {(activeControl === 'whiteBox') && (<><SectionHeader icon={Layers} title="Box Dimensions" /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Width %"><input type="number" className="dark-input" value={el.width || 0} onChange={e=>updateElement(activeControl, 'width', parseInt(e.target.value))} /></ControlRow><ControlRow label="Height %"><input type="number" className="dark-input" value={el.height || 0} onChange={e=>updateElement(activeControl, 'height', parseInt(e.target.value))} /></ControlRow></div><ControlRow label={`Corner Radius: ${el.borderRadius || 0}px`}><input type="range" className="dark-range" min="0" max="50" value={el.borderRadius || 0} onChange={e=>updateElement(activeControl, 'borderRadius', parseInt(e.target.value))} /></ControlRow><ControlRow label="Background Color"><input type="color" value={el.backgroundColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'backgroundColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow></>)}
            {(activeControl === 'headerText' || activeControl === 'footerText' || activeControl === 'pinText') && (<ControlRow label="Text Color"><input type="color" value={el.color || '#000000'} onChange={e=>updateElement(activeControl, 'color', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow>)}
            {activeControl === 'qr' && (<><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Dots Color"><input type="color" value={el.qrFgColor || '#000000'} onChange={e=>updateElement(activeControl, 'qrFgColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow><ControlRow label="Background"><input type="color" value={el.qrBgColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'qrBgColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow></div><div style={{marginTop:'10px'}}><label style={{color:'white', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'8px'}}><input type="checkbox" checked={el.frame || false} onChange={e=>updateElement(activeControl, 'frame', e.target.checked)} /> Enable Frame</label></div>{el.frame && (<ControlRow label="Frame Color"><input type="color" value={el.frameColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'frameColor', e.target.value)} style={{width:'100%', height:'30px', marginTop:'5px'}}/></ControlRow>)}</>)}
            <div style={{marginTop:'20px', borderTop:'1px solid #334155', paddingTop:'10px'}}><label style={{color:'white', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px'}}><input type="checkbox" checked={el.shadow || false} onChange={e=>updateElement(activeControl, 'shadow', e.target.checked)} /> <Sun size={16} /> Enable Drop Shadow</label>{el.shadow && (<div style={{paddingLeft:'10px', borderLeft:'2px solid #4da6a9'}}><ControlRow label={`Angle: ${el.shadowAngle || 45}°`}><input type="range" className="dark-range" min="0" max="360" value={el.shadowAngle || 45} onChange={e=>updateElement(activeControl, 'shadowAngle', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Distance: ${el.shadowDistance || 5}px`}><input type="range" className="dark-range" min="0" max="50" value={el.shadowDistance || 5} onChange={e=>updateElement(activeControl, 'shadowDistance', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Blur: ${el.shadowBlur || 10}px`}><input type="range" className="dark-range" min="0" max="50" value={el.shadowBlur || 10} onChange={e=>updateElement(activeControl, 'shadowBlur', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Opacity: ${el.shadowOpacity || 0.3}`}><input type="range" className="dark-range" min="0" max="1" step="0.1" value={el.shadowOpacity || 0.3} onChange={e=>updateElement(activeControl, 'shadowOpacity', parseFloat(e.target.value))} /></ControlRow></div>)}</div>
          </>
      );
  };

  if (dataLoading) return <div style={{height:'100vh', background:'#0f172a', color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}><RefreshCw className="spin"/> Loading...</div>;

  return (
    <div style={{display:'flex', height:'100vh', flexDirection:'column', fontFamily:'sans-serif'}}>
        <style>{`.dark-input{width:100%;background:#0f172a;border:1px solid #334155;color:white;padding:8px;border-radius:4px;box-sizing:border-box}.dark-range{width:100%;cursor:pointer}.tool-btn{padding:10px;cursor:pointer;color:#94a3b8;border-bottom:2px solid transparent;font-size:0.85rem;font-weight:bold;white-space:nowrap}.tool-btn.active{color:#4da6a9;border-bottom-color:#4da6a9}.tool-btn:hover{color:white}`}</style>
        
        <div style={{padding:'10px 20px', background:'#0f172a', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #334155'}}>
            <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <button onClick={() => navigate('/superadmin')} style={{background:'none', border:'none', color:'#94a3b8', cursor:'pointer'}}><ArrowLeft size={20}/></button>
                <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>Theme Studio <span style={{fontSize:'0.7rem', background:'#4da6a9', padding:'2px 6px', borderRadius:'4px', marginLeft:'10px'}}>{editId ? 'EDIT' : 'NEW'}</span></div>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => setPreviewMode('card')} style={{background: previewMode==='card'?'#1e293b':'transparent', border:'1px solid #334155', padding:'6px 12px', borderRadius:'6px', color:'white', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}><CreditCard size={16}/> Card</button>
                <button onClick={() => setPreviewMode('phone')} style={{background: previewMode==='phone'?'#1e293b':'transparent', border:'1px solid #334155', padding:'6px 12px', borderRadius:'6px', color:'white', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}><Smartphone size={16}/> Phone</button>
            </div>
            <button onClick={saveTheme} style={{background:'#4da6a9', border:'none', padding:'8px 20px', borderRadius:'6px', color:'white', fontWeight:'bold', cursor:'pointer', display:'flex', gap:'8px', alignItems:'center'}}>
                <Save size={18}/> {editId ? 'Update Theme' : 'Save New'}
            </button>
        </div>

        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
            <div style={{width:'320px', background:'#1e293b', borderRight:'1px solid #334155', display:'flex', flexDirection:'column'}}>
                <div style={{display:'flex', overflowX:'auto', background:'#0f172a', borderBottom:'1px solid #334155', padding:'0 10px'}}>
                    {['banner', 'photo', 'qr', 'whiteBox', 'headerText', 'footerText', 'pinText'].map(k => (<div key={k} onClick={() => setActiveControl(k)} className={`tool-btn ${activeControl === k ? 'active' : ''}`}>{k === 'whiteBox' ? 'Box' : k.replace('Text','')}</div>))}
                </div>
                <div style={{flex:1, overflowY:'auto', padding:'20px'}}>{renderControls()}</div>
            </div>

            <div style={{flex:1, background:'#cbd5e1', display:'flex', justifyContent:'center', alignItems:'center', overflow:'auto', padding:'40px', position:'relative'}}>
                {/* CHECKERBOARD */}
                <div style={{position:'absolute', inset:0, opacity:0.1, pointerEvents:'none', backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}} />
                
                {previewMode === 'card' ? (
                    <div style={{transform: 'scale(0.85)', transformOrigin: 'center', boxShadow:'0 50px 100px -20px rgba(0,0,0,0.4)'}}>
                        <PrintableCard theme={{ name: themeName, primaryColor, textColor: '#ffffff', backgroundImageUrl: bgImage, layout: layout }} qrCodeValue="12345678" userPin="ABC12" scale={1} />
                    </div>
                ) : (
                    // PHONE MOCKUP
                    <div style={{width:'360px', height:'700px', background: bgImage ? `url(${bgImage})` : 'white', backgroundSize:'cover', backgroundPosition:'center', borderRadius:'40px', border:'12px solid #1e293b', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', position:'relative', overflow:'hidden'}}>
                        {/* Status Bar */}
                        <div style={{height:'30px', background:'rgba(0,0,0,0.3)', width:'100%', position:'absolute', top:0, zIndex:20}}></div>
                        {/* Navbar Mock */}
                        <div style={{height:'60px', background: primaryColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold', position:'absolute', top:'30px', width:'100%', zIndex:10}}>eCompliment</div>
                        {/* Content Mock */}
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
        </div>
    </div>
  );
}
