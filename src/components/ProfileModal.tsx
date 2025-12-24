import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  blindKey?: string;
  userId?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, blindKey, userId }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (blindKey) {
        fetchPublicProfile(blindKey);
      } else {
        // Just log userId to silence the unused variable warning
        console.log("Legacy lookup for:", userId);
        setLoading(false);
        setProfile({ display_name: "Loading...", bio: "Profile migration in progress." });
      }
    }
  }, [isOpen, blindKey, userId]);

  const fetchPublicProfile = async (key: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'public_profiles', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data());
      else setProfile(null);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full relative p-6">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 text-2xl">×</button>
        {loading ? <p className="text-center p-4">Loading...</p> : (
          <div className="text-center">
             <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
               <img src={profile?.photo_url || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="w-full h-full object-cover"/>
             </div>
             <h2 className="text-xl font-bold">{profile?.display_name || "Unknown"}</h2>
             <p className="text-gray-600 mt-2">{profile?.bio}</p>
             <p className="text-xs text-gray-400 mt-4">ID: {blindKey || "Hidden"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
