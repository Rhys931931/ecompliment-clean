import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        if(u) setUser(u);
        else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', padding:'20px'}}>
        
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'25px'}}>
            <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer'}}><ArrowLeft size={20}/></button>
            <h1 style={{margin:0, fontSize:'1.8rem'}}>My Reviews</h1>
        </div>

        {/* EMPTY STATE FOR NOW */}
        <div style={{textAlign:'center', padding:'50px 20px', background:'white', borderRadius:'16px', border:'1px dashed #ccc'}}>
            <Star size={48} color="#e5e7eb" fill="#e5e7eb" style={{marginBottom:'15px'}}/>
            <h3 style={{margin:0, color:'#333'}}>No Reviews Yet</h3>
            <p style={{color:'#666', marginTop:'10px'}}>
                Reviews happen when you connect with people after a compliment.
                <br/>(Feature coming in V4.2)
            </p>
        </div>

      </main>
    </div>
  );
}
