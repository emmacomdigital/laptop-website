/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Laptop, ShoppingCart, Database, LogOut, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  sheetUrl: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onLogin: () => void;
  onLogout: () => void;
  isStripeConfigured: boolean;
  activeView: 'store' | 'admin' | 'sandbox' | 'success';
  onSetView: (view: 'store' | 'admin') => void;
  onManualSync: () => void;
}

export default function Navbar({
  user,
  sheetUrl,
  syncStatus,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onLogin,
  onLogout,
  isStripeConfigured,
  activeView,
  onSetView,
  onManualSync
}: NavbarProps) {
  return (
    <header id="app-navbar" className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div 
          className="flex cursor-pointer items-center space-x-2" 
          onClick={() => onSetView('store')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white shadow-md">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-950">AeroLap</h1>
            <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">Sheets DB Engine</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        {user && (
          <div className="hidden items-center space-x-3 md:flex">
            <div className="flex items-center space-x-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-orange-500" />
                  <span>Syncing Sheets...</span>
                </>
              )}
              {syncStatus === 'synced' && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Synced with Drive</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  <span>Connection Error</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <Database className="h-3 w-3 text-gray-400" />
                  <span>Sheets Standby</span>
                </>
              )}
            </div>

            {sheetUrl && (
              <a 
                href={sheetUrl} 
                target="_blank" 
                rel="no-referrer" 
                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                title="Open Google Sheet Database"
              >
                <span>Database Sheet</span>
                <span className="inline-block">↗</span>
              </a>
            )}
          </div>
        )}

        {/* Actions Menu */}
        <div className="flex items-center space-x-4">
          {/* Main View Buttons */}
          <button
            onClick={() => onSetView('store')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeView === 'store' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Store
          </button>
          
          {user && (
            <button
              onClick={() => onSetView('admin')}
              className={`flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === 'admin' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Database className="h-4 w-4 text-gray-400" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Secure Payment Gateway Config State Indicator */}
          <div className="hidden lg:flex items-center space-x-1" title={isStripeConfigured ? "Real Stripe Payment Live" : "Fallback Sandbox mode configured"}>
            <span className={`h-2 w-2 rounded-full ${isStripeConfigured ? 'bg-indigo-500' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] font-medium text-gray-500 font-mono">
              {isStripeConfigured ? 'STRIPE' : 'DEMO GATE'}
            </span>
          </div>

          {/* Refresh Sheet button */}
          {user && (
            <button
              onClick={onManualSync}
              disabled={syncStatus === 'syncing'}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Refresh spreadsheet inventory"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-gray-700 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
            title="Open Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-md ring-2 ring-white"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          {/* Authentication State */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-gray-100 pl-4">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
                alt="user avatar"
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full ring-2 ring-gray-100"
              />
              <button
                onClick={onLogout}
                className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-rose-600 transition-colors md:block"
                title="Log Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 transition-all active:scale-95"
            >
              <span>Initialize Sheets Database</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
