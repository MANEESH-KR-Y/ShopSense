import { useState, useEffect, useRef } from "react";
import { generateBillImage } from "../utils/billGenerator";
import api from "../services/api";
import { useSync } from "../contexts/SyncContext";
import Sidebar from "../components/Sidebar";
import Fuse from "fuse.js";
import HistoryModal from "../components/HistoryModal";
import BillTemplate from "../components/BillTemplate";
import { useVoiceContext } from "../contexts/VoiceContext"; // Updated import
import Toast from "../components/Toast"; // Import Toast
import { NLU } from "../utils/nlu";

function Billing() {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [lastOrder, setLastOrder] = useState(null);

    // Toast State
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const billRef = useRef(null);
    const { isOnline, addToQueue } = useSync();

    // Voice Integration (Global Context)
    const { text: voiceText, start: startVoice, stop: stopVoice, isListening, language, setLanguage } = useVoiceContext();

    const toggleVoice = () => {
        if (isListening) {
            stopVoice();
            showToast("Voice Listening Stopped", "info");
        } else {
            startVoice();
            showToast("Listening... (Say 'Add 2kg Rice', 'Checkout')", "success");
        }
    };

    // --- CALCULATIONS ---
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;

    // --- HELPER FUNCTIONS ---
    const addToCart = (product, qty = 1) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + qty } // Add parsed qty
                        : item
                );
            }
            return [...prev, { ...product, quantity: qty }]; // Use parsed qty
        });
        setSearchTerm(""); // Clear search after adding
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const orderData = {
            customerName: "Walk-in Customer",
            totalAmount: totalAmount,
            taxAmount: taxAmount,
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        if (!isOnline) {
            addToQueue(orderData);
            setCart([]);
            showToast("⚠️ Offline: Order Saved! Will sync when online.", 'warning');
            return;
        }

        try {
            await api.post("/orders", orderData);
            setLastOrder({ items: [...cart], total: totalAmount }); // Save for bill generation
            setCart([]);
            showToast("Order Placed Successfully!", 'success');
        } catch {
            showToast("Checkout Failed", 'error');
        }
    };

    // --- BILL GENERATION & HISTORY ---
    const [previewImage, setPreviewImage] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [billData, setBillData] = useState({ cart: [], total: 0 });

    const handleGenerateBill = async (items = cart, total = totalAmount, directDownload = false) => {
        // Force update bill data for the snapshot
        const currentDataStr = JSON.stringify({ cart: billData.cart, total: billData.total });
        const newDataStr = JSON.stringify({ cart: items, total });

        if (currentDataStr !== newDataStr) {
            console.log("Updating Bill Data for Generation...");
            setBillData({ cart: items, total });
            // Wait for React to render the updated state into the ref
            await new Promise(r => setTimeout(r, 500));
        }

        if (!billRef.current) {
            console.error("Bill Ref not found!");
            return;
        }

        try {
            console.log("Generating Bill Image...");
            if (billRef.current.innerHTML === "") {
                console.error("Bill Ref is empty!");
                showToast("Error: Bill template is empty.", 'error');
                return;
            }

            const image = await generateBillImage(billRef.current);
            console.log("Bill Image Generated. Direct Download:", directDownload);

            if (directDownload) {
                const link = document.createElement("a");
                link.href = image;
                link.download = `ShopSense-Bill-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("Bill Downloaded Successfully!", 'success');
            } else {
                setPreviewImage(image);
            }
        } catch (err) {
            console.error("Bill generation failed", err);
            showToast("Failed to generate bill: " + err.message, 'error');
        }
    };

    const confirmDownload = () => {
        if (!previewImage) return;
        const link = document.createElement("a");
        link.href = previewImage;
        link.download = `ShopSense-Bill-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPreviewImage(null); // Close after download
        showToast("Bill Downloaded!", 'success');
    };

    // --- EFFECTS ---

    // Voice NLU Effect
    const lastProcessedText = useRef("");

    useEffect(() => {
        if (!voiceText || voiceText === lastProcessedText.current) return;

        // Mark as processed immediately to prevent loops
        lastProcessedText.current = voiceText;

        const processVoice = async () => {
            // Use NLU Engine with Error Boundary
            try {
                // Now await the async NLU
                const { intent, term, product, quantity } = await NLU.parse(voiceText, products);
                console.log("NLU Processed:", intent, product?.name);

                switch (intent) {
                    case 'checkout':
                        handleCheckout();
                        break;
                    case 'generate_bill':
                        handleGenerateBill(cart, totalAmount, true); // cart is now fresh
                        showToast("Generating Bill...", "info");
                        break;
                    case 'add_to_cart':
                        addToCart(product, quantity);
                        showToast(`Added ${quantity} x ${product.name}`, 'success');
                        setSearchTerm("");
                        break;
                    case 'remove_from_cart': {
                        const itemToRemove = cart.find(item => item.id === product.id);
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
                        showToast("Cart Cleared", 'info');
                        break;
                    case 'update_quantity': {
                        const itemToUpdate = cart.find(item => item.id === product.id);
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
            } catch (err) {
                console.error("NLU Parsing Failed:", err);
                showToast("AI processing failed", "error");
            }
        };

        processVoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceText, products, cart]); // Added cart to dependencies

    // Initial Fetch
    useEffect(() => {
        fetchProducts();
    }, []);

    // Real-time Search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const fuse = new Fuse(products, {
            keys: ["name", "id"], // Search by name or ID
            threshold: 0.3, // Stricter for manual typing
            distance: 100
        });

        const results = fuse.search(searchTerm);
        setSearchResults(results.map(r => r.item));
    }, [searchTerm, products]);

    // Sync current cart to billData when valid
    useEffect(() => {
        if (cart.length > 0) {
            setBillData({ cart, total: totalAmount });
        }
    }, [cart, totalAmount]);


    return (
        <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto relative bg-[var(--color-brand-black)]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}

                <div className="flex justify-between items-center mb-8 border-b-2 border-[var(--color-brand-blue)] pb-2 relative z-10">
                    <h1 className="text-3xl font-bold text-[var(--color-brand-text)]">
                        Billing Terminal
                    </h1>
                    <button
                        onClick={() => setShowHistory(true)}
                        className="px-4 py-2 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-bold rounded-lg hover:border-[var(--color-brand-blue)] transition-all flex items-center gap-2"
                    >
                        <span>📜</span> History
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10">
                    {/* Search Panel */}
                    <div className="glass-panel p-8 rounded-[var(--radius-card)] relative h-[600px] flex flex-col shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-wider flex items-center gap-2">
                            🔎 Product Search
                        </h2>

                        <div className="mb-6 relative flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    autoFocus
                                    type="text"
                                    className="input-field"
                                    placeholder={language === 'te-IN' ? "ఉత్పత్తిని శోధించండి..." : "Search by name..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-text-muted)] pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                                <button
                                    onClick={toggleVoice}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                                    title={isListening ? "Stop Listening" : "Start Voice Search"}
                                >
                                    {isListening ? '🛑' : '🎤'}
                                </button>
                            </div>

                            {/* Language Toggle */}
                            <button
                                onClick={() => {
                                    const newLang = language === 'en-IN' ? 'te-IN' : 'en-IN';
                                    setLanguage(newLang);
                                    showToast(newLang === 'te-IN' ? "Telugu Voice Enabled 🗣️" : "English Voice Enabled 🗣️", "success");
                                }}
                                className="px-4 rounded-lg border border-[#3f3f46] bg-[#27272a] text-white font-bold text-sm hover:bg-[#3f3f46] transition-colors flex flex-col items-center justify-center min-w-[80px]"
                                title="Switch Language"
                            >
                                <span className={`text-[10px] uppercase tracking-wider ${language === 'en-IN' ? 'text-blue-400' : 'text-zinc-500'}`}>ENG</span>
                                <div className="w-8 h-4 bg-black/40 rounded-full relative mx-1 my-0.5 border border-white/10">
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${language === 'te-IN' ? 'left-4 bg-orange-400' : 'left-0.5 bg-blue-400'}`}></div>
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider ${language === 'te-IN' ? 'text-orange-400' : 'text-zinc-500'}`}>TEL</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">
                            {/* Show all products if no search, or filtered results */}
                            {(searchTerm ? searchResults : products).map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[var(--color-brand-blue)]/20 hover:border-[var(--color-brand-blue)]/50 transition-all group active:scale-[0.98]"
                                >
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{product.name} <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[var(--color-brand-text-muted)] ml-2">{product.unit || 'pcs'}</span></h3>
                                        <p className="text-sm text-[var(--color-brand-text-muted)] mt-1">Available: {product.stock}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-[var(--color-brand-blue)] text-xl">₹{product.price}</span>
                                        <button className="w-10 h-10 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] group-hover:bg-[var(--color-brand-blue)] group-hover:text-white flex items-center justify-center transition-all font-bold text-xl shadow-lg shadow-indigo-500/10">+</button>
                                    </div>
                                </div>
                            ))}

                            {searchTerm && searchResults.length === 0 && (
                                <div className="text-center text-[var(--color-brand-text-muted)] py-12 flex flex-col items-center">
                                    <span className="text-4xl mb-2 opacity-50">🔍</span>
                                    No Match Found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="flex flex-col h-[600px] relative">
                        {/* Interactive Cart UI */}
                        <div className="glass-panel p-8 rounded-[var(--radius-card)] flex flex-col h-full z-10 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-white flex justify-between items-center uppercase tracking-wider">
                                Current Order
                                <span className="text-xs font-bold bg-[var(--color-brand-blue)] text-white px-3 py-1.5 rounded-full">{cart.length} Items</span>
                            </h2>

                            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-3 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-brand-text-muted)] border-2 border-dashed border-white/10 rounded-2xl">
                                        <span className="text-6xl mb-4 bg-gradient-to-br from-gray-700 to-transparent bg-clip-text text-transparent">🛒</span>
                                        <p className="uppercase font-bold tracking-widest text-sm">Cart is empty</p>
                                        <p className="text-xs opacity-50 mt-2">Add items to start billing</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-black/20 p-4 border border-white/5 rounded-2xl hover:border-white/20 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-brand-blue)] to-purple-600 text-white flex items-center justify-center font-bold rounded-xl shadow-lg shadow-indigo-500/20">
                                                    {item.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                                    <p className="text-sm text-[var(--color-brand-text-muted)]">₹{item.price} × {item.quantity}{item.unit}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-md text-white hover:bg-white/10 flex items-center justify-center font-bold text-lg">-</button>
                                                    <span className="text-white font-mono w-8 text-center font-bold">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-md text-white hover:bg-white/10 flex items-center justify-center font-bold text-lg">+</button>
                                                </div>

                                                <div className="flex flex-col items-end min-w-[80px]">
                                                    <span className="font-bold text-white text-lg">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase hover:underline mt-1">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-black/20 -mx-8 -mb-8 p-8 border-t border-white/10 rounded-b-[var(--radius-card)]">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-[var(--color-brand-text-muted)] text-sm uppercase font-medium tracking-wide">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[var(--color-brand-text-muted)] text-sm uppercase font-medium tracking-wide">
                                        <span>Tax (0%)</span>
                                        <span>₹0.00</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-3xl font-bold text-white tracking-tight">
                                    <span>Total</span>
                                    <span className="bg-gradient-to-r from-white to-[var(--color-brand-blue)] bg-clip-text text-transparent">₹{totalAmount.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full mt-8 btn btn-primary py-4 text-base tracking-widest uppercase disabled:opacity-50 disabled:grayscale"
                                >
                                    Confirm Payment
                                </button>

                                {cart.length > 0 && (
                                    <button
                                        onClick={() => handleGenerateBill(cart, totalAmount)}
                                        className="w-full mt-3 btn btn-secondary py-3 text-xs tracking-widest uppercase"
                                    >
                                        Preview Bill
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Hidden Template for Generation ONLY */}
                        <div style={{ position: "absolute", top: 0, left: "-5000px", width: "400px", background: "white" }}>
                            <BillTemplate
                                ref={billRef}
                                cart={billData.cart}
                                subtotal={billData.total}
                                totalAmount={billData.total}
                                printing={true}
                            />
                        </div>

                        {/* Download Last Bill Button (Visible after checkout) */}
                        {cart.length === 0 && lastOrder && (
                            <div className="absolute top-2 right-2 left-2 z-20">
                                <button
                                    onClick={() => handleGenerateBill(lastOrder.items, lastOrder.total, true)}
                                    className="w-full py-3 bg-green-500/20 border border-green-500/30 backdrop-blur-md text-green-400 font-bold text-sm hover:bg-green-500/30 transition-all uppercase rounded-xl animate-in fade-in slide-in-from-top-4 shadow-lg"
                                >
                                    Download Last Bill 🧾
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill Preview Modal */}
                {previewImage && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-4 border-b border-[var(--color-brand-border)]">
                                <h3 className="text-xl font-bold text-white">Bill Preview</h3>
                                <button onClick={() => setPreviewImage(null)} className="text-white hover:text-red-500 text-2xl">&times;</button>
                            </div>
                            <div className="p-4 overflow-auto flex-1 bg-black flex justify-center">
                                <img src={previewImage} alt="Bill Preview" className="max-w-full shadow-lg border border-gray-800" />
                            </div>
                            <div className="p-4 border-t border-[var(--color-brand-border)] flex gap-4">
                                <button onClick={() => setPreviewImage(null)} className="flex-1 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={confirmDownload} className="flex-1 py-3 bg-[var(--color-brand-blue)] text-white font-bold rounded hover:bg-blue-600 transition-colors">
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
