/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RefreshCw, ShoppingBag, ExternalLink, Calendar, Mail, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { appendOrderRecord, updateInventoriesAfterSale } from '../lib/sheets';
import { Order, Laptop } from '../types';

interface SuccessViewProps {
  spreadsheetId: string;
  accessToken: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  sessionId: string;
  laptops: Laptop[]; // current loaded laptops to help make accurate stock deductions
  onClearCart: () => void;
  onNavigateToStore: () => void;
  onRefreshLaptops: () => Promise<void>;
}

export default function SuccessView({
  spreadsheetId,
  accessToken,
  customerName,
  customerEmail,
  items,
  sessionId,
  laptops,
  onClearCart,
  onNavigateToStore,
  onRefreshLaptops
}: SuccessViewProps) {
  const [syncStatus, setSyncStatus] = useState<'pending' | 'writing' | 'completed' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderLogs, setOrderLogs] = useState<Order[]>([]);
  const hasLoggedRef = useRef(false);

  const totalPaid = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    // Single execution guard to prevent double-writes on React strict/re-render cycles
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    async function writeAndSyncLogs() {
      try {
        setSyncStatus('writing');
        onClearCart(); // empty cart immediately upon successful payment

        // 1. Create matching order log instances
        const ordersCreated: Order[] = items.map((item, index) => {
          const uniqueId = `ORD-${Date.now().toString().slice(-4)}-${index + 1}`;
          return {
            id: uniqueId,
            customerName,
            customerEmail,
            laptopId: item.laptopId,
            laptopName: `${item.brand} ${item.name}`,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            paymentStatus: 'Paid',
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
          };
        });

        setOrderLogs(ordersCreated);

        // 2. Write each order row to the Orders sheet
        for (const order of ordersCreated) {
          await appendOrderRecord(accessToken, spreadsheetId, order);
        }

        // 3. Compute and write new stock levels to Inventory Sheet
        const stockUpdates = items.map(item => {
          // Find matching loaded laptop to match latest sheet stock
          const matchingLaptop = laptops.find(l => l.id === item.laptopId);
          const currentStock = matchingLaptop ? matchingLaptop.stockLevel : 10;
          const newStock = Math.max(0, currentStock - item.quantity);
          return {
            laptopId: item.laptopId,
            newStock
          };
        });

        await updateInventoriesAfterSale(accessToken, spreadsheetId, stockUpdates);

        // 4. Force state reload in main container
        await onRefreshLaptops();

        setSyncStatus('completed');
      } catch (err: any) {
        console.error('Error writing payment logs to Google Sheets:', err);
        setSyncStatus('failed');
        setErrorMessage(err.message || 'Connecting to Google Sheets failed. Your order is secured, but stock logging is temporary delayed.');
      }
    }

    writeAndSyncLogs();
  }, [spreadsheetId, accessToken, customerName, customerEmail, items, laptops]);

  return (
    <div id="payment-success-stage" className="mx-auto max-w-2xl px-4 py-16 text-center">
      {/* Decorative success header */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-md mb-4 ring-8 ring-emerald-500/10">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-gray-950 tracking-tight">Purchase Successful</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">Thank you for your order! Your payment has been securely completed.</p>
      </div>

      {/* Real-time Google Sheets database updates tracker */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8 text-left">
        <h3 className="text-sm font-bold text-gray-950 flex items-center space-x-2 border-b border-gray-150 pb-3 mb-4 font-sans">
          <FileSpreadsheet className="h-4.5 w-4.5 text-stone-500" />
          <span>Real-time Google Sheet Syncing</span>
        </h3>

        {syncStatus === 'writing' && (
          <div className="flex items-center space-x-3.5 py-2">
            <RefreshCw className="h-5 w-5 animate-spin text-orange-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-normal">Updating Database Sheets...</p>
              <p className="text-[11px] text-gray-500">Writing orders to 'Orders' sheet & adjusting stock levels in 'Inventory'...</p>
            </div>
          </div>
        )}

        {syncStatus === 'completed' && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 py-1 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900 leading-none">Database Synced Successfully!</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                  Our server has updated your Google Sheet inventory and appended all transactional entries automatically under your credential.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-150 flex items-center justify-between text-xs font-medium">
              <span className="text-gray-500">Spreadsheet DB Link</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="no-referrer"
                className="flex items-center space-x-1 font-bold text-gray-950 hover:underline"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {syncStatus === 'failed' && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shrink-0 text-rose-800 text-xs leading-relaxed">
            <p className="font-bold text-rose-950 mb-0.5">Dual-write sheet writeback had an issue</p>
            <p className="text-rose-900">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Invoice details card summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-12 text-left">
        <h3 className="text-xs font-bold text-gray-400 font-mono tracking-widest uppercase border-b border-gray-150 pb-3 mb-4">
          TRANSACTION SUMMARY
        </h3>

        <div className="space-y-3.5 text-xs text-gray-600">
          <div className="flex justify-between font-medium">
            <span>Customer Details</span>
            <span className="font-bold text-gray-900">{customerName} ({customerEmail})</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Payment Session</span>
            <span className="font-mono text-gray-500">{sessionId.slice(0, 18)}...</span>
          </div>
          
          <div className="border-t border-gray-100 pt-3 flex flex-col space-y-2">
            <span className="font-bold text-gray-400 font-mono tracking-wider text-[10px] uppercase">ITEMS PURCHASED</span>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs font-bold text-gray-950 pl-2 border-l-2 border-gray-150">
                <span>{item.brand} {item.name} (x{item.quantity})</span>
                <span className="font-mono">${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-150 pt-3.5 flex justify-between font-black text-gray-950 text-sm">
            <span>Total Checked Out</span>
            <span className="font-mono text-base">${totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Call to Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onNavigateToStore}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gray-950 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-gray-900 transition-all active:scale-98"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Laptop Store</span>
        </button>
      </div>
    </div>
  );
}
