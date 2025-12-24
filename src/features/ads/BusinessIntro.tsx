import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Target, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function BusinessIntro() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleJoin = async () => {
      if (!user) return;
      if (confirm("Enable Business features for your account?")) {
          try {
              // Upgrade user
              await updateDoc(doc(db, "users", user.uid), { is_business: true });
              navigate('/business'); // Redirect to the actual dashboard
          } catch (e) {
              console.error(e);
              alert("Error upgrading account.");
          }
      }
  };

  return (
    <div className="app-container" style={{background:'#fff'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', padding:'40px 20px', textAlign:'center'}}>
        
        <button onClick={() => navigate('/dashboard')} style={{position:'absolute', top:'80px', left:'20px', background:'none', border:'none', cursor:'pointer'}}>
            <ArrowLeft size={24} color="#333"/>
        </button>

        <div style={{background:'#e0f2fe', width:'80px', height:'80px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'20px auto'}}>
            <TrendingUp size={40} color="#0284c7"/>
        </div>

        <h1 style={{fontSize:'2rem', color:'#333', marginBottom:'10px'}}>Advertise on Kindness</h1>
        <p style={{fontSize:'1.1rem', color:'#666', lineHeight:'1.5', maxWidth:'400px', margin:'0 auto 40px auto'}}>
            Reach local customers right when they are feeling good. Attach your offer to digital compliments.
        </p>

        <div style={{textAlign:'left', display:'flex', flexDirection:'column', gap:'20px', maxWidth:'400px', margin:'0 auto 40px auto'}}>
            <div style={{display:'flex', gap:'15px'}}>
                <Users size={24} color="#4da6a9"/>
                <div>
                    <div style={{fontWeight:'bold'}}>Hyper-Local Reach</div>
                    <div style={{color:'#666', fontSize:'0.9rem'}}>Connect with people in your immediate area.</div>
                </div>
            </div>
            <div style={{display:'flex', gap:'15px'}}>
                <Target size={24} color="#f59e0b"/>
                <div>
                    <div style={{fontWeight:'bold'}}>High Engagement</div>
                    <div style={{color:'#666', fontSize:'0.9rem'}}>100% open rate on claimed compliments.</div>
                </div>
            </div>
            <div style={{display:'flex', gap:'15px'}}>
                <CheckCircle size={24} color="#10b981"/>
                <div>
                    <div style={{fontWeight:'bold'}}>Positive Association</div>
                    <div style={{color:'#666', fontSize:'0.9rem'}}>Your brand linked to a happy moment.</div>
                </div>
            </div>
        </div>

        <button 
            onClick={handleJoin}
            className="claim-btn"
            style={{background:'#1e293b', color:'white', width:'100%', maxWidth:'400px', margin:'0 auto', fontSize:'1.1rem', padding:'15px'}}
        >
            Start Advertising
        </button>

      </main>
    </div>
  );
}