import { User, MessageCircle, Loader } from 'lucide-react';

// EXACT MATCH with Connections.tsx
interface Connection {
  id: string; 
  other_uid: string;
  name: string;
  role: 'Friend' | 'Connection';
  date: any;
  photo_url?: string;
  status: string;
  origin_compliment_id?: string;
}

interface Props {
  connections: Connection[];
  loading: boolean;
  chatLoadingId: string | null;
  onStartChat: (conn: Connection) => void;
  onSelectUser: (uid: string) => void;
}

export default function ConnectionList({ connections, loading, chatLoadingId, onStartChat, onSelectUser }: Props) {

  if (loading) return <p style={{textAlign:'center', color:'#999'}}>Loading...</p>;

  if (connections.length === 0) {
      return (
          <div style={{padding:'30px', textAlign:'center', border:'1px dashed #ccc', borderRadius:'12px', background:'white'}}>
              <p style={{color:'#666'}}>No active connections.</p>
          </div>
      );
  }

  return (
    <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:'12px'}}>
        {connections.map((conn) => (
            <div key={conn.id} style={{background:'white', padding:'15px', borderRadius:'16px', border:'1px solid #eee', display:'flex', alignItems:'center', gap:'15px', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                
                {/* AVATAR */}
                <div 
                  onClick={() => onSelectUser(conn.other_uid)} 
                  style={{width:'50px', height:'50px', borderRadius:'50%', cursor:'pointer', overflow:'hidden', border:'2px solid #f0fdfa', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9'}}
                >
                    {conn.photo_url ? (
                        <img src={conn.photo_url} alt={conn.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                        <User size={24} color="#94a3b8"/>
                    )}
                </div>

                {/* NAME & STATUS */}
                <div style={{flex:1, overflow:'hidden'}}>
                    <div style={{fontWeight:'bold', color:'#333', fontSize:'1.05rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {conn.name}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'#10b981', display:'flex', alignItems:'center', gap:'4px'}}>
                        <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#10b981'}}></div>
                        Connected
                    </div>
                </div>

                {/* CHAT BUTTON */}
                <button 
                  onClick={() => onStartChat(conn)} 
                  disabled={chatLoadingId === conn.other_uid}
                  style={{background:'#e0f2fe', border:'none', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#0284c7'}}
                >
                    {chatLoadingId === conn.other_uid ? <Loader className="spin" size={20}/> : <MessageCircle size={20}/>}
                </button>
            </div>
        ))}
    </div>
  );
}
