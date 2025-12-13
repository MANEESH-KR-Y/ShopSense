import React, { forwardRef } from 'react';

const BillTemplate = forwardRef(({ cart, subtotal, totalAmount, date, printing = false }, ref) => {
  // Helper for centering text in mono
  const center = 'text-center';
  const divider = 'border-t border-dashed border-black my-2';

  return (
    <div
      ref={ref}
      className={`bg-white text-black font-mono p-4 text-xs md:text-sm leading-tight flex flex-col relative ${printing ? 'w-[400px] h-auto overflow-visible' : 'w-full h-[600px] overflow-hidden'}`}
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Header */}
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-1">ShopSense Retail</h1>
        <p className="text-[10px]">Store #402, High Street, Mumbai</p>
        <p className="text-[10px]">GSTIN: 27AABCU9603R1ZN</p>
        <p className="text-[10px]">Ph: +91-9876543210</p>
        <p className="text-[10px] mt-1">Tax Invoice</p>
      </div>

      {/* Meta Data */}
      <div className="flex justify-between text-[10px] mb-2">
        <span>
          Date: {date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}
        </span>
        <span>
          Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex justify-between text-[10px] mb-2">
        <span>Bill No: {date ? new Date(date).getTime().toString().slice(-6) : '123456'}</span>
        <span>Cashier: Admin</span>
      </div>

      <div className={divider}></div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 font-bold text-[10px] uppercase mb-1 border-b border-black pb-1">
        <div className="col-span-5">Item</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Rate</div>
        <div className="col-span-3 text-right">Amt</div>
      </div>

      {/* Items */}
      <div className={`flex-1 ${printing ? '' : 'overflow-y-auto custom-scrollbar-black'}`}>
        {cart.length === 0 ? (
          <div className="text-center py-8 opacity-50">-- Empty Cart --</div>
        ) : (
          cart.map((item, index) => (
            <div
              key={item.id || index}
              className="grid grid-cols-12 gap-1 text-[10px] mb-1 border-b border-dashed border-gray-300 pb-1"
            >
              <div className="col-span-5 break-words font-semibold pr-1">{item.name}</div>
              <div className="col-span-2 text-center">
                {item.quantity} {item.unit}
              </div>
              <div className="col-span-2 text-right">{item.price}</div>
              <div className="col-span-3 text-right">{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>

      <div className={divider}></div>

      {/* Footer Calculation */}
      <div className="flex flex-col gap-1 text-[12px]">
        <div className="flex justify-between">
          <span>SubTotal:</span>
          <span>{parseFloat(subtotal || 0).toFixed(2)}</span>
        </div>
        {/* GST implied or separate? User didn't specify, keeping simple */}
        <div className="flex justify-between font-bold text-sm mt-2 border-t border-dashed border-black pt-2">
          <span>TOTAL:</span>
          <span>Rs {parseFloat(totalAmount || 0).toFixed(2)}</span>
        </div>
        <div className="text-right text-[10px] mt-1">(Inclusive of all taxes)</div>
      </div>

      <div className={divider}></div>

      {/* Footer Message */}
      <div className="text-center mt-4">
        <p className="font-bold text-sm">*** Thank You ***</p>
        <p className="text-[10px] mt-1">Visit Again!</p>
        <div className="mt-2 text-[8px] text-center">E & O.E. | Subject to Jurisdiction</div>
      </div>

      {/* Barcode Mockup */}
      <div className="mt-4 flex justify-center">
        <div className="h-8 w-2/3 bg-black opacity-20"></div> {/* Placeholder for barcode */}
      </div>
    </div>
  );
});

export default BillTemplate;
