import { useState, useRef, useEffect } from 'react';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.prod';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import NavBar from '../../components/NavBar';
import PrintableCard from '../../components/PrintableCard';
import { DEFAULT_THEME } from '../../types';

export default function PrintStation() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [myPin, setMyPin] = useState('...');
  
  useEffect(() => {
      const u = auth.currentUser;
      if (u) {
          setUser(u);
          getDoc(doc(db, "users", u.uid)).then(s => {
              if (s.exists()) setMyPin(s.data().master_pin || 'ERROR');
          });
      }
  }, []);

  const handleDownload = async () => {
      if (printRef.current) {
          const dataUrl = await toPng(printRef.current, { cacheBust: true, pixelRatio: 4 });
          saveAs(dataUrl, `My-Compliment-Card.png`);
      }
  };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px'}}>
          <div style={{marginBottom:'20px'}}>
              <button onClick={() => navigate('/marketplace')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666'}}><ArrowLeft size={18}/> Back to Store</button>
              <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:'10px 0'}}>
                  <Printer color="#4da6a9" size={28}/> Print Station
              </h1>
              <p style={{color:'#666'}}>Your personal card. Print it anywhere.</p>
          </div>

          <div className="result-card" style={{textAlign:'center', overflow:'hidden'}}>
              <div style={{display:'inline-block', border:'1px solid #ddd', boxShadow:'0 10px 30px rgba(0,0,0,0.1)', borderRadius:'20px', marginBottom:'20px'}}>
                  <PrintableCard 
                      ref={printRef}
                      theme={DEFAULT_THEME} 
                      code="" // No specific code needed for master cards
                      scale={0.3} 
                      userPhoto={user?.photoURL}
                      userPin={myPin}
                  />
              </div>
              <div style={{maxWidth:'400px', margin:'0 auto', fontSize:'0.9rem', color:'#666', lineHeight:'1.5', marginBottom:'20px'}}>
                  This is your <strong>Master Card</strong>. It uses your PIN ({myPin}). 
                  When someone scans this, they enter the 8-digit code from any compliment you create digitally to claim it.
              </div>
              <button onClick={handleDownload} className="claim-btn" style={{background:'#1e293b', color:'white', width:'100%', justifyContent:'center'}}>
                  <Download size={20}/> Download High-Res PNG
              </button>
          </div>
      </main>
    </div>
  );
}
