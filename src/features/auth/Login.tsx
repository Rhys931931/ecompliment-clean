import { useState } from 'react';
import { 
  signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader, Sparkles, HelpCircle } from 'lucide-react';
import NavBar from '../../components/NavBar';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const navigate = useNavigate();

  // THE SYNCED INIT FUNCTION
  const handleInit = async (user: any, name: string) => {
      const userRef = doc(db, 'users', user.uid);
      const secretRef = doc(db, 'user_secrets', user.uid);
      
      const userSnap = await getDoc(userRef);
      const secretSnap = await getDoc(secretRef);
      
      const batch = writeBatch(db);
      let needsCommit = false;

      // 1. Update Public User Hub (The Admin List View)
      if (!userSnap.exists()) {
          const blind = 'u_' + Date.now();
          batch.set(userRef, { 
              display_name: name, 
              email: user.email, // <--- LIST VIEW NEEDS THIS
              photo_url: user.photoURL, 
              blind_key: blind, 
              balance: 0,
              account_type: 'human'
          });
          batch.set(doc(db, 'wallets', user.uid), { balance: 0, currency: 'coins' });
          batch.set(doc(db, 'public_profiles', blind), { display_name: name, bio: 'New user', photo_url: user.photoURL });
          needsCommit = true;
      } else {
          // Self-Heal: If email is missing in Hub, add it now
          if (!userSnap.data().email && user.email) {
              batch.update(userRef, { email: user.email });
              needsCommit = true;
          }
      }

      // 2. Update Iron Vault (The Secure Record)
      if (!secretSnap.exists()) {
          const pin = Math.random().toString(36).slice(-5).toUpperCase();
          const existingPin = userSnap.exists() ? userSnap.data().master_pin : null;
          
          batch.set(secretRef, {
              email: user.email,
              real_name: name,
              master_pin: existingPin || pin,
              uid: user.uid,
              createdAt: new Date()
          });
          
          if (!existingPin) batch.update(userRef, { master_pin: pin });
          needsCommit = true;
      }

      if (needsCommit) await batch.commit();
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true); setError('');
      try {
          if (isSignUp) {
              if(!form.name) throw new Error("Name required");
              const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
              await updateProfile(cred.user, { displayName: form.name });
              await handleInit(cred.user, form.name);
          } else {
              const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
              await handleInit(cred.user, cred.user.displayName || 'User');
          }
          navigate('/dashboard');
      } catch (e: any) { setError(e.message); }
      setLoading(false);
  };

  const handleGoogle = async () => {
      try {
          const res = await signInWithPopup(auth, new GoogleAuthProvider());
          await handleInit(res.user, res.user.displayName || 'User');
          navigate('/dashboard');
      } catch (e) { setError("Google Sign-In Failed"); }
  };

  const handlePasswordReset = async () => {
      if (!form.email) {
          setError("Please enter your email address first.");
          return;
      }
      try {
          await sendPasswordResetEmail(auth, form.email);
          setResetSent(true);
          setError(""); 
      } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="app-container" style={{justifyContent:'center', alignItems:'center', background:'#f0fdfa'}}>
      <NavBar user={null} />
      <div className="glass-card fade-in" style={{width:'90%', maxWidth:'400px', marginTop:'60px', background:'white'}}>
          <div style={{textAlign:'center', marginBottom:'30px'}}>
              <div style={{width:'60px', height:'60px', background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px auto', color:'#0284c7'}}>
                  <Sparkles size={30} />
              </div>
              <h1 style={{margin:0, fontSize:'1.8rem'}}>{isSignUp ? 'Join the Movement' : 'Welcome Back'}</h1>
              <p style={{color:'#666', margin:'10px 0 0 0'}}>The economy of kindness awaits.</p>
          </div>

          {error && <div style={{background:'#fee2e2', color:'#b91c1c', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.9rem', textAlign:'center'}}>{error}</div>}
          {resetSent && <div style={{background:'#dcfce7', color:'#166534', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.9rem', textAlign:'center'}}>Password reset email sent!</div>}

          <form onSubmit={handleAuth}>
              {isSignUp && (
                  <div>
                      <label className="input-label">Display Name</label>
                      <div style={{position:'relative'}}>
                          <User size={20} style={{position:'absolute', top:'14px', left:'15px', color:'#94a3b8'}}/>
                          <input className="text-input" style={{paddingLeft:'45px'}} placeholder="Kindness King" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
                      </div>
                  </div>
              )}
              <label className="input-label">Email Address</label>
              <div style={{position:'relative'}}>
                  <Mail size={20} style={{position:'absolute', top:'14px', left:'15px', color:'#94a3b8'}}/>
                  <input className="text-input" style={{paddingLeft:'45px'}} type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
              </div>
              <label className="input-label">Password</label>
              <div style={{position:'relative', marginBottom:'20px'}}>
                  <Lock size={20} style={{position:'absolute', top:'14px', left:'15px', color:'#94a3b8'}}/>
                  <input className="text-input" style={{paddingLeft:'45px', marginBottom:0}} type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required/>
              </div>
              <button type="submit" className="claim-btn accent" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
                  {loading ? <Loader className="spin"/> : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={20}/></>}
              </button>
          </form>

          {!isSignUp && (
              <div style={{textAlign:'center', marginTop:'15px'}}>
                  <button type="button" onClick={handlePasswordReset} style={{background:'none', border:'none', color:'#64748b', fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', margin:'0 auto'}}>
                      <HelpCircle size={14}/> Forgot Password?
                  </button>
              </div>
          )}

          <div style={{display:'flex', alignItems:'center', gap:'10px', margin:'25px 0'}}>
              <div style={{height:'1px', background:'#e2e8f0', flex:1}}></div>
              <span style={{fontSize:'0.8rem', color:'#94a3b8', fontWeight:'bold'}}>OR</span>
              <div style={{height:'1px', background:'#e2e8f0', flex:1}}></div>
          </div>
          <button onClick={handleGoogle} className="claim-btn" style={{width:'100%', justifyContent:'center', background:'white', border:'1px solid #e2e8f0'}}>Continue with Google</button>
          <p style={{textAlign:'center', marginTop:'30px', color:'#666', fontSize:'0.9rem'}}>
              {isSignUp ? "Already have an account?" : "New to eCompliment?"} 
              <span onClick={() => setIsSignUp(!isSignUp)} style={{color:'#4da6a9', fontWeight:'bold', cursor:'pointer', marginLeft:'5px'}}>{isSignUp ? "Log In" : "Sign Up"}</span>
          </p>
      </div>
    </div>
  );
}
