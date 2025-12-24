import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
}

export default function ChatHeader({ title }: Props) {
  const navigate = useNavigate();
  
  return (
    <div style={{
        background:'#4da6a9', padding:'15px', 
        display:'flex', alignItems:'center', gap:'15px', position:'sticky', top:0, zIndex:10,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
        <button onClick={() => navigate('/chats')} style={{background:'none', border:'none', cursor:'pointer', padding:0, display:'flex'}}>
            <ArrowLeft size={24} color="white" />
        </button>
        <div style={{flex:1}}>
            <div style={{fontWeight:'bold', fontSize:'1.1rem', color:'white'}}>
                {title}
            </div>
        </div>
    </div>
  );
}
