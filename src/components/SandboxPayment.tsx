/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

interface SandboxPaymentProps {
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: any[];
  onCompletePayment: () => void;
}

export default function SandboxPayment({
  customerName,
  customerEmail,
  totalAmount,
  items,
  onCompletePayment
}: SandboxPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState(customerName || '');
  const [isPaying, setIsPaying] = useState(false);
  const [focusedField, setFocusedField] = useState<'number' | 'expiry' | 'cvv' | 'name' | null>(null);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value).substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9]/g, '');
    if (clean.length > 2) {
      clean = clean.substring(0, 2) + '/' + clean.substring(2, 4);
    }
    setExpiry(clean.substring(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    setCvv(clean.substring(0, 3));
  };

  const handleTriggerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 15) return;
    if (expiry.length < 5) return;
    if (cvv.length < 3) return;

    setIsPaying(true);
    setTimeout(() => {
      onCompletePayment();
    }, 2200);
  };

  return (
    <div id="sandbox-payment-stage" className="mx-auto max-w-lg px-4 py-12">
      {/* Simulation Header */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 mb-8 flex items-start space-x-3 text-amber-900 text-xs leading-relaxed shadow-xs">
        <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <strong className="font-semibold block text-amber-950 mb-0.5">Sandbox Simulator Mode Active</strong>
          No Stripe key was provided in your environment files, so we have bridged you to our custom high-fidelity payment sim. Perfect for validating inventory deducts and spreadsheet records without spending real money!
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
        {/* Merchant Summary */}
        <div className="mb-6 pb-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">MERCHANT ACCOUNT</p>
            <h3 className="text-base font-extrabold text-gray-900">AeroLap Store checkout</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">AMOUNT DUE</span>
            <p className="text-xl font-black text-gray-950 font-mono">${totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Dynamic Credit Card Visualizer */}
        <div className="relative aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-tr from-stone-900 via-stone-800 to-stone-950 p-5 text-white shadow-lg overflow-hidden mb-8 font-mono">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-stone-800/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 h-32 w-32 rounded-full bg-stone-800/20 blur-2xl" />

          {/* Card branding */}
          <div className="flex items-start justify-between h-full flex-col">
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-bold tracking-widest opacity-80">AEROLAP SECURE</span>
              <Lock className="h-4 w-4 opacity-40" />
            </div>

            {/* Simulating chip */}
            <div className="h-9 w-12 rounded-lg bg-yellow-500/20 border border-yellow-500/30 overflow-hidden relative mb-4">
              <div className="absolute inset-x-2 top-0 bottom-0 border-r border-yellow-500/10" />
              <div className="absolute inset-y-2 left-0 right-0 border-b border-yellow-500/10" />
            </div>

            {/* Card number display */}
            <div className="w-full text-base sm:text-lg tracking-wider text-gray-100 select-none pb-2">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between w-full text-[10px] sm:text-xs">
              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest leading-none mb-1">CARDHOLDER</span>
                <span className="font-bold text-gray-200 uppercase truncate max-w-[180px] block">
                  {cardName || 'YOUR FULL NAME'}
                </span>
              </div>

              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest leading-none mb-1">EXPIRY</span>
                <span className="font-bold text-gray-200">
                  {expiry || 'MM/YY'}
                </span>
              </div>

              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest leading-none mb-1">CVV</span>
                <span className="font-bold text-gray-200">
                  {cvv || '•••'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTriggerPayment} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-1.5">
              Card Number
            </label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              onFocus={() => setFocusedField('number')}
              onBlur={() => setFocusedField(null)}
              placeholder="4000 1234 5678 9010"
              className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm font-medium font-mono text-gray-900 outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-1.5">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Name on card"
              className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm font-semibold text-gray-900 outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-1.5">
                Expiration
              </label>
              <input
                type="text"
                required
                value={expiry}
                onChange={handleExpiryChange}
                onFocus={() => setFocusedField('expiry')}
                onBlur={() => setFocusedField(null)}
                placeholder="MM/YY"
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm font-medium font-mono text-gray-900 outline-none focus:border-stone-900 text-center transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-1.5">
                CVV Code
              </label>
              <input
                type="password"
                required
                value={cvv}
                onChange={handleCvvChange}
                onFocus={() => setFocusedField('cvv')}
                onBlur={() => setFocusedField(null)}
                placeholder="123"
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm font-medium font-mono text-gray-900 outline-none focus:border-stone-900 text-center tracking-widest transition-colors"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={isPaying}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gray-950 py-4 text-xs font-bold text-white shadow-md hover:bg-gray-900 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isPaying ? (
              <>
                <svg
                  className="h-4.5 w-4.5 animate-spin text-white"
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
                <span>Processing Secure Auth...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gray-400" />
                <span>Simulate Demo Payment</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
          Secured by simulation engine. Real-time Sheets inventory remains protected.
        </p>
      </div>
    </div>
  );
}
