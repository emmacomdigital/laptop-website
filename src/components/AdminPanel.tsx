/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Laptop } from '../types';
import { Database, Table, HelpCircle, ExternalLink, RefreshCw, Layers, ShieldCheck, CheckCircle, Search, Calendar, ChevronRight } from 'lucide-react';

interface AdminPanelProps {
  spreadsheetId: string | null;
  sheetUrl: string | null;
  orders: Order[];
  laptops: Laptop[];
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onManualSync: () => void;
  isStripeConfigured: boolean;
}

export default function AdminPanel({
  spreadsheetId,
  sheetUrl,
  orders,
  laptops,
  syncStatus,
  onManualSync,
  isStripeConfigured
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'docs'>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'Paid' | 'Pending'>('all');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.laptopName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase());
    
    if (orderFilter === 'all') return matchesSearch;
    return matchesSearch && o.paymentStatus === orderFilter;
  });

  return (
    <div id="admin-panel" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Title & Connections Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">Admin Operations Console</h2>
          <p className="text-sm text-gray-500 font-medium">Manage e-commerce inventory, live databases and orders history.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="no-referrer"
              className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition-all hover:scale-102 active:scale-98"
            >
              <span>Open Google Sheet</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          )}

          <button
            onClick={onManualSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center space-x-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-gray-900 transition-all active:scale-98 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* Database Quick Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-8">
        {/* Connection status card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 font-mono tracking-wider">DATABASE ENGINE</span>
            <div className={`h-2.5 w-2.5 rounded-full ${spreadsheetId ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {spreadsheetId ? 'Google Sheets Active' : 'Offline State'}
          </h3>
          <p className="mt-1 text-xs text-gray-500 font-mono leading-relaxed truncate">
            {spreadsheetId ? `ID: ${spreadsheetId}` : 'Credentials missing. Sign in first.'}
          </p>
        </div>

        {/* Live inventory status card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 font-mono tracking-wider">INVENTORY STOCK</span>
            <span className="rounded-md bg-stone-50 border border-stone-200 px-1.5 py-0.5 text-[10px] font-mono text-stone-600 font-semibold">
              Live
            </span>
          </div>
          <h3 className="text-xl font-black text-gray-950">
            {laptops.length} Models
          </h3>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            Represented across {laptops.reduce((acc, l) => acc + l.stockLevel, 0)} total device stocks.
          </p>
        </div>

        {/* Stripe gateway card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 font-mono tracking-wider">PAYMENT SECURITY</span>
            <ShieldCheck className={`h-5 w-5 ${isStripeConfigured ? 'text-indigo-500' : 'text-amber-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {isStripeConfigured ? 'Secure Stripe Active' : 'Sandbox Simulator'}
          </h3>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            {isStripeConfigured 
              ? 'Real credit card processing active via API key!' 
              : 'Interactive demo simulation running safely in background.'}
          </p>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold tracking-wider uppercase transition-colors ${
              activeTab === 'orders'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>Orders History ({orders.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold tracking-wider uppercase transition-colors ${
              activeTab === 'inventory'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Sheets Database rows</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold tracking-wider uppercase transition-colors ${
              activeTab === 'docs'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Integration Guide</span>
          </button>
        </div>

        {/* Tab panels */}
        <div className="p-6">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-900 outline-none focus:border-gray-950 transition-colors"
                  />
                </div>

                <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
                  <span className="text-xs font-bold text-gray-400 uppercase hidden sm:inline mr-1">Status</span>
                  {(['all', 'Paid', 'Pending'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                        orderFilter === f
                          ? 'bg-gray-150 text-gray-900 font-bold'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {f === 'all' ? 'All Rows' : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table list */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-gray-500">No matching orders found.</p>
                  <p className="text-xs text-gray-400 mt-1">If this is a new setup, run a test checkout to see it appended instantly.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-150">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Order ID</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Customer</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Laptop details</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Quantity</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Total</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Status</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="whitespace-nowrap px-5 py-4 text-xs font-bold font-mono text-gray-900">{order.id}</td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-bold text-gray-950">{order.customerName}</p>
                            <p className="text-[10px] text-gray-400 font-medium font-sans">{order.customerEmail}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-bold text-gray-900">{order.laptopName}</span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500 font-mono font-medium text-center">{order.quantity}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs font-extrabold text-gray-950 font-mono">${order.totalPrice.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-[10px] font-medium text-gray-400 font-mono">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVENTORY DATABASE TAB */}
          {activeTab === 'inventory' && (
            <div>
              <p className="text-xs text-gray-500 mb-4 font-semibold leading-relaxed">
                The spreadsheet database contains the current product items array. Editing values on Google Sheets modifies values here immediately in real-time.
              </p>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-150">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">ID</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Product Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Brand</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Specs Shortcut</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Base Price</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 font-mono uppercase">Stock Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {laptops.map(laptop => (
                      <tr key={laptop.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-bold font-mono text-gray-900">{laptop.id}</td>
                        <td className="px-5 py-4 font-bold text-xs text-gray-950">{laptop.name}</td>
                        <td className="px-5 py-4 text-xs text-gray-500 uppercase tracking-widest font-bold">{laptop.brand}</td>
                        <td className="px-5 py-4 text-xs text-gray-400 font-mono truncate max-w-xs">{laptop.ram} | {laptop.storage}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-extrabold text-gray-950 font-mono">${laptop.basePrice.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            laptop.stockLevel === 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {laptop.stockLevel} units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INTEGRATION GUIDE TAB */}
          {activeTab === 'docs' && (
            <div className="space-y-6 max-w-3xl text-sm leading-relaxed text-gray-600">
              <div>
                <h4 className="flex items-center space-x-2 text-base font-bold text-gray-950 mb-2">
                  <Database className="h-5 w-5 text-gray-500" />
                  <span>Google Sheets Database Mapping</span>
                </h4>
                <p>
                  We have configured Google Sheets database sheets to act as dual tables:
                </p>
                <div className="mt-2.5 space-y-1.5 list-disc pl-5 font-mono text-xs">
                  <div><strong>Inventory Tab</strong>: Keeps stock rates, retail price levels, and system parameters. Headers mapped strictly: `ID, Name, Brand, CPU, RAM, Storage, GPU, Specifications, Base Price, Image URL, Stock Level`</div>
                  <div><strong>Orders Tab</strong>: Automatically appends order entries. Headers: `Order ID, Customer Name, Customer Email, Laptop ID, Laptop Name, Quantity, Total Price, Payment Status, Date`</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="flex items-center space-x-2 text-base font-bold text-gray-950 mb-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  <span>Payment Gateway Credentials</span>
                </h4>
                <p>
                  To switch payment states from safe <strong>Sandbox Simulator</strong> to real live <strong>Stripe Merchant account Redirects</strong>, add your API configurations inside files or environment:
                </p>
                <div className="mt-3 rounded-lg bg-gray-50 p-3.5 border border-gray-100 text-xs font-mono text-gray-800 leading-normal">
                  <span className="text-gray-400"># Inside the Environment Variables Panel in AI Studio:</span>
                  <br />
                  <strong className="text-indigo-700">STRIPE_SECRET_KEY</strong>="sk_test_51Px..."
                  <br />
                  <br />
                  <span className="text-gray-400"># Self referential link (AI Studio injects this automatically)</span>
                  <br />
                  <strong>APP_URL</strong>="https://ais-dev-yourhosting..."
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
