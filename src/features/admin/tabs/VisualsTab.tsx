import { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import PrintableCard from '../../../components/PrintableCard';

export default function VisualsTab() {
  const [themes, setThemes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
      getDocs(collection(db, "themes")).then(snap => {
          setThemes(snap.docs.map(d => ({id: d.id, ...d.data()})).filter((t: any) => t.status !== 'archived'));
      });
  }, []);

  return (
      <div className="result-card" style={{textAlign:'left'}}>
          <h3 style={{marginBottom:'20px'}}>Theme Visualizer (Side-by-Side)</h3>
          <div style={{display:'grid', gap:'40px'}}>
              {themes.map(theme => (
                  <div key={theme.id} style={{borderBottom:'1px solid #eee', paddingBottom:'40px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                           <h4 style={{margin:0}}>{theme.name}</h4>
                           <button onClick={() => navigate(`/admin/builder?id=${theme.id}`)} style={{background:'#e0f2fe', color:'#0284c7', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}><Edit2 size={16}/> Edit</button>
                      </div>
                      <div style={{display:'flex', flexWrap:'wrap', gap:'20px', alignItems:'flex-start'}}>
                          
                          {/* PHONE PREVIEW */}
                          <div>
                              <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'5px', fontWeight:'bold', textAlign:'center'}}>PHONE</div>
                              <div style={{
                                  width:'180px', height:'320px', 
                                  backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : 'none',
                                  backgroundColor: '#fff',
                                  backgroundSize:'cover', backgroundPosition:'center',
                                  borderRadius:'20px', border:'8px solid #1e293b',
                                  position:'relative', overflow:'hidden', boxShadow:'0 10px 20px rgba(0,0,0,0.2)'
                              }}>
                                  <div style={{background: theme.primaryColor, height:'30px', width:'100%', position:'absolute', top:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.7rem', fontWeight:'bold'}}>eCompliment</div>
                                  <div style={{position:'absolute', bottom:'20px', left:'10px', right:'10px', background:'rgba(255,255,255,0.9)', padding:'10px', borderRadius:'10px', textAlign:'center'}}>
                                       <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#ccc', margin:'0 auto 5px auto'}}></div>
                                       <div style={{fontSize:'0.6rem'}}>User sent a message</div>
                                  </div>
                              </div>
                          </div>

                          {/* CARD PREVIEW */}
                          <div>
                              <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'5px', fontWeight:'bold', textAlign:'center'}}>CARD</div>
                              <PrintableCard 
                                  theme={theme} 
                                  scale={0.25} 
                                  qrCodeValue="12345678" 
                                  userPin="ABC12" 
                              />
                          </div>

                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}
