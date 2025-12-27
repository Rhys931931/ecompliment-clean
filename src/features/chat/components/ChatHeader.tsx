import { ArrowLeft, Bell, BellOff, Gift, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  isGuest?: boolean;
  canClaim?: boolean;
  onClaim?: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotify: () => void;
  notifyLoading: boolean;
}

export default function ChatHeader({ 
  title, isGuest, canClaim, onClaim, 
  notificationPermission, onRequestNotify, notifyLoading 
}: Props) {
  const navigate = useNavigate();
  
  return (
    <div style={{
        background:'#fff', padding:'10px 15px', borderBottom:'1px solid #eee',
        display:'flex', alignItems:'center', gap:'15px', position:'sticky', top:0, zIndex:10,
        paddingTop: 'max(10px, env(safe-area-inset-top))'
    }}>
        <button onClick={() => navigate('/chats')} style={{background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'#333'}}>
            <ArrowLeft size={24} />
        </button>
        
        <div style={{flex:1, overflow:'hidden'}}>
            <div style={{fontWeight:'bold', fontSize:'1rem', color:'#333', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {title}
            </div>
            {isGuest && <div style={{fontSize:'0.75rem', color:'#4da6a9', fontWeight:'bold'}}>Guest Mode</div>}
        </div>

        <div style={{display:'flex', gap:'10px'}}>
            {/* NOTIFICATION TOGGLE */}
            <button 
                onClick={onRequestNotify}
                disabled={notificationPermission === 'granted'}
                style={{
                    background: notificationPermission === 'granted' ? '#f0fdfa' : '#fef2f2',
                    color: notificationPermission === 'granted' ? '#0f766e' : '#ef4444',
                    border: 'none', borderRadius:'50%', width:'36px', height:'36px',
                    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
                }}
            >
                {notifyLoading ? <Loader className="spin" size={16}/> : 
                 notificationPermission === 'granted' ? <Bell size={18}/> : <BellOff size={18}/>}
            </button>

            {/* CLAIM BUTTON (If applicable) */}
            {canClaim && onClaim && (
                <button 
                    onClick={onClaim}
                    style={{
                        background:'#1e293b', color:'white', border:'none', borderRadius:'20px',
                        padding:'6px 12px', fontSize:'0.8rem', fontWeight:'bold',
                        display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'
                    }}
                >
                    <Gift size={14}/> Claim
                </button>
            )}
        </div>
    </div>
  );
}
