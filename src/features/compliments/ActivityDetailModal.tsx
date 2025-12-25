import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, CheckCircle, Eye, Lock, MessageSquare } from 'lucide-react';
import { doc, deleteDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase.prod';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  secret: any;
  onUpdate: () => void;
}

export default function ActivityDetailModal({ isOpen, onClose, secret, onUpdate }: Props) {
  const [loading, setLoading] = useState(true);
  const [publicDoc, setPublicDoc] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Separate States for Public vs Private
  const [publicMessage, setPublicMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [recipientName, setRecipientName] = useState('');

  useEffect(() => {
    if (isOpen && secret?.search_code) {
        fetchPublicStatus();
        // Initialize Private Data from the Secret (Receipt)
        setPrivateNote(secret.private_note || secret.message || '');
    }
  }, [isOpen, secret]);

  const fetchPublicStatus = async () => {
      setLoading(true);
      try {
          const q = query(collection(db, 'compliments'), where('search_code', '==', secret.search_code));
          const snap = await getDocs(q);
          if (!snap.empty) {
              const data = snap.docs[0].data();
              setPublicDoc({ id: snap.docs[0].id, ...data });
              // Initialize Public Data from the Card
              setPublicMessage(data.message || '');
              setRecipientName(data.recipient_name || '');
          } else {
              setPublicDoc(null);
          }
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleSave = async () => {
      try {
          // 1. Update Public Card (If it exists) - The Receiver Sees This
          if (publicDoc) {
              await updateDoc(doc(db, 'compliments', publicDoc.id), { 
                  message: publicMessage,
                  recipient_name: recipientName 
              });
          }
          
          // 2. Update Private Receipt - Only You See This
          await updateDoc(doc(db, 'compliment_secrets', secret.id), { 
              private_note: privateNote 
          });

          setIsEditing(false);
          onUpdate();
          alert("Updated successfully!");
      } catch (e) { alert("Update failed."); }
  };

  const handleDelete = async () => {
      if (!confirm("Delete this card forever?")) return;
      try {
          if (publicDoc) await deleteDoc(doc(db, 'compliments', publicDoc.id));
          await deleteDoc(doc(db, 'compliment_secrets', secret.id));
          onClose();
          onUpdate();
      } catch (e) { alert("Delete failed."); }
  };

  if (!isOpen) return null;

  const isClaimed = publicDoc?.claimed || publicDoc?.status === 'claimed';
  const qrUrl = publicDoc?.magic_token ? `https://ecompliment.app/?magic=${publicDoc.magic_token}` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700 m-0">Card Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto text-left">
            
            {/* 1. PUBLIC SECTION (Editable) */}
            <div className="mb-6 p-4 border border-blue-100 rounded-xl bg-blue-50">
                <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold text-sm uppercase">
                    <MessageSquare size={16}/> Public Card (Receiver Sees)
                </div>
                
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500">To:</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded" 
                                value={recipientName} 
                                onChange={e => setRecipientName(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Message:</label>
                            <textarea 
                                className="w-full p-2 border border-gray-300 rounded" 
                                rows={2} 
                                value={publicMessage} 
                                onChange={e => setPublicMessage(e.target.value)} 
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="font-bold text-lg text-gray-800 mb-1">{recipientName}</div>
                        <div className="text-gray-700 italic">"{publicMessage}"</div>
                    </>
                )}
            </div>

            {/* 2. PRIVATE SECTION (Editable) */}
            <div className="mb-6 p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                <div className="flex items-center gap-2 mb-3 text-yellow-800 font-bold text-sm uppercase">
                    <Lock size={16}/> Private Note (Only You See)
                </div>
                
                {isEditing ? (
                    <textarea 
                        className="w-full p-2 border border-yellow-300 rounded bg-yellow-50" 
                        rows={2} 
                        value={privateNote} 
                        onChange={e => setPrivateNote(e.target.value)} 
                    />
                ) : (
                    <div className="text-gray-700 text-sm">{privateNote}</div>
                )}
            </div>

            {/* 3. CODES & QR */}
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Search Code</div>
                <div className="text-3xl font-mono font-black text-slate-700 tracking-widest mb-4">{secret.search_code}</div>
                
                {qrUrl && (
                    <div className="flex justify-center">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                            <QRCodeSVG value={qrUrl} size={100} />
                        </div>
                    </div>
                )}
                
                <div className="mt-4">
                    {loading ? (
                        <span className="text-gray-400 text-sm">Checking status...</span>
                    ) : isClaimed ? (
                        <span className="text-green-600 font-bold text-sm flex items-center justify-center gap-2">
                            <CheckCircle size={16}/> Claimed by {publicDoc?.claimer_name || 'Friend'}
                        </span>
                    ) : (
                        <span className="text-blue-500 font-bold text-sm flex items-center justify-center gap-2">
                            <Eye size={16}/> Waiting for Pickup
                        </span>
                    )}
                </div>
            </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            {isEditing ? (
                <>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700"><Save size={18}/> Save Changes</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                </>
            ) : (
                <>
                    <button onClick={() => setIsEditing(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50">
                        <Edit2 size={18}/> Edit Card
                    </button>
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
