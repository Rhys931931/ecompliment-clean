import { Trash2, Lock, Unlock, Shield, Bot, User, Eye, Sparkles } from 'lucide-react';

interface UserData {
  id: string;
  display_name: string;
  email: string;
  photo_url?: string;
  master_pin: string;
  balance: number;
  economy_unlocked?: boolean;
  account_type?: 'human' | 'bot' | 'admin';
}

interface Props {
  users: UserData[];
  loading: boolean;
  onGrantCoins: (id: string) => void;
  onToggleLock: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateType: (id: string, type: 'human' | 'bot' | 'admin') => void;
  onInspect: (id: string) => void;
  currentUserId?: string;
}

export default function UserTable({ users, loading, onGrantCoins, onToggleLock, onDelete, onUpdateType, onInspect, currentUserId }: Props) {
  
  if(loading) return <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>Loading User Directory...</div>;

  const getIcon = (type?: string) => {
      switch(type) {
          case 'admin': return <Shield size={14} color="white" fill="#ef4444"/>;
          case 'bot': return <Bot size={14} color="white" fill="#64748b"/>;
          default: return <User size={14} color="white" fill="#10b981"/>;
      }
  };

  const getTypeColor = (type?: string) => {
      switch(type) {
          case 'admin': return '#ef4444';
          case 'bot': return '#64748b';
          default: return '#10b981';
      }
  };

  return (
    <div style={{display:'grid', gap:'12px'}}>
        {users.map(u => (
            <div key={u.id} className="fade-in" style={{
                padding:'15px', background:'white', borderRadius:'16px', 
                border: u.id === currentUserId ? '2px solid #4da6a9' : '1px solid #e2e8f0', 
                display:'flex', flexDirection:'column', gap:'12px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}>
                
                {/* HEADER ROW */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        {/* AVATAR */}
                        <div onClick={() => onInspect(u.id)} style={{
                            width:'50px', height:'50px', borderRadius:'50%', cursor:'pointer',
                            border:`2px solid ${getTypeColor(u.account_type)}`, 
                            overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
                            background:'#f1f5f9', position:'relative'
                        }}>
                            {u.photo_url ? (
                                <img src={u.photo_url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                            ) : (
                                <span style={{fontWeight:'bold', color: getTypeColor(u.account_type), fontSize:'1.2rem'}}>
                                    {u.display_name?.[0]?.toUpperCase() || '?'}
                                </span>
                            )}
                            
                            {/* TYPE BADGE */}
                            <div style={{
                                position:'absolute', bottom:0, right:0, 
                                background: getTypeColor(u.account_type), 
                                borderRadius:'50%', width:'18px', height:'18px', 
                                display:'flex', alignItems:'center', justifyContent:'center',
                                border:'2px solid white'
                            }}>
                                {getIcon(u.account_type)}
                            </div>
                        </div>

                        {/* NAME & EMAIL */}
                        <div>
                            <div style={{fontWeight:'bold', fontSize:'1rem', color:'#333', display:'flex', alignItems:'center', gap:'6px'}}>
                                {u.display_name}
                                {u.id === currentUserId && <span style={{fontSize:'0.6rem', background:'#4da6a9', color:'white', padding:'1px 5px', borderRadius:'4px'}}>ME</span>}
                            </div>
                            <div style={{fontSize:'0.8rem', color:'#64748b'}}>{u.email || 'No Email'}</div>
                        </div>
                    </div>

                    {/* BALANCE & PIN */}
                    <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:'bold', color:'#059669', fontSize:'1.1rem'}}>{u.balance || 0} <span style={{fontSize:'0.7rem', color:'#999'}}>COINS</span></div>
                        <div style={{fontSize:'0.8rem', fontFamily:'monospace', color:'#94a3b8', background:'#f8fafc', padding:'2px 6px', borderRadius:'4px', display:'inline-block', marginTop:'4px'}}>
                            PIN: {u.master_pin || '---'}
                        </div>
                    </div>
                </div>

                {/* CONTROLS ROW */}
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', borderTop:'1px solid #f1f5f9', paddingTop:'12px'}}>
                    
                    <button onClick={() => onInspect(u.id)} style={{background:'#f0f9ff', color:'#0284c7', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.85rem', fontWeight:'bold', flex:1, justifyContent:'center'}}>
                        <Eye size={16}/> Inspect
                    </button>

                    <select 
                        value={u.account_type || 'human'} 
                        onChange={(e) => onUpdateType(u.id, e.target.value as any)}
                        style={{padding:'8px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'0.85rem', background:'#fff', cursor:'pointer'}}
                    >
                        <option value="human">👤 Human</option>
                        <option value="bot">🤖 Bot</option>
                        <option value="admin">🛡️ Admin</option>
                    </select>

                    <button onClick={() => onGrantCoins(u.id)} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'8px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <Sparkles size={18}/>
                    </button>
                    
                    <button onClick={() => onToggleLock(u.id, u.economy_unlocked || false)} style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', background: u.economy_unlocked ? '#fff7ed' : '#fee2e2', color: u.economy_unlocked ? '#c2410c' : '#b91c1c'}}>
                        {u.economy_unlocked ? <Unlock size={18}/> : <Lock size={18}/>}
                    </button>

                    <button onClick={() => onDelete(u.id)} style={{background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:'8px', cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
        ))}
    </div>
  );
}
