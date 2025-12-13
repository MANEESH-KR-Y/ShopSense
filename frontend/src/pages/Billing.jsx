import { useState, useEffect, useRef } from 'react';
import { generateBillImage } from '../utils/billGenerator';
import api from '../services/api';
import { useSync } from '../contexts/SyncContext';
import Sidebar from '../components/Sidebar';
import Fuse from 'fuse.js';
import HistoryModal from '../components/HistoryModal';
import BillTemplate from '../components/BillTemplate';
import { useVoice } from '../hooks/useVoice';
import Toast from '../components/Toast'; // Import Toast
import { NLU } from '../utils/nlu';

function Billing() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [billData, setBillData] = useState({ cart: [], total: 0 });
  const [previewImage, setPreviewImage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const billRef = useRef(null);
  const { isOnline, addToQueue } = useSync();
  const { text: voiceText, start: startVoice, stop: stopVoice, isListening } = useVoice();

  // --- HELPER FUNCTIONS ---
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const toggleVoice = () => {
    if (isListening) {
      stopVoice();
      showToast('Voice Listening Stopped', 'info');
    } else {
      startVoice();
      showToast("Listening... (Say 'Add 2kg Rice', 'Checkout')", 'success');
    }
  };

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setSearchTerm('');
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
  };

  const confirmDownload = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `ShopSense-Bill-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setPreviewImage(null);
    showToast('Bill Downloaded!', 'success');
  };

  // --- COMPUTED VALUES ---
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = 0;
  const totalAmount = subtotal + taxAmount;

  // --- ASYNC HANDLERS ---
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const orderData = {
      customerName: 'Walk-in Customer',
      totalAmount: totalAmount,
      taxAmount: taxAmount,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    if (!isOnline) {
      addToQueue(orderData);
      setCart([]);
      showToast('⚠️ Offline: Order Saved! Will sync when online.', 'warning');
      return;
    }

    try {
      await api.post('/orders', orderData);
      setLastOrder({ items: [...cart], total: totalAmount });
      setCart([]);
      showToast('Order Placed Successfully!', 'success');
    } catch (err) {
      showToast('Checkout Failed', 'error');
    }
  };

  const handleGenerateBill = async (items = cart, total = totalAmount, directDownload = false) => {
    const currentDataStr = JSON.stringify({ cart: billData.cart, total: billData.total });
    const newDataStr = JSON.stringify({ cart: items, total });

    if (currentDataStr !== newDataStr) {
      setBillData({ cart: items, total });
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!billRef.current || billRef.current.innerHTML === '') {
      showToast('Error: Bill template is empty.', 'error');
      return;
    }

    try {
      const image = await generateBillImage(billRef.current);
      if (directDownload) {
        const link = document.createElement('a');
        link.href = image;
        link.download = `ShopSense-Bill-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Bill Downloaded Successfully!', 'success');
      } else {
        setPreviewImage(image);
      }
    } catch (err) {
      console.error('Bill generation failed', err);
      showToast('Failed to generate bill', 'error');
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (cart.length > 0) {
      setBillData({ cart, total: totalAmount });
    }
  }, [cart, totalAmount]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const fuse = new Fuse(products, {
      keys: ['name', 'id'],
      threshold: 0.3,
      distance: 100,
    });
    const results = fuse.search(searchTerm);
    setSearchResults(results.map((r) => r.item));
  }, [searchTerm, products]);

  useEffect(() => {
    if (!voiceText) return;

    try {
      const { intent, term, product, quantity } = NLU.parse(voiceText, products);

      switch (intent) {
        case 'checkout':
          handleCheckout();
          break;
        case 'generate_bill':
          handleGenerateBill(cart, totalAmount, true);
          showToast('Generating Bill...', 'info');
          break;
        case 'add_to_cart':
          addToCart(product, quantity);
          showToast(`Added ${quantity} x ${product.name}`, 'success');
          setSearchTerm('');
          break;
        case 'remove_from_cart': {
          const itemToRemove = cart.find((item) => item.id === product.id);
          if (itemToRemove) {
            removeFromCart(product.id);
            showToast(`Removed ${product.name}`, 'info');
          } else {
            showToast(`${product.name} not in cart`, 'warning');
          }
          break;
        }
        case 'clear_cart':
          setCart([]);
          showToast('Cart Cleared', 'info');
          break;
        case 'update_quantity': {
          const itemToUpdate = cart.find((item) => item.id === product.id);
          if (itemToUpdate) {
            updateQuantity(product.id, quantity);
            showToast(`Updated ${product.name} to ${quantity}`, 'success');
          } else {
            addToCart(product, quantity);
            showToast(`Added ${quantity} x ${product.name}`, 'success');
          }
          break;
        }
        case 'search':
        default:
          setSearchTerm(term || voiceText);
          break;
      }
    } catch {
      showToast('Voice parsing failed', 'error');
    }
  }, [voiceText, products]);

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto relative bg-[var(--color-brand-black)]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

        {/* Toast Notification */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <div className="flex justify-between items-center mb-8 border-b-2 border-[var(--color-brand-blue)] pb-2 relative z-10">
          <h1 className="text-3xl font-bold text-[var(--color-brand-text)]">Billing Terminal</h1>
          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-bold rounded-lg hover:border-[var(--color-brand-blue)] transition-all flex items-center gap-2"
          >
            <span>📜</span> History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10">
          {/* Search Panel */}
          <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] p-8 rounded-lg shadow-xl relative h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-wider">
              Product Search
            </h2>

            <div className="mb-6 relative">
              <input
                autoFocus
                type="text"
                className="w-full bg-[var(--color-brand-black)] border border-[var(--color-brand-border)] text-white p-4 pr-12 rounded-lg text-lg focus:border-[var(--color-brand-blue)] focus:outline-none placeholder-gray-600"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={toggleVoice}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-gray-400 hover:text-white hover:bg-[var(--color-brand-border)]'}`}
                title={isListening ? 'Stop Listening' : 'Start Voice Search'}
              >
                {isListening ? '🛑' : '🎤'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {/* Show all products if no search, or filtered results */}
              {(searchTerm ? searchResults : products).map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-lg flex justify-between items-center cursor-pointer hover:bg-[var(--color-brand-blue)]/10 hover:border-[var(--color-brand-blue)] transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {product.name}{' '}
                      <span className="text-sm text-[var(--color-brand-text-muted)]">
                        ({product.unit || 'pcs'})
                      </span>
                    </h3>
                    <p className="text-sm text-[var(--color-brand-text-muted)]">
                      Stock: {product.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[var(--color-brand-blue)] text-xl">
                      ₹{product.price}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl">
                      +
                    </button>
                  </div>
                </div>
              ))}

              {searchTerm && searchResults.length === 0 && (
                <div className="text-center text-[var(--color-brand-text-muted)] py-8">
                  No Match Found
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="flex flex-col h-[600px] relative">
            {/* Interactive Cart UI */}
            <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] p-8 rounded-lg shadow-xl flex flex-col h-full z-10">
              <h2 className="text-2xl font-bold mb-6 text-white flex justify-between items-center uppercase tracking-wider">
                Current Order
                <span className="text-sm font-bold bg-[var(--color-brand-blue)] text-white px-3 py-1 rounded-md">
                  {cart.length} Items
                </span>
              </h2>

              <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--color-brand-text-muted)] border-2 border-dashed border-[var(--color-brand-border)] rounded-md">
                    <span className="text-4xl mb-2">🛒</span>
                    <p className="uppercase font-bold">Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-[var(--color-brand-black)] p-4 border border-[var(--color-brand-border)] rounded-md hover:border-[var(--color-brand-blue)] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] flex items-center justify-center font-bold rounded-full">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white uppercase">{item.name}</h4>
                          <p className="text-sm text-[var(--color-brand-text-muted)]">
                            ₹{item.price} / {item.unit || 'pcs'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 bg-gray-700 rounded text-xs text-white hover:bg-gray-600"
                            >
                              -
                            </button>
                            <span className="text-sm text-white font-mono w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 bg-gray-700 rounded text-xs text-white hover:bg-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[var(--color-brand-blue)] text-lg">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-[var(--color-brand-black)] p-6 border-t border-[var(--color-brand-border)] rounded-b-lg">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[var(--color-brand-text-muted)] text-sm uppercase">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-bold mb-6 text-white uppercase border-t border-[var(--color-brand-border)] pt-4">
                  <span>Total</span>
                  <span className="text-[var(--color-brand-blue)]">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Hidden Template for Generation ONLY */}
            {/* Position at top:0 left:0 but behind everything (z-index -1000) and fully opaque. 
                            This ensures the browser renders it. The main app background covers it. */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: '-1000px',
                width: '400px',
                zIndex: -1000,
                pointerEvents: 'none',
                opacity: 0,
              }}
            >
              <BillTemplate
                ref={billRef}
                cart={billData.cart}
                subtotal={billData.total}
                totalAmount={billData.total}
                printing={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid gap-3">
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-4 bg-[var(--color-brand-blue)] text-white font-bold text-lg hover:bg-[var(--color-brand-blue-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase rounded-md shadow-lg shadow-indigo-900/20"
              >
                Complete Payment →
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => handleGenerateBill(cart, totalAmount)}
                  className="w-full py-3 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-bold text-sm hover:bg-[var(--color-brand-border)] transition-all uppercase rounded-md"
                >
                  Preview & Download Bill 📸
                </button>
              )}

              {/* Download Last Bill Button (Visible after checkout) */}
              {cart.length === 0 && lastOrder && (
                <button
                  onClick={() => handleGenerateBill(lastOrder.items, lastOrder.total, true)}
                  className="w-full py-3 bg-green-900/20 border border-green-500/50 text-green-400 font-bold text-sm hover:bg-green-900/40 transition-all uppercase rounded-md animate-in fade-in slide-in-from-top-2"
                >
                  Download Last Bill 🧾
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bill Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

        {/* Billing History Modal */}
        <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
      </main>
    </div>
  );
}

export default Billing;
