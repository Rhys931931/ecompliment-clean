import { useState } from 'react';
import { Menu, X, LogOut, User, LayoutDashboard, Plus, Wallet, Settings, ShoppingBag, MessageCircle, Users, Ticket, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.prod';

// Accept a 'style' prop for dynamic coloring
export default function NavBar({ user, style }: { user: any, style?: React.CSSProperties }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const close = () => setIsMenuOpen(false);
  
  // Use the passed text color, or default to dark slate
  const iconColor = style?.color || '#1e293b';
  // Use the passed background color for brand icon, or default teal
  const brandColor = style?.background ? style.color : '#4da6a9';

  return (
    <>
      <nav className="navbar" style={style}>
        <div className="nav-content">
          <Link to="/" style={{textDecoration:'none', color: iconColor, fontWeight:'900', fontSize:'1.4rem', display:'flex', alignItems:'center', gap:'8px'}}>
              <Sparkles size={24} color={brandColor} fill={brandColor}/>
              eCompliment
          </Link>
          {/* Menu button adopts the text color of the banner */}
          <button onClick={() => setIsMenuOpen(true)} className="menu-btn" style={{color: iconColor}}>
            <Menu size={26} strokeWidth={2.5} />
          </button>
        </div>
      </nav>
      
      {/* Drawer remains white for cleanliness */}
      <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={close}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          
          <div style={{padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9'}}>
            <span style={{fontWeight:'bold', color:'#94a3b8'}}>MENU</span>
            <button onClick={close} style={{background:'none', border:'none', padding:'5px', color:'#333'}}><X size={24}/></button>
          </div>

          <div style={{padding:'10px 0', overflowY:'auto', flex:1}}>
            {user ? (
              <>
                <div style={{padding:'0 20px 20px 20px', display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#f1f5f9', overflow:'hidden'}}>
                         {user.photoURL ? <img src={user.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#4da6a9'}}>{user.displayName?.[0]}</div>}
                    </div>
                    <div>
                        <div style={{fontWeight:'bold'}}>{user.displayName}</div>
                        <div style={{fontSize:'0.8rem', color:'#64748b'}}>Online</div>
                    </div>
                </div>

                <div style={{height:'1px', background:'#f1f5f9', margin:'10px 20px'}}></div>

                <Link to="/dashboard" className="drawer-link" onClick={close}><LayoutDashboard size={20} /> Dashboard</Link>
                <Link to="/profile" className="drawer-link" onClick={close}><User size={20} /> My Profile</Link>
                <Link to="/settings" className="drawer-link" onClick={close}><Settings size={20} /> Settings</Link>
                
                <div style={{padding:'20px 20px 5px 20px', fontSize:'0.75rem', fontWeight:'bold', color:'#94a3b8'}}>ACTIONS</div>
                <Link to="/create" className="drawer-link" onClick={close}><Plus size={20} /> Create Compliment</Link>
                <Link to="/marketplace" className="drawer-link" onClick={close}><ShoppingBag size={20} /> Store</Link>
                <Link to="/ad-store" className="drawer-link" onClick={close}><Ticket size={20} /> My Coupons</Link>

                <div style={{padding:'20px 20px 5px 20px', fontSize:'0.75rem', fontWeight:'bold', color:'#94a3b8'}}>SOCIAL</div>
                <Link to="/connections" className="drawer-link" onClick={close}><Users size={20} /> Connections</Link>
                <Link to="/chats" className="drawer-link" onClick={close}><MessageCircle size={20} /> Chats</Link>
                <Link to="/wallet" className="drawer-link" onClick={close}><Wallet size={20} /> Wallet</Link>

                <div style={{marginTop:'20px', padding:'20px'}}>
                    <button onClick={handleLogout} style={{width:'100%', padding:'12px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'10px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                        <LogOut size={18}/> Log Out
                    </button>
                </div>
              </>
            ) : (
              <div style={{padding:'20px'}}>
                <p style={{color:'#64748b', marginBottom:'20px'}}>Sign in to start earning coins.</p>
                <Link to="/login" className="claim-btn accent" onClick={close} style={{textDecoration:'none', justifyContent:'center'}}>Log In / Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
