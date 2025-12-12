import React, { forwardRef } from "react";

const BillTemplate = forwardRef(({ cart, subtotal, totalAmount, date }, ref) => {
    return (
        <div ref={ref} className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] p-8 rounded-lg shadow-xl flex flex-col h-[600px] relative">
            <h2 className="text-2xl font-bold mb-6 text-white flex justify-between items-center uppercase tracking-wider">
                Order Summary
                <span className="text-sm font-bold bg-[var(--color-brand-blue)] text-white px-3 py-1 rounded-md">{cart.length} Items</span>
            </h2>

            <div className="text-[var(--color-brand-text-muted)] text-sm mb-4">
                Date: {date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-brand-text-muted)] border-2 border-dashed border-[var(--color-brand-border)] rounded-md">
                        <span className="text-4xl mb-2">🛒</span>
                        <p className="uppercase font-bold">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={item.id || index} className="flex justify-between items-center bg-[var(--color-brand-black)] p-4 border border-[var(--color-brand-border)] rounded-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] flex items-center justify-center font-bold rounded-full">
                                    {(item.name || "Item").charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white uppercase">{item.name}</h4>
                                    <p className="text-sm text-[var(--color-brand-text-muted)]">₹{item.price} / {item.unit || 'pcs'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-white font-mono bg-gray-700 px-2 rounded">Qty: {item.quantity}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-[var(--color-brand-blue)] text-lg">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-[var(--color-brand-black)] p-6 border-t border-[var(--color-brand-border)] rounded-b-lg mt-auto">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[var(--color-brand-text-muted)] text-sm uppercase">
                        <span>Subtotal</span>
                        <span>₹{parseFloat(subtotal || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex justify-between text-2xl font-bold mb-6 text-white uppercase border-t border-[var(--color-brand-border)] pt-4">
                    <span>Total</span>
                    <span className="text-[var(--color-brand-blue)]">₹{parseFloat(totalAmount || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
});

export default BillTemplate;
