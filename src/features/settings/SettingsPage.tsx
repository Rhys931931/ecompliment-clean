import { useState, useEffect } from 'react';
import { Save, Lock, Loader, Bell, Check } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getToken } from 'firebase/messaging'; 
import { db, auth, messaging } from '../../config/firebase.prod'; 
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [defaultMessage, setDefaultMessage] = useState('');
  const [masterPin, setMasterPin] = useState('.....');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); 

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadSettings(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadSettings = async (uid: string) => {
      try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.default_message) setDefaultMessage(data.default_message);
              if (data.master_pin) setMasterPin(data.master_pin);
              if (data.fcm_token) setNotificationsEnabled(true); 
          }
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleEnableNotifications = async () => {
      if (!user) return;
      try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              const token = await getToken(messaging, {
                  vapidKey: "BEOUobS5y0B3qvsBj3NkM6KsiTWpSdVVbzQHq5jtMyGQViYO60I7iScV_oWQMREqW5Wby8SogaQMmWi5xatL8aM"
              });
              if (token) {
                  await updateDoc(doc(db, "users", user.uid), { fcm_token: token });
                  setNotificationsEnabled(true);
                  alert("Notifications Enabled! You will now receive alerts.");
              }
          } else {
              alert("Permission denied. Please enable notifications in your browser settings.");
          }
      } catch (e) {
          console.error("Notification error:", e);
          alert("Could not enable notifications. (Are you on localhost? Some browsers block notifications without HTTPS).");
      }
  };

  const handleSave = async () => {
      if (!user) return;
      try {
          await updateDoc(doc(db, "users", user.uid), {
              default_message: defaultMessage
          });
          alert("Settings Saved!");
      } catch (e) { console.error(e); }
  };

  if (loading) return <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}><Loader className="spin" size={40} color="#4da6a9"/></div>;

  return (
    <div className="app-container" style={{padding:0}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'600px'}}>
          <div style={{marginBottom:'20px'}}>
              <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0}}>
                  Settings
              </h1>
              <p style={{color:'#666'}}>Control how the app behaves for you.</p>
          </div>

          <div className="result-card" style={{textAlign:'left'}}>

              {/* NOTIFICATIONS CARD */}
              <div style={{marginBottom:'25px', padding:'15px', background: notificationsEnabled ? '#f0fdfa' : '#fffbeb', borderRadius:'8px', border: notificationsEnabled ? '1px solid #ccfbf1' : '1px solid #fcd34d', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                      <h3 style={{margin:'0 0 5px 0', display:'flex', gap:'8px', alignItems:'center', color: notificationsEnabled ? '#0f766e' : '#92400e'}}>
                          <Bell size={18}/> Push Notifications
                      </h3>
                      <p style={{margin:0, fontSize:'0.85rem', color:'#666'}}>
                          {notificationsEnabled ? "Active. You will get alerts." : "Enable to get alerts for new messages."}
                      </p>
                  </div>
                  {!notificationsEnabled ? (
                      <button onClick={handleEnableNotifications} style={{padding:'8px 12px', background:'#b45309', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>
                          Enable
                      </button>
                  ) : (
                      <div style={{padding:'8px', background:'white', borderRadius:'50%', color:'#10b981'}}><Check size={20}/></div>
                  )}
              </div>
              
              {/* MASTER PIN (READ ONLY) */}
              <div style={{marginBottom:'25px', padding:'15px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                  <label className="input-label" style={{color:'#475569', display:'flex', alignItems:'center', gap:'5px'}}>
                      <Lock size={16}/> Your Master PIN
                  </label>
                  <div style={{fontSize:'0.85rem', color:'#666', marginBottom:'10px'}}>
                      This 5-digit code is your permanent ID for physical cards and coupons. It cannot be changed.
                  </div>
                  <div style={{
                      background:'white', padding:'10px', borderRadius:'6px', border:'1px solid #ddd',
                      fontSize:'1.5rem', fontWeight:'bold', letterSpacing:'3px', textAlign:'center', color:'#333', fontFamily:'monospace'
                  }}>
                      {masterPin || "Loading..."}
                  </div>
              </div>

              <div style={{marginBottom:'20px'}}>
                  <label className="input-label">Default Compliment Message</label>
                  <div style={{fontSize:'0.85rem', color:'#666', marginBottom:'5px'}}>Pre-fill the message box with this text.</div>
                  <textarea 
                      className="text-input" 
                      value={defaultMessage} 
                      onChange={e => setDefaultMessage(e.target.value)} 
                      placeholder="e.g. You have great energy!"
                      style={{height:'80px'}}
                  />
              </div>

              <button onClick={handleSave} className="claim-btn" style={{width:'100%', justifyContent:'center'}}>
                  <Save size={18}/> Save Settings
              </button>
          </div>
      </main>
    </div>
  );
}
