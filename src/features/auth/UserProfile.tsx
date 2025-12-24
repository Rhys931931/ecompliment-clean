import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { updateProfile, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import ProfileForm from './components/ProfileForm';

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
    // 1. Check Auth & Load Basic Info
    const unsubscribe = auth.onAuthStateChanged((u) => {
        if (!u) { 
            navigate('/login'); 
        } else {
            setDisplayName(u.displayName || '');
            setPhotoURL(u.photoURL || '');
            loadUserData(u.uid);
        }
    });
    return () => unsubscribe();
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
      <main className="content-area" style={{marginTop:'60px', padding:'20px'}}>
          <ProfileForm 
              displayName={displayName}
              setDisplayName={setDisplayName}
              photoURL={photoURL}
              bio={bio}
              setBio={setBio}
              links={links}
              onLinkChange={handleLinkChange}
              masterPin={masterPin}
              loading={loading}
              imgLoading={imgLoading}
              success={success}
              onImageUpload={handleImageUpload}
              onSubmit={handleUpdate}
              onLogout={handleLogout}
          />
      </main>
    </div>
  );
}
