import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, CheckCircle, Eye } from 'lucide-react';
import { doc, deleteDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  secret: any; // The private data from the list
  onUpdate: () => void;
}

export default function ActivityDetailModal({ isOpen, onClose, secret, onUpdate }: Props) {
  const [loading, setLoading] = useState(true);
  const [publicDoc, setPublicDoc] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(secret?.message || '');
  
  // 1. Live Fetch on Open
  useEffect(() => {
    if (isOpen && secret?.search_code) {
        fetchPublicStatus();
        setMessage(secret.message);
    }
  }, [isOpen, secret]);

  const fetchPublicStatus = async () => {
      setLoading(true);
      try {
          // Find the public flyer matching this secret code
          const q = query(collection(db, 'compliments'), where('search_code', '==', secret.search_code));
          const snap = await getDocs(q);
          if (!snap.empty) {
              setPublicDoc({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
              setPublicDoc(null); // Maybe deleted or not synced
          }
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleSave = async () => {
      if (!publicDoc) return;
      try {
          // Update Public
          await updateDoc(doc(db, 'compliments', publicDoc.id), { message });
          // Update Private
          await updateDoc(doc(db, 'compliment_secrets', secret.id), { private_note: message });
          setIsEditing(false);
          onUpdate(); // Refresh parent list
          alert("Message updated!");
      } catch (e) { alert("Update failed."); }
  };

  const handleDelete = async () => {
      if (!confirm("Are you sure? This will delete the card forever.")) return;
      try {
          // Delete Public
          if (publicDoc) await deleteDoc(doc(db, 'compliments', publicDoc.id));
          // Delete Private
          await deleteDoc(doc(db, 'compliment_secrets', secret.id));
          onClose();
          onUpdate();
      } catch (e) { alert("Delete failed."); }
  };

  if (!isOpen) return null;

  const isClaimed = publicDoc?.claimed || publicDoc?.status === 'claimed';
  const qrUrl = `https://ecompliment.app/?magic=${publicDoc?.magic_token}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700 m-0">Card Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto">
            
            {/* STATUS BADGE */}
            <div className="flex justify-center mb-6">
                {loading ? <span className="text-gray-400 text-sm">Checking status...</span> : (
                    <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${isClaimed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isClaimed ? <><CheckCircle size={16}/> Claimed by {publicDoc?.claimer_name || 'Friend'}</> : <><Eye size={16}/> Waiting for Pickup</>}
                    </div>
                )}
            </div>

            {/* THE NUMBERS */}
            <div className="text-center mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Search Code</div>
                <div className="text-3xl font-mono font-black text-slate-700 tracking-widest">{secret.search_code}</div>
                {publicDoc?.magic_token && (
                    <div className="mt-4 flex justify-center">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                            <QRCodeSVG value={qrUrl} size={100} />
                        </div>
                    </div>
                )}
            </div>

            {/* MESSAGE EDITOR */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-600 mb-2">Message on Card</label>
                {isEditing ? (
                    <textarea 
                        className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 italic border border-gray-100">
                        "{message}"
                    </div>
                )}
            </div>

            {/* METADATA */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                <div>
                    <span className="block text-xs font-bold uppercase text-gray-400">Sent To</span>
                    {secret.recipient_name}
                </div>
                <div className="text-right">
                    <span className="block text-xs font-bold uppercase text-gray-400">Date</span>
                    {secret.timestamp?.seconds ? new Date(secret.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                </div>
            </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            {isEditing ? (
                <>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700"><Save size={18}/> Save</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                </>
            ) : (
                <>
                    {!isClaimed && (
                        <button onClick={() => setIsEditing(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50">
                            <Edit2 size={18}/> Edit
                        </button>
                    )}
                    <button onClick={handleDelete} className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-100 border border-red-100">
                        <Trash2 size={18}/>
                    </button>
                </>
            )}
        </div>

      </div>
    </div>
  );
}
