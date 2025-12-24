import { MessageCircle, Star, ArrowRight, CheckCircle, UserPlus, X, Check, Coins, Loader } from 'lucide-react';import { useNavigate } from 'react-router-dom';

interface Props {
    item: any;
    processingId: string | null;
    onApprove: (item: any) => void;
    onDeny: (item: any) => void;
}

export default function NotificationItem({ item, processingId, onApprove, onDeny }: Props) {
    const navigate = useNavigate();

    // Helper to get the right icon
    const getIcon = (type: string) => {
        switch(type) {
            case 'request': return <UserPlus size={20} color="white"/>;
            case 'message': return <MessageCircle size={20} color="white"/>;
            case 'reward': return <Star size={20} color="white"/>;
            default: return <CheckCircle size={20} color="white"/>;
        }
    };

    return (
        <div 
            onClick={() => !item.isActionItem && navigate(item.link)} 
            style={{
                background: item.isActionItem ? '#fffbeb' : 'white',
                padding:'18px', borderRadius:'12px', 
                border: item.isActionItem ? '2px solid #fcd34d' : '1px solid #eee',
                cursor: item.isActionItem ? 'default' : 'pointer', 
                display:'flex', flexDirection: 'column', gap:'15px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}
        >
            <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
                <div style={{
                    width:'48px', height:'48px', borderRadius:'12px', 
                    background: item.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0
                }}>
                    {getIcon(item.iconType)}
                </div>

                <div style={{flex:1}}>
                    <div style={{fontWeight:'bold', color:'#333'}}>{item.title}</div>
                    <div style={{color:'#666', fontSize:'0.9rem'}}>{item.preview}</div>
                    
                    {/* TIP BADGE */}
                    {item.isActionItem && item.data?.tip_amount > 0 && (
                        <div style={{marginTop:'5px', display:'inline-flex', alignItems:'center', gap:'4px', background:'#d1fae5', color:'#065f46', padding:'2px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold'}}>
                            <Coins size={12}/> Includes {item.data.tip_amount} Coin Gift
                        </div>
                    )}

                    <div style={{fontSize:'0.75rem', color:'#999', marginTop:'5px'}}>
                        {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </div>
                </div>

                {!item.isActionItem && <ArrowRight size={18} color="#ccc" />}
            </div>

            {/* ACTION BUTTONS */}
            {item.isActionItem && (
                <div style={{display:'flex', gap:'10px', width:'100%', borderTop:'1px solid #fcd34d', paddingTop:'15px'}}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(item); }}
                        disabled={processingId === item.id}
                        style={{
                            flex:1, padding:'12px', borderRadius:'8px', border:'none', 
                            background:'#059669', color:'white', fontWeight:'bold', fontSize:'0.95rem',
                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'
                        }}
                    >
                        {processingId === item.id ? <Loader className="spin" size={16}/> : <Check size={16}/>} Approve
                    </button>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeny(item); }}
                        disabled={processingId === item.id}
                        style={{
                            flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ef4444', 
                            background:'white', color:'#ef4444', fontWeight:'bold', fontSize:'0.95rem',
                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'
                        }}
                    >
                        <X size={16}/> Deny
                    </button>
                </div>
            )}
        </div>
    );
}