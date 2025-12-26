import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase.prod';
import { doc, runTransaction } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateMasterPin = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateBlindKey = () => {
    return 'u_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSecretsRef = doc(db, 'user_secrets', user.uid);
      const walletRef = doc(db, 'wallets', user.uid);

      await runTransaction(db, async (transaction) => {
        // 1. READS FIRST (The Fix)
        const userSnap = await transaction.get(userRef);
        const walletSnap = await transaction.get(walletRef);

        if (!userSnap.exists()) {
            const masterPin = generateMasterPin();
            const blindKey = generateBlindKey();

            // 2. WRITES SECOND
            transaction.set(userRef, {
              uid: user.uid,
              email: user.email,
              display_name: user.displayName || 'Kind Stranger',
              photo_url: user.photoURL || null,
              blind_key: blindKey,
              account_type: 'human',
              balance: 0,
              created_at: new Date().toISOString()
            });

            transaction.set(userSecretsRef, {
              uid: user.uid,
              master_pin: masterPin,
              email: user.email,
              updated_at: new Date().toISOString()
            });
        }

        if (!walletSnap.exists()) {
            transaction.set(walletRef, {
              balance: 0,
              currency: 'coins',
              uid: user.uid
            });
        }
      });

      // Check for pending claim redirection
      const pendingId = localStorage.getItem('pending_claim_id');
      if (pendingId) {
          localStorage.removeItem('pending_claim_id');
          navigate('/dashboard'); 
      } else {
          navigate('/dashboard');
      }

    } catch (err: any) {
      console.error("Login Failed:", err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'20px'}}>
      <div className="result-card" style={{maxWidth:'400px', width:'100%', textAlign:'center'}}>
        <h2 style={{margin:'0 0 10px 0'}}>Sign in to eCompliment</h2>
        <p style={{color:'#666', marginBottom:'30px'}}>Join the economy of kindness.</p>
        
        {error && <div style={{color:'red', background:'#fee2e2', padding:'10px', borderRadius:'8px', marginBottom:'20px'}}>{error}</div>}
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="claim-btn"
          style={{width:'100%', justifyContent:'center', background:'#4285F4', color:'white'}}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;
