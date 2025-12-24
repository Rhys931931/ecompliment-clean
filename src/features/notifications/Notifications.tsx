import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import { useNotifications } from './useNotifications';
import NotificationItem from './NotificationItem';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const { notifications, loading, processingId, fetchNotifications, handleApprove, handleDeny } = useNotifications();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchNotifications(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchNotifications]);

  if (loading) return <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}><Loader className="spin" size={40} color="#4da6a9"/></div>;

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'800px', width:'100%', padding:'20px'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666'}}>
                <ArrowLeft size={18} /> Back
            </button>
            <h1 style={{margin:0, fontSize:'1.5rem', color:'#333', display:'flex', alignItems:'center', gap:'10px'}}>
                Notifications <Bell size={24} fill="#333" />
            </h1>
        </div>

        <div className="fade-in">
            {notifications.length === 0 ? (
                <div style={{textAlign:'center', padding:'60px 20px', color:'#999', background:'white', borderRadius:'16px', border:'1px solid #eee'}}>
                    <Bell size={48} style={{marginBottom:'15px', opacity:0.2}} />
                    <h3>All caught up!</h3>
                </div>
            ) : (
                <div style={{display:'grid', gap:'12px'}}>
                    {notifications.map((item) => (
                        <NotificationItem 
                            key={item.id} 
                            item={item} 
                            processingId={processingId}
                            onApprove={(i: any) => handleApprove(i.id)} 
                            onDeny={(i: any) => handleDeny(i.id)}   
                        />
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
