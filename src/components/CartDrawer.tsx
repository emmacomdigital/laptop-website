/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Mail, User, AlertTriangle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (laptopId: string, quantity: number) => void;
  onRemoveItem: (laptopId: string) => void;
  onCheckout: (customerName: string, customerEmail: string) => void;
  isCheckoutLoading: boolean;
  user: FirebaseUser | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckoutLoading,
  user
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Prefill user details if signed in
  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.laptop.basePrice * item.quantity,
    0
  );

  // Check if any cart item quantity exceeds currently available Sheet inventory stock levels
  const overstockItem = cartItems.find(item => item.quantity > item.laptop.stockLevel);

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!customerName.trim()) return;
    if (!customerEmail.trim()) return;

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    onCheckout(customerName, customerEmail);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-55 bg-black"
          />

          {/* Sliding Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-55 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-gray-100"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-gray-900" />
                <h2 className="text-lg font-bold text-gray-950">Shopping Cart</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                title="Close Cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-gray-50 p-6 text-gray-400 mb-4">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Cart is empty</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-xs leading-relaxed">
                    Explore our premium high-performance series laptops and select configurations to configure your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => {
                    const isExceedingStock = item.quantity > item.laptop.stockLevel;
                    return (
                      <div
                        key={item.laptop.id}
                        className="flex items-start space-x-4 rounded-xl border border-gray-50 bg-gray-50/50 p-3.5 transition-colors"
                      >
                        <img
                          src={item.laptop.imageUrl}
                          alt={item.laptop.name}
                          referrerPolicy="no-referrer"
                          className="h-16 w-16 rounded-lg object-cover object-center"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {item.laptop.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-mono tracking-wider mb-2">
                            {item.laptop.brand.toUpperCase()} | {item.laptop.ram}
                          </p>

                          {/* Stocks alerts */}
                          {isExceedingStock ? (
                            <p className="text-[10px] font-semibold text-rose-600 flex items-center mb-2">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Only {item.laptop.stockLevel} left!
                            </p>
                          ) : (
                            <p className="text-[10px] text-emerald-700 font-medium mb-2">
                              ✓ In-stock (Max. {item.laptop.stockLevel})
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            {/* Quantity selection buttons */}
                            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-100 p-0.5">
                              <button
                                onClick={() =>
                                  onUpdateQuantity(item.laptop.id, item.quantity - 1)
                                }
                                className="p-1 text-gray-400 hover:text-gray-900 rounded"
                                title="Subtract"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-gray-900 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  onUpdateQuantity(item.laptop.id, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.laptop.stockLevel}
                                className="p-1 text-gray-400 hover:text-gray-900 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Add"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="text-sm font-extrabold text-gray-900 font-mono">
                              ${(item.laptop.basePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.laptop.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Form with Checkout Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                {/* Total amount summaries */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between text-xs text-gray-500 font-medium font-sans">
                    <span>Order Subtotal</span>
                    <span className="font-mono">${totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium font-sans">
                    <span>Shipping Insurance</span>
                    <span className="text-emerald-700 uppercase font-semibold">Free Delivery</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200/60 pt-3 text-base font-extrabold text-gray-950">
                    <span>Total Amount</span>
                    <span className="font-mono text-lg">${totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Secure Checkout Form */}
                <form onSubmit={handleSubmitCheckout} className="space-y-3.5">
                  <p className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">
                    CUSTOMER PURCHASE INFORMATION
                  </p>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-gray-950 transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={e => {
                          setCustomerEmail(e.target.value);
                          setEmailError('');
                        }}
                        placeholder="Email Address"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-gray-950 transition-colors"
                      />
                    </div>
                    {emailError && (
                      <p className="text-[10px] font-semibold text-rose-600 leading-tight">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {overstockItem && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex space-x-2 text-rose-800 text-[11px] leading-relaxed">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <div>
                        <strong>Insufficient Stock Alert</strong>
                        <p>One or more items in your cart exceed currently available Google Sheet levels. Please adjust quantities to complete checkout.</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCheckoutLoading || !!overstockItem}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gray-950 py-3.5 text-xs font-bold text-white shadow-md hover:bg-gray-900 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Linking Payment Gateway...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Secure checkout</span>
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-3.5 text-center text-[10px] leading-relaxed text-gray-400">
                  Secured by TLS Encryption. Stock checked directly in real-time.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
