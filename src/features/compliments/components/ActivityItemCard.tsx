import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Props {
  item: any;
  type: 'sent' | 'received';
  onClick: () => void;
}

export default function ActivityItemCard({ item, type, onClick }: Props) {
  const isSent = type === 'sent';
  const statusColor = item.claimed ? '#10b981' : (item.active ? '#3b82f6' : '#9ca3af');
  const statusText = item.claimed ? 'Claimed' : (item.active ? 'Active' : 'Pending');

  return (
    <div 
        onClick={onClick}
        className="fade-in"
        style={{
            background:'white', padding:'15px', borderRadius:'16px', 
            border:'1px solid #e2e8f0', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'15px',
            boxShadow:'0 2px 5px rgba(0,0,0,0.02)',
            marginBottom:'12px', position:'relative', overflow:'hidden'
        }}
    >
        {/* LEFT STRIP: STATUS INDICATOR */}
        <div style={{position:'absolute', left:0, top:0, bottom:0, width:'5px', background: statusColor}}></div>

        {/* ICON BOX */}
        <div style={{
            width:'45px', height:'45px', borderRadius:'12px', 
            background: isSent ? '#f0f9ff' : '#f0fdf4', 
            color: isSent ? '#0284c7' : '#166534',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
        }}>
            {isSent ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
        </div>

        {/* MAIN INFO */}
        <div style={{flex:1, overflow:'hidden'}}>
            <div style={{fontWeight:'bold', color:'#333', fontSize:'1rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {isSent ? `To: ${item.recipient_name || 'Friend'}` : `From: ${item.sender || 'Anonymous'}`}
            </div>
            <div style={{fontSize:'0.8rem', color:'#64748b', display:'flex', alignItems:'center', gap:'5px'}}>
                <Clock size={12}/> {item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Just now'}
                {item.tip_amount > 0 && <span style={{background:'#fffbeb', color:'#b45309', padding:'1px 5px', borderRadius:'4px', border:'1px solid #fcd34d', fontSize:'0.7rem'}}>+{item.tip_amount} 🪙</span>}
            </div>
        </div>

        {/* STATUS PILL */}
        <div style={{textAlign:'right'}}>
            <span style={{
                fontSize:'0.7rem', fontWeight:'bold', textTransform:'uppercase',
                color: statusColor, background: `${statusColor}20`,
                padding:'4px 8px', borderRadius:'6px'
            }}>
                {statusText}
            </span>
        </div>
    </div>
  );
}
