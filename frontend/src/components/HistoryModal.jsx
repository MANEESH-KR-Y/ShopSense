import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import BillTemplate from './BillTemplate';
import { generateBillImage } from '../utils/billGenerator';

export default function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const billRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setHistory(res.data.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error('Failed to load details', err);
      alert('Could not load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadBill = async () => {
    if (!billRef.current) return;
    try {
      const image = await generateBillImage(billRef.current);
      setPreviewImage(image);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate bill preview');
    }
  };

  const confirmDownload = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `ShopSense-Order-${selectedOrder.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setPreviewImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg shadow-2xl w-full flex flex-col max-h-[90vh] transition-all ${selectedOrder ? 'max-w-6xl' : 'max-w-4xl'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--color-brand-border)]">
          <h3 className="text-2xl font-bold text-white uppercase tracking-wider">
            {selectedOrder ? `Order #${selectedOrder.id}` : 'Billing History'}
          </h3>
          <div className="flex gap-4">
            {selectedOrder && (
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-sm bg-gray-700 px-3 py-1 rounded text-white hover:bg-gray-600"
              >
                ← Back to List
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-red-500 text-3xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* List View */}
          <div
            className={`flex-1 overflow-auto p-6 custom-scrollbar ${selectedOrder ? 'hidden md:block md:w-1/3' : 'w-full'}`}
          >
            {loading ? (
              <div className="text-center text-[var(--color-brand-text-muted)] animate-pulse">
                Loading...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center text-[var(--color-brand-text-muted)]">
                No orders found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[var(--color-brand-text-muted)] border-b border-[var(--color-brand-border)] uppercase text-sm">
                    <th className="pb-3 pl-2">ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {history.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b border-[var(--color-brand-border)] hover:bg-[var(--color-brand-black)]/50 transition-colors ${selectedOrder?.id === order.id ? 'bg-[var(--color-brand-blue)]/10' : ''}`}
                    >
                      <td className="py-4 pl-2 font-mono text-[var(--color-brand-blue)]">
                        #{order.id}
                      </td>
                      <td className="py-4 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right font-bold">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="px-3 py-1 bg-[var(--color-brand-blue)] text-white text-xs font-bold rounded hover:bg-blue-600"
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail View (Bill Preview) */}
          {selectedOrder && (
            <div className="flex-1 bg-black p-8 overflow-auto border-l border-[var(--color-brand-border)] flex flex-col items-center">
              {detailsLoading ? (
                <div className="text-white">Loading details...</div>
              ) : (
                <>
                  <div className="mb-4 flex gap-4 w-full justify-center">
                    <button
                      onClick={handleDownloadBill}
                      className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-blue)] text-[var(--color-brand-blue)] px-6 py-2 rounded-lg font-bold hover:bg-[var(--color-brand-blue)] hover:text-white transition-all uppercase flex items-center gap-2"
                    >
                      Download Bill ⬇️
                    </button>
                  </div>

                  {/* The Template to Capture */}
                  <div className="w-[800px] transform scale-75 origin-top">
                    {/* Scale down for visibility, capture will use full res via html2canvas options if configured or by cloning */}
                    <BillTemplate
                      ref={billRef}
                      cart={selectedOrder.items || []}
                      subtotal={selectedOrder.total_amount}
                      totalAmount={selectedOrder.total_amount}
                      date={selectedOrder.created_at}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Bill Preview Modal for History */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-brand-border)]">
              <h3 className="text-xl font-bold text-white">Bill Preview</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-white hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-black flex justify-center">
              <img
                src={previewImage}
                alt="Bill Preview"
                className="max-w-full shadow-lg border border-gray-800"
              />
            </div>
            <div className="p-4 border-t border-[var(--color-brand-border)] flex gap-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="flex-1 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                className="flex-1 py-3 bg-[var(--color-brand-blue)] text-white font-bold rounded hover:bg-blue-600 transition-colors"
              >
                Download Image ⬇️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
