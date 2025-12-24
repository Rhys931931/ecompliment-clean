import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, LogOut, Key, RefreshCw, Link as LinkIcon, FileText, Camera, Loader } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { updateProfile, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState(['', '', '']); // 3 Empty Links
  const [masterPin, setMasterPin] = useState('');

  useEffect(() => {
    if (!auth.currentUser) { navigate('/login'); return; }
    
    const u = auth.currentUser;
    setDisplayName(u.displayName || '');
    setPhotoURL(u.photoURL || '');
    loadUserData(u.uid);
  }, [navigate]);

  const loadUserData = async (uid: string) => {
      try {
          const docSnap = await getDoc(doc(db, "users", uid));
          if (docSnap.exists()) {
              const data = docSnap.data();
              setMasterPin(data.master_pin || 'Generating...');
              if (data.bio) setBio(data.bio);
              if (data.links && Array.isArray(data.links)) {
                  // Ensure exactly 3 slots
                  const loadedLinks = [...data.links, '', '', ''].slice(0, 3);
                  setLinks(loadedLinks);
              }
          }
      } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && auth.currentUser) {
          setImgLoading(true);
          const file = e.target.files[0];
          // Path: profile_photos/UID_TIMESTAMP
          const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}_${Date.now()}`);
          
          try {
              await uploadBytes(storageRef, file);
              const url = await getDownloadURL(storageRef);
              setPhotoURL(url); // Update UI preview immediately
          } catch (err) {
              console.error("Upload failed", err);
              alert("Photo upload failed. Try a smaller image.");
          } finally {
              setImgLoading(false);
          }
      }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setSuccess('');

    try {
      // 1. Update Auth Profile
      await updateProfile(auth.currentUser, { displayName, photoURL });
      
      // 2. Update User Hub
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        display_name: displayName,
        photo_url: photoURL,
        bio: bio,
        links: links.filter(l => l.trim() !== '') // Clean empty links
      });

      // 3. Update Public Profile (The Face)
      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userSnap.exists() && userSnap.data().blind_key) {
          await updateDoc(doc(db, "public_profiles", userSnap.data().blind_key), {
              display_name: displayName,
              photo_url: photoURL,
              bio: bio,
              links: links.filter(l => l.trim() !== '')
          });
      }

      setSuccess("Profile Updated!");
    } catch (error) { console.error(error); alert("Failed."); }
    setLoading(false);
  };

  const handleLinkChange = (index: number, value: string) => {
      const newLinks = [...links];
      newLinks[index] = value;
      setLinks(newLinks);
  };

  const handleLogout = () => { signOut(auth); navigate('/login'); };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={auth.currentUser} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'600px'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h1 style={{margin:0, fontSize:'1.8rem'}}>My Profile</h1>
            <button onClick={handleLogout} style={{background:'#fee2e2', color:'#b91c1c', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}>
                <LogOut size={16}/> Sign Out
            </button>
        </div>

        {/* PHOTO UPLOAD SECTION */}
        <div style={{textAlign:'center', marginBottom:'30px'}}>
            <div style={{position:'relative', width:'110px', height:'110px', margin:'0 auto'}}>
                <img 
                    src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=random`} 
                    style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'4px solid white', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                />
                <label 
                    htmlFor="photo-upload" 
                    style={{
                        position:'absolute', bottom:'0', right:'0', 
                        background:'#4da6a9', color:'white', 
                        width:'36px', height:'36px', borderRadius:'50%', 
                        display:'flex', alignItems:'center', justifyContent:'center', 
                        cursor:'pointer', border:'3px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    {imgLoading ? <Loader size={16} className="spin"/> : <Camera size={18}/>}
                </label>
                <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{display:'none'}}
                />
            </div>
        </div>

        {/* MASTER KEY */}
        <div className="result-card" style={{borderLeft:'4px solid #4da6a9', background:'white', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div><h3 style={{margin:'0 0 5px 0', display:'flex', gap:'8px', alignItems:'center'}}><Key size={18}/> Master PIN</h3><p style={{margin:0, fontSize:'0.85rem', color:'#666'}}>Your secret unlock code.</p></div>
            <div style={{background:'#f0fdfa', padding:'8px 12px', borderRadius:'8px', fontWeight:'900', color:'#0f766e', fontFamily:'monospace', fontSize:'1.1rem'}}>{masterPin}</div>
        </div>

        <form onSubmit={handleUpdate} className="result-card">
            <h3 style={{marginTop:0}}>Public Details</h3>
            
            <label className="input-label"><User size={16}/> Display Name</label>
            <input className="text-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />

            <label className="input-label"><FileText size={16}/> Bio (Short Intro)</label>
            <textarea className="text-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Coffee lover, Artist, Dreamer."/>

            <label className="input-label"><LinkIcon size={16}/> My Interests (3 Links)</label>
            {links.map((link, i) => (
                <input 
                    key={i} 
                    className="text-input" 
                    style={{marginBottom:'10px'}} 
                    placeholder={`https://site-${i+1}.com`}
                    value={link}
                    onChange={e => handleLinkChange(i, e.target.value)}
                />
            ))}

            <button type="submit" className="claim-btn" disabled={loading} style={{marginTop:'10px', width:'100%', justifyContent:'center'}}>
                {loading ? <RefreshCw className="spin"/> : <Save size={18}/>} Save Profile
            </button>
            {success && <p style={{textAlign:'center', color:'#166534', marginTop:'10px', fontWeight:'bold'}}>{success}</p>}
        </form>
      </main>
    </div>
  );
}
