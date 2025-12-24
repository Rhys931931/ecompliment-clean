import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { db, auth } from '../../config/firebase.prod';

export default function UserAgreement() {
  const navigate = useNavigate();

  const handleAgree = async () => {
      if (auth.currentUser) {
          try {
              // The "Digital Signature"
              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  terms_accepted: true,
                  terms_accepted_at: serverTimestamp()
              });
          } catch (e) { console.error("Error signing terms:", e); }
      }
      navigate(-1);
  };

  return (
    <div className="app-container" style={{background:'#f8fafc', minHeight:'100vh'}}>
      <div style={{background:'white', padding:'20px', borderBottom:'1px solid #eee', position:'sticky', top:0}}>
          <button onClick={() => navigate('/')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666'}}>
              <ArrowLeft size={18} /> Back to Home
          </button>
          <h1 style={{margin:'10px 0 0 0', fontSize:'1.8rem', color:'#333'}}>User Agreement</h1>
          <p style={{color:'#666', margin:0}}>Last Updated: Dec 2025</p>
      </div>

      <main className="content-area" style={{marginTop:'0', padding:'20px', maxWidth:'800px'}}>
          <div className="result-card" style={{textAlign:'left', lineHeight:'1.6'}}>
              <h3 style={{marginTop:0}}>1. The Vibe Check (Code of Conduct)</h3>
              <p>eCompliment is built for kindness. By using this platform, you agree to:</p>
              <ul style={{listStyleType:'circle', paddingLeft:'20px', color:'#4b5563'}}>
                  <li><strong>Send only good vibes.</strong> Harassment, hate speech, or creepy behavior will result in an immediate ban.</li>
                  <li><strong>Respect anonymity.</strong> Do not try to reverse-engineer or "dox" users who wish to remain anonymous senders.</li>
                  <li><strong>Be real.</strong> Do not use automated bots to farm coins or spam connections.</li>
              </ul>

              <h3>2. Virtual Currency (Coins)</h3>
              <div style={{display:'flex', gap:'10px', background:'#f0fdfa', padding:'15px', borderRadius:'8px', color:'#0f766e', fontSize:'0.9rem', marginBottom:'15px'}}>
                  <Coins size={20} style={{flexShrink:0}}/>
                  <div>
                      <strong>Coins are for fun.</strong> They have no monetary value outside of this platform. They cannot be redeemed for cash, refunded, or transferred to bank accounts.
                  </div>
              </div>

              <h3>3. Content & Privacy</h3>
              <p>You own the compliments you write. However, you grant eCompliment the right to deliver them. We do not sell your private chat data. Public profiles are visible to anyone with the link.</p>

              <h3>4. Liability</h3>
              <p>This app is provided "as is." We are facilitating connections, but we are not responsible for what happens in your real-world interactions.</p>

              <div style={{marginTop:'30px', borderTop:'1px solid #eee', paddingTop:'20px', textAlign:'center'}}>
                  <p style={{fontWeight:'bold', color:'#333'}}>By using eCompliment, you agree to these terms.</p>
                  <button onClick={handleAgree} className="claim-btn" style={{background:'#1e293b', color:'white', width:'200px', margin:'0 auto'}}>
                      I Understand & Agree
                  </button>
              </div>
          </div>
      </main>
    </div>
  );
}
