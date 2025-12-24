import { useState, useEffect } from 'react';
import { Printer, Truck, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export default function OrdersTab({ onLoadToPrinter }: { onLoadToPrinter: (order: any, user: any, theme: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const oSnap = await getDocs(query(collection(db, "orders"), orderBy("timestamp", "desc")));
        setOrders(oSnap.docs.map(d => ({id: d.id, ...d.data()})));
        
        const uSnap = await getDocs(collection(db, "users"));
        setUsers(uSnap.docs.map(d => ({id: d.id, ...d.data()})));

        const tSnap = await getDocs(collection(db, "themes"));
        setThemes(tSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMarkShipped = async (orderId: string) => { 
      if(confirm("Mark as Shipped?")) { 
          await updateDoc(doc(db, "orders", orderId), { status: 'shipped' }); 
          loadData(); 
      }
  };

  if(loading) return <div style={{padding:'20px', textAlign:'center'}}>Loading Orders...</div>;

  return (
    <div className="result-card" style={{textAlign:'left'}}>
        <h3>Incoming Orders</h3>
        {orders.length === 0 ? <p style={{color:'#666'}}>No orders yet.</p> : (
            <div style={{display:'grid', gap:'15px'}}>
                {orders.map(order => {
                    const customer = users.find(u => u.id === order.uid);
                    const theme = themes.find(t => t.id === order.theme_id);
                    return (
                        <div key={order.id} style={{padding:'15px', background: order.status === 'shipped' ? '#f0fdfa' : 'white', border:'1px solid #eee', borderRadius:'12px'}}>
                            <div style={{fontWeight:'bold'}}>{order.item_name}</div>
                            <div style={{fontSize:'0.9rem', color:'#666'}}>{order.user_email}</div>
                            <div style={{fontSize:'0.8rem', color:'#999'}}>ID: {order.id}</div>
                            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                {order.status === 'pending' && (
                                    <button onClick={() => onLoadToPrinter(order, customer, theme)} style={{background:'#1e293b', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <Printer size={14}/> Print
                                    </button>
                                )}
                                {order.status === 'pending' ? (
                                    <button onClick={() => handleMarkShipped(order.id)} style={{background:'white', color:'#166534', border:'1px solid #166534', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <Truck size={14}/> Ship
                                    </button>
                                ) : (
                                    <div style={{color:'#166534', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <CheckCircle size={14}/> Shipped
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}
