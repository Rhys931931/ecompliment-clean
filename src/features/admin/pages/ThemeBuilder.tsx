import { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth'; // <--- NEW
import { db, auth, storage } from '../../../config/firebase.prod'; // <--- NEW
import PrintableCard from '../../../components/PrintableCard';
import type { ThemeData } from '../../../types'; 
import { DEFAULT_LAYOUT } from '../../../types';
import { useNavigate } from 'react-router-dom';

export default function ThemeBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // --- SECURITY LOCK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const allowedAdmins = ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com'];
      
      if (!currentUser || !allowedAdmins.includes(currentUser.email || '')) {
         alert("Restricted Access: Architects Only.");
         navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  // ---------------------
  
  // Theme State
  const [themeName, setThemeName] = useState('New Custom Theme');
  const [primaryColor, setPrimaryColor] = useState('#4da6a9');
  const [bgImage, setBgImage] = useState('');
  
  // Layout State
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  
  // Controls
  const [activeControl, setActiveControl] = useState<'photo'|'qr'|'whiteBox'|'pinText'|'banner'>('banner');

  const handleSlider = (element: string, prop: string, val: string) => {
      setLayout(prev => {
          if (element === 'banner') return { ...prev }; 

          // Safe access
          const target = prev[element as keyof typeof prev];
          if (typeof target !== 'object') return prev;

          return {
              ...prev,
              [element]: {
                  ...target,
                  [prop]: parseFloat(val)
              }
          };
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
          primaryColor,
          textColor: '#ffffff', 
          backgroundImageUrl: bgImage,
          layout: layout
      };
      
      try {
          await addDoc(collection(db, 'themes'), { ...themeData, createdAt: serverTimestamp() });
          alert("Theme Saved Successfully!");
          navigate('/superadmin');
      } catch(e) { alert("Error saving theme"); }
  };

  // Helper for Slider Inputs
  const ControlSlider = ({ label, el, prop, min, max, step = "1" }: any) => {
      const target = layout[el as keyof typeof layout];
      const value = (typeof target === 'object' && target !== null) ? (target as any)[prop] : 0;

      return (
        <div style={{marginBottom:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'2px'}}>
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} 
                value={value}
                onChange={(e) => handleSlider(el, prop, e.target.value)}
                style={{width:'100%'}}
            />
        </div>
      );
  };

  return (
    <div style={{display:'flex', height:'100vh', flexDirection:'column'}}>
        {/* HEADER */}
        <div style={{padding:'15px', background:'#1e293b', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <button onClick={() => navigate('/superadmin')} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}><ArrowLeft/></button>
                <h3>Theme Studio</h3>
            </div>
            <button onClick={saveTheme} style={{background:'#4da6a9', border:'none', padding:'8px 16px', borderRadius:'6px', color:'white', fontWeight:'bold', cursor:'pointer', display:'flex', gap:'5px'}}>
                <Save size={18}/> Save Theme
            </button>
        </div>

        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
            {/* LEFT: CONTROLS */}
            <div style={{width:'300px', background:'#f8fafc', borderRight:'1px solid #ddd', overflowY:'auto', padding:'20px'}}>
                
                <div style={{marginBottom:'20px'}}>
                    <label className="input-label">Theme Name</label>
                    <input className="text-input" value={themeName} onChange={e=>setThemeName(e.target.value)} />
                </div>

                <div style={{marginBottom:'20px'}}>
                    <label className="input-label">Banner Color</label>
                    <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} style={{width:'100%', height:'40px'}}/>
                </div>

                <div style={{marginBottom:'20px'}}>
                    <label className="input-label">Background Image</label>
                    <input type="file" onChange={handleImageUpload} />
                    {loading && <div>Uploading...</div>}
                </div>

                <div style={{borderTop:'1px solid #ddd', paddingTop:'20px'}}>
                    <div style={{display:'flex', gap:'5px', marginBottom:'15px', overflowX:'auto'}}>
                        {['banner', 'photo', 'qr', 'whiteBox', 'pinText'].map(k => (
                            <button 
                                key={k}
                                onClick={() => setActiveControl(k as any)}
                                style={{
                                    padding:'6px 12px', borderRadius:'15px', border:'1px solid #ccc',
                                    background: activeControl === k ? '#1e293b' : 'white',
                                    color: activeControl === k ? 'white' : '#333',
                                    cursor:'pointer', fontSize:'0.8rem', textTransform:'capitalize'
                                }}
                            >
                                {k}
                            </button>
                        ))}
                    </div>

                    {activeControl === 'banner' && (
                        <div>
                            <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'10px'}}>Banner Height (%)</div>
                            <input type="range" min="0" max="100" value={layout.bannerHeight} onChange={e=>setLayout(p=>({...p, bannerHeight: parseInt(e.target.value)}))} style={{width:'100%'}}/>
                        </div>
                    )}

                    {(activeControl !== 'banner') && (
                        <div>
                            <ControlSlider label="Top Position (%)" el={activeControl} prop="top" min="0" max="100" />
                            <ControlSlider label="Left Position (%)" el={activeControl} prop="left" min="0" max="100" />
                            <ControlSlider label="Scale (Size)" el={activeControl} prop="scale" min="0.5" max="3" step="0.1" />
                            {activeControl === 'whiteBox' && (
                                <>
                                    <ControlSlider label="Width (%)" el="whiteBox" prop="width" min="10" max="100" />
                                    <ControlSlider label="Height (%)" el="whiteBox" prop="height" min="5" max="50" />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: PREVIEW */}
            <div style={{flex:1, background:'#e2e8f0', display:'flex', justifyContent:'center', alignItems:'center', overflow:'auto', padding:'20px'}}>
                <div style={{transform: 'scale(0.8)', transformOrigin: 'center'}}>
                    <PrintableCard 
                        theme={{
                            name: themeName,
                            primaryColor,
                            textColor: '#ffffff',
                            backgroundImageUrl: bgImage,
                            layout: layout
                        }}
                        qrCodeValue="12345678"
                        userPin="ABC12"
                        scale={1}
                    />
                </div>
            </div>
        </div>
    </div>
  );
}
