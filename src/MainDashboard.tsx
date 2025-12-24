import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './config/firebase.prod';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
    Plus, Settings, Coins, Loader, ShoppingBag, Bell, 
    Activity, Compass, Users, MessageCircle, Star, 
    Megaphone, ShieldAlert, LayoutDashboard, Ticket, Palette
} from 'lucide-react'; 
import NavBar from './components/NavBar';
import ProfileModal from './components/ProfileModal';

export default function MainDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        ensureMasterPin(currentUser.uid);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const ensureMasterPin = async (uid: string) => {
      try {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              const data = userSnap.data();
              if (!data.master_pin) {
                  const safeChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
                  let newPin = '';
                  for (let i = 0; i < 5; i++) newPin += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
                  await updateDoc(userRef, { master_pin: newPin });
              }
          }
      } catch (err) { console.error("Auto-Fix failed:", err); }
  };

  if (loading) return <div className="app-container"><Loader className="spin" size={40} color="#4da6a9"/></div>;

  const ActionCard = ({ icon: Icon, label, description, onClick, color }: any) => (
      <div className="result-card dash-card" onClick={onClick} style={{
          padding:'20px', cursor:'pointer', textAlign:'left', border:'none', margin:0,
          background: 'white', color: color || '#333',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display:'flex', flexDirection:'column', justifyContent:'center'
      }}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
             <Icon size={28} style={{color: color ? color : '#4da6a9'}} />
             <div>
                <div style={{fontSize:'1.1rem', fontWeight:'bold', marginBottom:'2px'}}>{label}</div>
                {description && <div style={{fontSize:'0.85rem', opacity:0.8}}>{description}</div>}
             </div>
          </div>
      </div>
  );

  const GridCard = ({ icon: Icon, label, description, onClick, color, bgColor }: any) => (
      <div className="result-card dash-card" onClick={onClick} style={{
          padding:'20px', cursor:'pointer', textAlign:'left', border:'none', margin:0,
          background: bgColor || 'white', color: color || '#333',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display:'flex', flexDirection:'column', height:'100%', justifyContent:'space-between', minHeight:'120px'
      }}>
          <Icon size={32} style={{marginBottom:'10px', color: color ? color : (bgColor ? 'white' : '#4da6a9')}} />
          <div>
            <div style={{fontSize:'1.1rem', fontWeight:'bold', marginBottom:'4px'}}>{label}</div>
            <div style={{fontSize:'0.85rem', opacity:0.8, lineHeight:'1.3'}}>{description}</div>
          </div>
      </div>
  );

  const displayName = userData?.display_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Friend';
  const photoURL = userData?.photo_url || user?.photoURL;
  const IS_SUPER_ADMIN_EMAIL = user?.email === 'rhys@tvmenuswvc.com' || user?.email === 'rhyshaney@gmail.com';

  return (
    <div className="app-container" style={{padding:0, background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'1000px', width:'100%', padding:'20px'}}>
        <div style={{marginBottom:'25px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{textAlign:'left'}}>
                <h1 style={{margin:0, color:'#333', fontSize:'1.8rem'}}>Hello, {displayName}</h1>
                <p style={{margin:'5px 0 0 0', color:'#666'}}>Here is what is happening today.</p>
            </div>
            <div onClick={() => setShowProfileModal(true)} style={{cursor:'pointer', border:'2px solid white', borderRadius:'50%', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                {photoURL ? (
                    <img src={photoURL} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', display:'block'}} />
                ) : (
                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', color:'#4f46e5', fontWeight:'bold', fontSize:'1.2rem'}}>{displayName.charAt(0)}</div>
                )}
            </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'25px'}}>
            <GridCard icon={Plus} label="Create New" description="Send a compliment." onClick={() => navigate('/create')} bgColor="#1e293b" color="white" />
            <GridCard icon={Bell} label="Notifications" description="View Alerts" onClick={() => navigate('/notifications')} color="#ef4444" />
            <GridCard icon={Activity} label="Activity" description="Views & Claims." onClick={() => navigate('/activity')} color="#0ea5e9" />
            <GridCard icon={Compass} label="Next Steps" description="Your Checklist." onClick={() => navigate('/onboarding')} color="#f59e0b" />
        </div>

        <h3 style={{textAlign:'left', color:'#999', marginBottom:'10px', textTransform:'uppercase', fontSize:'0.75rem', letterSpacing:'1px'}}>Quick Access</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'15px', marginBottom:'30px'}}>
            <ActionCard icon={Star} label="My Reviews" description="See what people say about you." onClick={() => navigate('/reviews')} color="#f59e0b" />
            <ActionCard icon={Users} label="Connections" description="Your network & friends." onClick={() => navigate('/connections')} />
            <ActionCard icon={MessageCircle} label="Chats" description="Your conversations." onClick={() => navigate('/chats')} />
            <ActionCard icon={Coins} label="My Balance" description={`${userData?.balance || 0} Coins available.`} onClick={() => navigate('/balance')} color="#0d9488" />
            <ActionCard icon={Ticket} label="Ad Inventory" description="Select coupons to give away." onClick={() => navigate('/ad-store')} color="#ec4899" />
            <ActionCard icon={ShoppingBag} label="Card Store" description="Buy cards & skins." onClick={() => navigate('/marketplace')} />
            <ActionCard icon={Megaphone} label={userData?.is_business ? "Business Portal" : "Advertise with Us"} description={userData?.is_business ? "Manage your campaigns." : "Promote your business here."} onClick={() => navigate(userData?.is_business ? '/business' : '/business-intro')} color="#7c3aed" />
            <ActionCard icon={Settings} label="Settings" description="App preferences." onClick={() => navigate('/settings')} />
        </div>

        {(userData?.is_business || userData?.is_super_admin || IS_SUPER_ADMIN_EMAIL) && (
            <>
                <h3 style={{textAlign:'left', color:'#999', marginBottom:'10px', textTransform:'uppercase', fontSize:'0.75rem', letterSpacing:'1px'}}>Admin Zone</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px'}}>
                    {userData?.is_business && <ActionCard icon={LayoutDashboard} label="Business Portal" description="Manage ads & stats." onClick={() => navigate('/business')} />}
                    {(userData?.is_super_admin || IS_SUPER_ADMIN_EMAIL) && (
                        <>
                            <ActionCard icon={ShieldAlert} label="Super Admin" description="Master control panel." onClick={() => navigate('/superadmin')} color="#ef4444" />
                            <ActionCard icon={Palette} label="Theme Studio" description="Design & Layout Cards." onClick={() => navigate('/admin/builder')} color="#8b5cf6" />
                        </>
                    )}
                </div>
            </>
        )}
      </main>
      {user && <ProfileModal userId={user.uid} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}
