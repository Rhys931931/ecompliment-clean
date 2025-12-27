import { User, ArrowRight } from 'lucide-react';

interface Props {
  candidates: any[];
  onSelect: (item: any) => void;
  onCancel: () => void;
}

export default function SelectionScreen({ candidates, onSelect, onCancel }: Props) {
  return (
    <div className="glass-card slide-up">
        <h2 style={{margin:'0 0 10px 0', fontSize:'1.5rem'}}>Found Multiple Cards</h2>
        <p style={{color:'#64748b', margin:'0 0 20px 0'}}>
            There are {candidates.length} compliments with this code. <br/>
            Which one is yours?
        </p>
        
        <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto'}}>
            {candidates.map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => onSelect(item)}
                    style={{
                        background:'white', padding:'15px', borderRadius:'12px', border:'1px solid #e2e8f0',
                        display:'flex', alignItems:'center', gap:'15px', cursor:'pointer', textAlign:'left',
                        transition: 'transform 0.1s'
                    }}
                >
                    {/* AVATAR OR SENDER INITIAL */}
                    <div style={{
                        width:'40px', height:'40px', borderRadius:'50%', background:'#f1f5f9', 
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        overflow:'hidden', border:'2px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        {item.sender_photo ? (
                            <img src={item.sender_photo} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        ) : (
                            <User size={20} color="#94a3b8"/>
                        )}
                    </div>

                    <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{fontWeight:'bold', color:'#333', fontSize:'0.95rem'}}>
                            From: {item.sender || 'Anonymous'}
                        </div>
                        <div style={{fontSize:'0.8rem', color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                            "{item.message}"
                        </div>
                    </div>
                    <ArrowRight size={18} color="#cbd5e1"/>
                </button>
            ))}
        </div>

        <button onClick={onCancel} style={{marginTop:'20px', background:'none', border:'none', color:'#64748b', cursor:'pointer', textDecoration:'underline'}}>
            Cancel Search
        </button>
    </div>
  );
}
