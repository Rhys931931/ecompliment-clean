import { Loader, Inbox } from 'lucide-react';

interface ActivityItem {
  id: string;
  search_code: string;
  message: string;
  timestamp: any;
}

interface Props {
  activities: ActivityItem[];
  loading: boolean;
  onSelect: (item: ActivityItem) => void;
  onCreate: () => void;
}

export default function ActivityList({ activities, loading, onSelect, onCreate }: Props) {
  if (loading) return <div className="p-10 text-center text-gray-400"><Loader className="spin mx-auto mb-2"/> Loading records...</div>;

  if (activities.length === 0) {
      return (
          <div className="p-10 text-center text-gray-400">
              <Inbox size={40} className="mx-auto mb-2 opacity-20"/>
              <p>You haven't sent any compliments yet.</p>
              <button onClick={onCreate} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg font-bold">Send One Now</button>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Message</th>
                    <th className="p-4 text-right">Date</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {activities.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => onSelect(item)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                        <td className="p-4">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                                {item.search_code}
                            </span>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">
                            <div className="truncate max-w-[200px]">{item.message}</div>
                        </td>
                        <td className="p-4 text-right text-gray-400 text-sm">
                            {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : '...'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}
