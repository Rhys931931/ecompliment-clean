import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase'; // FIXED PATH
import { doc, runTransaction, getDoc } from 'firebase/firestore';
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
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const masterPin = generateMasterPin();
        const blindKey = generateBlindKey();
        const userSecretsRef = doc(db, 'user_secrets', user.uid);
        const walletRef = doc(db, 'wallets', user.uid);

        await runTransaction(db, async (transaction) => {
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

          const walletSnap = await transaction.get(walletRef);
          if (!walletSnap.exists()) {
            transaction.set(walletRef, {
              balance: 0,
              currency: 'coins',
              uid: user.uid
            });
          }
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login Failed:", err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to eCompliment
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the economy of kindness.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
