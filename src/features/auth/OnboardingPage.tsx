import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, User, Mail, Send, Sparkles, ChevronRight, Loader, Shield } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // STATE: We define steps first so we can update them later
  const [steps, setSteps] = useState([
    { id: 'terms', label: 'Review Community Rules', completed: false, icon: <Shield size={20}/>, action: () => navigate('/terms') },
    { id: 'photo', label: 'Add Profile Photo', completed: false, icon: <User size={20}/>, action: () => navigate('/profile') },
    { id: 'email', label: 'Verify Email', completed: false, icon: <Mail size={20}/>, action: () => handleVerify() }, // Placeholder, updated below
    { id: 'first_sent', label: 'Send Your First Compliment', completed: false, icon: <Send size={20}/>, action: () => navigate('/create') },
    { id: 'bio', label: 'Add a Bio', completed: false, icon: <Sparkles size={20}/>, action: () => navigate('/profile') }
  ]);

  // ACTION: Send Email and Update Button Text
  const handleVerify = async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
          try {
              await sendEmailVerification(auth.currentUser);
              alert("Verification email sent! Check your inbox (and spam).");
              
              // VISUAL FEEDBACK: Change the button text
              setSteps(prev => prev.map(s => s.id === 'email' ? { ...s, label: 'Email Sent! Check Inbox.' } : s));
              
          } catch (e) {
              console.error(e);
              alert("Error sending email. Try again later.");
          }
      }
  };

  // UPDATE: Ensure the handleVerify is attached to the state
  useEffect(() => {
      setSteps(prev => prev.map(s => s.id === 'email' ? { ...s, action: handleVerify } : s));
  }, []);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkProgress(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const checkProgress = async (currentUser: any) => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Clone steps to modify
      const newSteps = [...steps];
      // Note: We map by index or ID to be safe, but here we just iterate
      // We need to match the IDs exactly as defined in the state above

      // 1. Terms
      if (userData.terms_accepted) {
          const idx = newSteps.findIndex(s => s.id === 'terms');
          if(idx !== -1) newSteps[idx].completed = true;
      }

      // 2. Photo
      if (currentUser.photoURL) {
          const idx = newSteps.findIndex(s => s.id === 'photo');
          if(idx !== -1) newSteps[idx].completed = true;
      }
      
      // 3. Email
      if (currentUser.emailVerified) {
          const idx = newSteps.findIndex(s => s.id === 'email');
          if(idx !== -1) {
              newSteps[idx].completed = true;
              newSteps[idx].label = "Email Verified";
          }
      }

      // 4. First Sent
      const q = query(collection(db, "compliments"), where("sender_uid", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
          const idx = newSteps.findIndex(s => s.id === 'first_sent');
          if(idx !== -1) newSteps[idx].completed = true;
      }

      // 5. Bio
      if (userData.bio) {
          const idx = newSteps.findIndex(s => s.id === 'bio');
          if(idx !== -1) newSteps[idx].completed = true;
      }

      setSteps(newSteps);
      const completedCount = newSteps.filter(s => s.completed).length;
      setProgress(Math.round((completedCount / newSteps.length) * 100));

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}><Loader className="spin" size={40} color="#4da6a9"/></div>;

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'600px', width:'100%', padding:'20px'}}>
        
        <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'20px'}}>
            <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div style={{background:'white', borderRadius:'16px', padding:'30px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', textAlign:'center', marginBottom:'25px'}}>
            <div style={{position:'relative', width:'120px', height:'120px', margin:'0 auto 20px auto'}}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="339.292" strokeDashoffset={339.292 - (339.292 * progress) / 100} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:'bold', color:'#333'}}>{progress}%</div>
            </div>
            <h2 style={{margin:'0 0 5px 0'}}>Your Journey</h2>
            <p style={{color:'#666', margin:0}}>Complete these steps to become a pro.</p>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {steps.map((step) => (
                <div key={step.id} onClick={step.action} style={{background: step.completed ? '#f0fdfa' : 'white', border: step.completed ? '1px solid #ccfbf1' : '1px solid #eee', borderRadius:'12px', padding:'15px 20px', display:'flex', alignItems:'center', gap:'15px', cursor:'pointer', opacity: step.completed ? 0.8 : 1}}>
                    <div style={{color: step.completed ? '#10b981' : '#94a3b8'}}>{step.completed ? <CheckCircle size={24} fill="#10b981" color="white" /> : <Circle size={24} />}</div>
                    <div style={{flex:1, fontWeight:'bold', color: step.completed ? '#0f766e' : '#333'}}>{step.label}</div>
                    {step.completed ? <span style={{fontSize:'0.8rem', fontWeight:'bold', color:'#10b981'}}>Done</span> : <ChevronRight size={20} color="#ccc" />}
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
