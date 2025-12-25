import { Unlock, Coins, CheckCircle, Gift, MessageCircle } from 'lucide-react';

interface Props {
  compliment: any;
  onClaim: () => void;
  onReply: () => void;
  btnStyle: React.CSSProperties;
}

export default function CardDisplay({ compliment, onClaim, onReply, btnStyle }: Props) {
  return (
    <div className="glass-card slide-up">
        <div style={{width:'80px', height:'80px', background:'#dcfce7', borderRadius:'50%', margin:'0 auto 20px auto', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Unlock size={30} color="#166534"/>
        </div>
        
        {compliment.tip_amount > 0 && (
            <div style={{background:'#dcfce7', color:'#166534', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', fontSize:'0.9rem', display:'inline-flex', alignItems:'center', gap:'5px', marginBottom:'15px'}}>
                <Coins size={16}/> {compliment.tip_amount} Coins
            </div>
        )}
        
        <h2 style={{margin:'0 0 20px 0', fontSize:'1.5rem'}}>"{compliment.message}"</h2>
        
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {/* OPTION 1: CHAT (Guest Friendly) */}
            <button onClick={onReply} className="claim-btn" style={{width:'100%', justifyContent:'center', background:'white', color:'#333', border:'1px solid #ddd'}}>
                <MessageCircle size={20}/> Say Thanks
            </button>

            {/* OPTION 2: MONEY (Login Required) */}
            {compliment.status === 'pending_approval' ? (
                <div style={{padding:'15px', background:'#f0fdfa', borderRadius:'12px', color:'#115e59', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', justifyContent:'center'}}>
                    <CheckCircle size={20}/> Request Sent
                </div>
            ) : (
                <button onClick={onClaim} className="claim-btn" style={{width:'100%', justifyContent:'center', ...btnStyle}}>
                    <Gift size={20}/> Claim Gift
                </button>
            )}
        </div>
    </div>
  );
}
