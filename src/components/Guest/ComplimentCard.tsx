import { User, Coins, MessageCircle, FolderHeart, Lock, Gift } from 'lucide-react';
import type { ComplimentData, AdData } from '../../types';

interface ComplimentCardProps {
  compliment: ComplimentData;
  ads: AdData[];
  magicMode: boolean;
  isClaiming: boolean;
  setIsClaiming: (val: boolean) => void;
  handleUnlock: (bypass?: boolean) => void;
  pinInput: string;
  setPinInput: (val: string) => void;
  // UPDATED: Now accepts blindKey
  onShowProfile: (blindKey: string) => void;
  // Legacy support
  setShowProfile?: (val: boolean) => void;
}

export default function ComplimentCard({ 
  compliment, ads, magicMode, isClaiming, setIsClaiming, 
  handleUnlock, pinInput, setPinInput, onShowProfile, setShowProfile
}: ComplimentCardProps) {
  
  const profileKey = compliment.owner_index || compliment.sender_uid;

  const handleProfileClick = () => {
      if (profileKey) {
          if (onShowProfile) {
              onShowProfile(profileKey);
          } else if (setShowProfile) {
              // Fallback for parent components not yet updated
              setShowProfile(true);
          }
      }
  };

  return (
    <>
      <div className="result-card slide-up" style={{textAlign:'center'}}>
          <h1 style={{fontSize:'1.8rem', color:'#333', margin:'0 0 5px 0'}}>To: {compliment.to || "You"}</h1>
          <div style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>From: {compliment.sender}</div>

          <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem', cursor: profileKey ? 'pointer' : 'default'}} onClick={handleProfileClick}>
              {compliment.sender_photo ? (<img src={compliment.sender_photo} alt="Profile" style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}/>) : (<div style={{width:'80px', height:'80px', background:'#e0e7ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px'}}><User size={40} color="#4f46e5"/></div>)}
              {profileKey && <div style={{fontSize:'0.8rem', color:'#4da6a9', fontWeight:'bold'}}>Tap to view profile</div>}
          </div>
          
          <h2 className="compliment-text" style={{fontSize:'1.4rem', fontStyle:'italic', margin:'0 0 25px 0', textAlign: 'justify', textAlignLast: 'center'}}>
              "{compliment.message}"
          </h2>
          
          {compliment.tip_amount ? (<div style={{background:'#f0fdfa', color:'#0f766e', padding:'10px', borderRadius:'8px', textAlign:'center', marginBottom:'20px', fontWeight:'bold', border:'1px solid #ccfbf1'}}><Coins size={16} style={{display:'inline', marginBottom:'-2px', marginRight:'5px'}}/> Includes a {compliment.tip_amount} Coin Tip!</div>) : null}
          
          <div className="action-buttons" style={{flexDirection:'column', gap:'15px'}}> 
             {magicMode ? (
                 <>
                     <button className="claim-btn" onClick={() => handleUnlock(true)} style={{width:'100%', justifyContent:'center', background:'#1e293b', color:'white'}}>
                         <MessageCircle size={18} /> Reply to {compliment.sender}
                     </button>
                     <button className="claim-btn" onClick={() => handleUnlock(true)} style={{width:'100%', justifyContent:'center', background:'#4da6a9', color:'white'}}>
                         <FolderHeart size={18} /> Claim & Save
                     </button>
                 </>
             ) : (
                 !isClaiming ? (
                      <>
                          <button className="claim-btn" onClick={() => setIsClaiming(true)} style={{width:'100%', justifyContent:'center', background:'#1e293b', color:'white'}}>
                              <MessageCircle size={18} /> Reply to {compliment.sender}
                          </button>
                          <button className="claim-btn" onClick={() => setIsClaiming(true)} style={{width:'100%', justifyContent:'center', background:'#4da6a9', color:'white'}}>
                              <FolderHeart size={18} /> Claim & Save
                          </button>
                      </>
                 ) : (
                     <form onSubmit={(e) => { e.preventDefault(); handleUnlock(false); }} className="pin-form slide-up">
                         <label style={{fontSize: '0.9rem', color: '#555'}}>Enter 5-digit PIN from card:</label>
                         <div style={{display: 'flex', gap: '8px', marginTop: '5px'}}>
                             <input type="text" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" maxLength={5} className="pin-input" autoFocus style={{textAlign:'center', letterSpacing:'2px'}}/>
                             <button type="submit" className="unlock-btn"><Lock size={16} /> Unlock</button>
                         </div>
                     </form>
                 )
             )}
          </div>
      </div>

      {ads.map(ad => (
          <div key={ad.id} className="ad-placeholder slide-up" style={{
              background: 'rgba(255,255,255,0.95)', 
              padding: '20px', 
              borderRadius: '16px', 
              marginBottom:'15px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              borderLeft: `5px solid ${ad.color || '#333'}`
          }}>
              <p style={{fontSize: '0.8rem', color: '#888', display:'flex', alignItems:'center', gap:'5px', margin:'0 0 10px 0', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'bold'}}>
                  <Gift size={14}/> Special Offer
              </p>
              <strong style={{fontSize: '1.2rem', display:'block', marginBottom:'5px'}}>{ad.name}</strong>
              <div style={{fontSize: '1rem', color: '#555', marginBottom: '10px'}}>{ad.offer}</div>
              <div style={{background: '#f3f4f6', display:'inline-block', padding:'6px 12px', borderRadius:'6px', border:'1px dashed #ccc', fontSize:'0.9rem', fontWeight:'bold', color: ad.color}}>
                  CODE: {ad.coupon_code}
              </div>
          </div>
      ))}
    </>
  );
}
