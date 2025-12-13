import React, { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';

export default function GstReport() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    authAPI.getGstReport().then((res) => setOrders(res.data));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black min-h-screen p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 no-print">
          <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
            ← Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
          >
            PRINT REPORT
          </button>
        </div>

        <div className="border-b-2 border-black pb-4 mb-4">
          <h1 className="text-3xl font-bold uppercase">GST Tax Report</h1>
          <p>ShopSense Inventory System</p>
          <p className="text-sm">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Order ID</th>
              <th className="py-2">Date</th>
              <th className="py-2 text-right">Taxable Val</th>
              <th className="py-2 text-right">CGST (9%)</th>
              <th className="py-2 text-right">SGST (9%)</th>
              <th className="py-2 text-right">Total Tax</th>
              <th className="py-2 text-right">Net Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-300">
                <td className="py-2">#{order.id}</td>
                <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="py-2 text-right">₹{order.taxable_value}</td>
                <td className="py-2 text-right">₹{order.cgst}</td>
                <td className="py-2 text-right">₹{order.sgst}</td>
                <td className="py-2 text-right font-bold">₹{order.tax_amount}</td>
                <td className="py-2 text-right font-bold">₹{order.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 text-center text-xs">
          <p>*** END OF REPORT ***</p>
        </div>
      </div>
      <style>{`
                @media print {
                    .no-print { display: none; }
                    body { background: white; color: black; }
                }
            `}</style>
    </div>
  );
}
