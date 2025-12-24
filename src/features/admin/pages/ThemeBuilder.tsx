import { useState, useEffect } from 'react';
import { Save, ArrowLeft, RefreshCw, Smartphone, CreditCard } from 'lucide-react';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, storage } from '../../../config/firebase.prod';
import type { ThemeData } from '../../../types'; 
import { DEFAULT_LAYOUT, DEFAULT_THEME } from '../../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

// IMPORT SUB-COMPONENTS
import ThemeControls from '../components/theme/ThemeControls';
import ThemePreview from '../components/theme/ThemePreview';

export default function ThemeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!!editId);
  const [previewMode, setPreviewMode] = useState<'card' | 'phone'>('card');
  
  // SHARED STATE
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

  if (dataLoading) return <div style={{height:'100vh', background:'#0f172a', color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}><RefreshCw className="spin"/> Loading...</div>;

  return (
    <div style={{display:'flex', height:'100vh', flexDirection:'column', fontFamily:'sans-serif'}}>
        {/* TOP BAR */}
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

        {/* MAIN LAYOUT */}
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
            
            {/* LEFT SIDEBAR (CONTROLS) */}
            <ThemeControls 
                activeControl={activeControl}
                setActiveControl={setActiveControl}
                layout={layout}
                setLayout={setLayout}
                themeName={themeName}
                setThemeName={setThemeName}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                handleImageUpload={handleImageUpload}
                loading={loading}
            />

            {/* RIGHT MAIN (PREVIEW) */}
            <ThemePreview 
                previewMode={previewMode}
                themeName={themeName}
                primaryColor={primaryColor}
                bgImage={bgImage}
                layout={layout}
            />

        </div>
    </div>
  );
}
