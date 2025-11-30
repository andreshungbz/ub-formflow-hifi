'use client';

import { useAuth } from '@/context/AuthContext';
import { downloadReceipt } from '@/lib/downloadReceipt';

export default function Home() {
  const { studentId } = useAuth();

  const handleDownload = () => {
    downloadReceipt(studentId, 'Test Form');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Form History</h1>
      <button
        className="px-4 py-2 bg-ub-purple text-white rounded hover:bg-ub-purple/80 transition-colors"
        onClick={handleDownload}
      >
        Download Receipt
      </button>
    </div>
  );
}
