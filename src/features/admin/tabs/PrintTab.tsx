import { useState, useRef } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import PrintableCard from '../../../components/PrintableCard';
import { db } from '../../../config/firebase.prod';
import { collection, getDocs } from 'firebase/firestore';

// Note: This tab is a bit self-contained but also accepts props if "sent" here
export default function PrintTab({ initialTheme, initialCustomer, initialCode }: any) {
  const [themes, setThemes] = useState<any[]>([]);
  const [printCode, setPrintCode] = useState(initialCode || '12345678');
  const [printTheme, setPrintTheme] = useState<any>(initialTheme || null);
  const printRef = useRef<HTMLDivElement>(null);

  useState(() => {
      getDocs(collection(db, "themes")).then(snap => {
          setThemes(snap.docs.map(d => ({id: d.id, ...d.data()})).filter((t: any) => t.status !== 'archived'));
      });
  });

  const downloadCardImage = async () => { if (printRef.current) { const dataUrl = await toPng(printRef.current, { cacheBust: true, pixelRatio: 6 }); saveAs(dataUrl, `eCompliment-${printCode}.png`); }};
  const generateRandomCode = () => { setPrintCode(Math.floor(10000000 + Math.random() * 90000000).toString()); };

  return (
      <div className="result-card" style={{textAlign:'left'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3 style={{margin:0}}>Print Lab</h3>
              <button onClick={downloadCardImage} className="claim-btn" style={{background:'#4da6a9'}}><Download size={18}/> Download PNG</button>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'20px'}}>
              <div style={{flex: '1 1 300px', border:'1px dashed #ccc', padding:'20px', display:'flex', justifyContent:'center', background:'#f8fafc', overflow:'auto'}}>
                  {printTheme ? (
                    <PrintableCard 
                        ref={printRef}
                        theme={printTheme}
                        qrCodeValue={printCode} 
                        scale={0.5}
                        userPhoto={initialCustomer?.photo_url} 
                        userPin={initialCustomer?.master_pin || 'PENDING'}     
                    />
                  ) : <div style={{padding:'40px', color:'#999'}}>Select a theme...</div>}
              </div>
              <div style={{flex: '1 1 300px', padding:'20px', background:'#f1f5f9', borderRadius:'12px'}}>
                  <label className="input-label" style={{marginBottom:'10px'}}>Test Theme Link:</label>
                  {printTheme ? (<div style={{marginBottom:'20px', padding:'10px', background:'white', borderRadius:'6px', border:'1px solid #ddd', wordBreak:'break-all'}}><a href={`https://ecompliment.app/?theme=${printTheme.id}`} target="_blank" rel="noreferrer" style={{color:'#4da6a9', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', textDecoration:'none'}}><ExternalLink size={16}/> Open Theme</a></div>) : <div style={{color:'#999'}}>Select a theme...</div>}
                  <label className="input-label" style={{marginTop:'15px'}}>Generate New Code:</label>
                  <div style={{display:'flex', gap:'10px'}}>
                      <input className="text-input" value={printCode} onChange={e=>setPrintCode(e.target.value)} />
                      <button onClick={generateRandomCode} style={{padding:'8px', cursor:'pointer'}}>🎲</button>
                  </div>
                  <label className="input-label" style={{marginTop:'15px'}}>Select Theme:</label>
                  <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                      {themes.map(theme => (
                          <button key={theme.id} onClick={()=>setPrintTheme(theme)} style={{padding:'5px 10px', cursor:'pointer', border: printTheme?.id === theme.id ? '2px solid #4da6a9' : '1px solid #ccc', backgroundColor: printTheme?.id === theme.id ? '#e6fffa' : 'white', borderRadius:'4px'}}>
                              {theme.name}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );
}
