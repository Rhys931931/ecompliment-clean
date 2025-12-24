import { useState, useEffect } from 'react';
import { Palette, Edit2, Archive, RotateCcw, Trash2, PackagePlus } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';

export default function ThemesTab() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadThemes(); }, []);

  const loadThemes = async () => {
      try {
          const snap = await getDocs(collection(db, "themes"));
          setThemes(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const handleArchiveTheme = async (id: string) => { await updateDoc(doc(db, "themes", id), { status: 'archived' }); loadThemes(); };
  const handleRestoreTheme = async (id: string) => { await updateDoc(doc(db, "themes", id), { status: 'active' }); loadThemes(); };
  const handleDeleteTheme = async (id: string) => { if (confirm("Delete Forever?")) { await deleteDoc(doc(db, "themes", id)); loadThemes(); }};
  
  const handleSeedThemes = async () => { 
      if(!confirm("Create starter themes?")) return; 
      const batch = writeBatch(db); 
      const starters = [ 
          { name: 'Classic Teal', primaryColor: '#4da6a9', textColor: '#333333', backgroundImageUrl: '' }, 
          { name: 'Midnight', primaryColor: '#1e293b', textColor: '#ffffff', backgroundImageUrl: '' }, 
          { name: 'Gold Standard', primaryColor: '#d97706', textColor: '#ffffff', backgroundImageUrl: '' } 
      ]; 
      starters.forEach(t => { const ref = doc(collection(db, 'themes')); batch.set(ref, { ...t, createdAt: serverTimestamp(), status: 'active' }); }); 
      await batch.commit(); 
      loadThemes(); 
      alert("Themes created!"); 
  };

  const activeThemes = themes.filter(t => t.status !== 'archived');
  const archivedThemes = themes.filter(t => t.status === 'archived');

  if(loading) return <div>Loading Themes...</div>;

  return (
    <div className="result-card" style={{textAlign:'left'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h3>Theme Manager</h3>
            <button onClick={() => navigate('/admin/builder')} style={{background:'#8b5cf6', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', fontWeight:'bold'}}><Palette size={18}/> Create New</button>
        </div>
        
        <button onClick={handleSeedThemes} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', fontWeight:'bold', marginBottom:'20px'}}><PackagePlus size={18}/> Seed Starters</button>

        <div style={{borderTop:'1px solid #eee', paddingTop:'20px'}}>
            <h4 style={{margin:'0 0 15px 0', color:'#666'}}>Active Library</h4>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px', marginBottom:'40px'}}>
                {activeThemes.map(theme => (
                    <div key={theme.id} style={{border:'1px solid #eee', borderRadius:'8px', overflow:'hidden', position:'relative'}}>
                        <div style={{height:'80px', backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : 'none', backgroundColor: theme.primaryColor, backgroundSize:'cover', backgroundPosition:'center'}}></div>
                        <div style={{padding:'10px', background:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:'bold', fontSize:'0.85rem'}}>{theme.name}</div>
                            <div style={{display:'flex', gap:'5px'}}>
                                <button onClick={() => navigate(`/admin/builder?id=${theme.id}`)} style={{background:'#e0f2fe', border:'none', borderRadius:'4px', padding:'5px', color:'#0284c7', cursor:'pointer'}}><Edit2 size={14}/></button>
                                <button onClick={() => theme.id && handleArchiveTheme(theme.id)} style={{background:'#fee2e2', border:'none', borderRadius:'4px', padding:'5px', color:'#b91c1c', cursor:'pointer'}} title="Archive"><Archive size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <h4 style={{margin:'0 0 10px 0', color:'#999'}}>Archived (Hidden)</h4>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px', opacity:0.7}}>
                {archivedThemes.map(theme => (
                    <div key={theme.id} style={{border:'1px dashed #ccc', borderRadius:'8px', overflow:'hidden', position:'relative', background:'#f9fafb'}}>
                         <div style={{padding:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:'bold', fontSize:'0.85rem', color:'#666'}}>{theme.name}</div>
                            <div style={{display:'flex', gap:'5px'}}>
                                <button onClick={() => theme.id && handleRestoreTheme(theme.id)} style={{background:'#dcfce7', border:'none', borderRadius:'4px', padding:'5px', color:'#166534', cursor:'pointer'}} title="Restore"><RotateCcw size={14}/></button>
                                <button onClick={() => theme.id && handleDeleteTheme(theme.id)} style={{background:'#fee2e2', border:'none', borderRadius:'4px', padding:'5px', color:'#b91c1c', cursor:'pointer'}} title="Delete Forever"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
