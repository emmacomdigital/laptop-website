/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop as LaptopIcon, 
  Database, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  ArrowUpDown, 
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

import { Laptop, CartItem, Order } from './types';
import { googleSignIn, initAuth, logout, getAccessToken, setAccessToken } from './lib/firebase';
import { findOrCreateSpreadsheet, fetchLaptops, fetchOrders } from './lib/sheets';

// Imports modular sub-components
import Navbar from './components/Navbar';
import LaptopCard from './components/LaptopCard';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import SandboxPayment from './components/SandboxPayment';
import SuccessView from './components/SuccessView';

// Temporary local data for demonstration before linking Google Sheets DB
const DEFAULT_LAPTOPS: Laptop[] = [
  {
    id: 'LAPTOP-001',
    name: 'Zenith Pro 16',
    brand: 'Aero',
    cpu: 'Intel Core i9-14900HX',
    ram: '32GB DDR5',
    storage: '2TB NVMe SSD',
    gpu: 'NVIDIA RTX 4080 12GB',
    specifications: '16" UHD+ 120Hz Mini-LED display, Aluminium chassis, Studio-grade microphones, 99Wh battery.',
    basePrice: 2499,
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800',
    stockLevel: 15
  },
  {
    id: 'LAPTOP-002',
    name: 'Latitude CleanBook 14',
    brand: 'Aero',
    cpu: 'AMD Ryzen 7 8840U',
    ram: '16GB LPDDR5X',
    storage: '1TB PCIe 4.0 SSD',
    gpu: 'Radeon 780M (Integrated)',
    specifications: '14" 2.8K 120Hz OLED screen, Whisper-quiet fan cooling, Fingerprint power button, 1.2kg weight.',
    basePrice: 1099,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    stockLevel: 28
  },
  {
    id: 'LAPTOP-003',
    name: 'Cognitive Creator 15',
    brand: 'Helix',
    cpu: 'Intel Ultra 7 155H (NPU)',
    ram: '32GB LPDDR5X',
    storage: '1TB Gen4 SSD',
    gpu: 'Intel Arc Graphics',
    specifications: '15.6" 3K Touchscreen OLED, Stylus support, Dynamic haptic trackpad, dedicated Copilot/Creator key.',
    basePrice: 1599,
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=800',
    stockLevel: 8
  },
  {
    id: 'LAPTOP-004',
    name: 'TITAN Forge Gaming 17',
    brand: 'Matrix',
    cpu: 'AMD Ryzen 9 7945HX3D',
    ram: '64GB DDR5 Dual Channel',
    storage: '4TB NVMe Raid-0',
    gpu: 'NVIDIA RTX 4090 16GB',
    specifications: '17.3" QHD 240Hz screen, Mechanical keyboard with CherryMX, liquid metal thermal compound, 330W Adapter.',
    basePrice: 3899,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800',
    stockLevel: 5
  },
  {
    id: 'LAPTOP-005',
    name: 'Helix Airflow Slim 13',
    brand: 'Helix',
    cpu: 'Intel Core Ultra 5 125U',
    ram: '16GB LPDDR5X',
    storage: '512GB NVMe SSD',
    gpu: 'Intel Graphics',
    specifications: '13.3" IPS FHD, Fanless silent cooling design, Sleek aerospace chassis, Up to 18 hours battery life.',
    basePrice: 899,
    imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241544e3f?auto=format&fit=crop&q=80&w=800',
    stockLevel: 20
  },
  {
    id: 'LAPTOP-006',
    name: 'Vanguard Enterprise 15',
    brand: 'Matrix',
    cpu: 'Intel Core vPro i7-1370P',
    ram: '32GB DDR5 (Upgradable)',
    storage: '1TB Opal Self-encrypting',
    gpu: 'NVIDIA RTX A1000 6GB',
    specifications: '15.6" High-Contrast Matte IPS, Dual SmartCard Reader, physical privacy shutter, heavy-duty military drop cert.',
    basePrice: 1799,
    imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800',
    stockLevel: 14
  }
];

export default function App() {
  // Views states
  const [activeView, setActiveView] = useState<'store' | 'admin' | 'sandbox' | 'success'>('store');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Authentication & spreadsheet state parameters
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Business state arrays
  const [laptops, setLaptops] = useState<Laptop[]>(DEFAULT_LAPTOPS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Filters & sorting parameters
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'stock'>('default');

  // Checkout payload state
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);

  // Success query container states
  const [successParams, setSuccessParams] = useState<{
    sessionId: string;
    spreadsheetId: string;
    accessToken: string;
    customerName: string;
    customerEmail: string;
    items: any[];
  } | null>(null);

  // Sandbox parameters
  const [sandboxParams, setSandboxParams] = useState<{
    spreadsheetId: string;
    accessToken: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    items: any[];
  } | null>(null);

  // 1. Parse URL Parameter returns (Stripe Redirect Successes / Sandbox Simulator returns)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const spreadsheetIdParam = params.get('spreadsheetId');
    const accessTokenParam = params.get('accessToken');
    const customerNameParam = params.get('customerName');
    const customerEmailParam = params.get('customerEmail');
    const itemsParam = params.get('items');
    const totalAmountParam = params.get('totalAmount');

    if (spreadsheetIdParam && accessTokenParam && customerNameParam && customerEmailParam && itemsParam) {
      if (sessionId) {
        // Stripe Success Return Case
        setSuccessParams({
          sessionId,
          spreadsheetId: spreadsheetIdParam,
          accessToken: accessTokenParam,
          customerName: customerNameParam,
          customerEmail: customerEmailParam,
          items: JSON.parse(decodeURIComponent(itemsParam))
        });
        setAccessToken(accessTokenParam);
        setActiveView('success');
      } else if (totalAmountParam) {
        // Sandbox Redirect Sim Case
        setSandboxParams({
          spreadsheetId: spreadsheetIdParam,
          accessToken: accessTokenParam,
          customerName: customerNameParam,
          customerEmail: customerEmailParam,
          totalAmount: parseFloat(totalAmountParam),
          items: JSON.parse(decodeURIComponent(itemsParam))
        });
        setAccessToken(accessTokenParam);
        setActiveView('sandbox');
      }
    }

    // Recover spreadsheetId metadata from localStorage if previously stored
    const savedSheetId = localStorage.getItem('google_spreadsheet_id');
    const savedSheetUrl = localStorage.getItem('google_spreadsheet_url');
    if (savedSheetId) {
      setSpreadsheetId(savedSheetId);
    }
    if (savedSheetUrl) {
      setSpreadsheetUrl(savedSheetUrl);
    }

    // Fetch stripe configuration parameters from Server proxy
    fetch('/api/stripe-config')
      .then(res => res.json())
      .then(data => setIsStripeConfigured(data.configured))
      .catch(err => console.error("Could not fetch payment config state", err));
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        
        // Recover sheet if connected
        const savedSheetId = localStorage.getItem('google_spreadsheet_id');
        if (savedSheetId) {
          syncSheetDatabase(token, savedSheetId);
        } else {
          // Attempt automatic sheets check inside user space
          try {
            setSyncStatus('syncing');
            const sheetMeta = await findOrCreateSpreadsheet(token);
            setSpreadsheetId(sheetMeta.id);
            setSpreadsheetUrl(sheetMeta.url);
            localStorage.setItem('google_spreadsheet_id', sheetMeta.id);
            localStorage.setItem('google_spreadsheet_url', sheetMeta.url);
            
            // Sync products
            syncSheetDatabase(token, sheetMeta.id);
          } catch (err) {
            console.error("Auto sheets initialization failed", err);
            setSyncStatus('error');
          }
        }
      },
      () => {
        setUser(null);
        setSpreadsheetId(null);
        setSpreadsheetUrl(null);
        setSyncStatus('idle');
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Central Sheets Syncer Logic
  const syncSheetDatabase = async (token: string, sheetId: string) => {
    try {
      setSyncStatus('syncing');
      
      const loadedLaptops = await fetchLaptops(token, sheetId);
      if (loadedLaptops && loadedLaptops.length > 0) {
        setLaptops(loadedLaptops);
      }
      
      const loadedOrders = await fetchOrders(token, sheetId);
      if (loadedOrders) {
        setOrders(loadedOrders);
      }

      setSyncStatus('synced');
    } catch (err) {
      console.error('Error syncing spreadsheet:', err);
      setSyncStatus('error');
    }
  };

  const handleManualSync = async () => {
    const token = await getAccessToken();
    if (!token || !spreadsheetId) return;
    await syncSheetDatabase(token, spreadsheetId);
  };

  // 4. Authenticate User Action
  const handleLogin = async () => {
    try {
      setSyncStatus('syncing');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        
        // Load or auto-create Database Sheet on Drive
        const sheetMeta = await findOrCreateSpreadsheet(result.accessToken);
        setSpreadsheetId(sheetMeta.id);
        setSpreadsheetUrl(sheetMeta.url);
        localStorage.setItem('google_spreadsheet_id', sheetMeta.id);
        localStorage.setItem('google_spreadsheet_url', sheetMeta.url);

        await syncSheetDatabase(result.accessToken, sheetMeta.id);
      }
    } catch (err) {
      console.error('Authentication trigger failed:', err);
      setSyncStatus('error');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    setLaptops(DEFAULT_LAPTOPS);
    setOrders([]);
    setCartItems([]);
    localStorage.removeItem('google_spreadsheet_id');
    localStorage.removeItem('google_spreadsheet_url');
    setActiveView('store');
  };

  // 5. Shopping Cart Operations
  const handleAddToCart = (laptop: Laptop) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.laptop.id === laptop.id);
      if (existing) {
        const nextQuantity = Math.min(laptop.stockLevel, existing.quantity + 1);
        return prev.map(item => 
          item.laptop.id === laptop.id ? { ...item, quantity: nextQuantity } : item
        );
      }
      return [...prev, { laptop, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (laptopId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(laptopId);
      return;
    }
    setCartItems(prev => 
      prev.map(item => 
        item.laptop.id === laptopId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (laptopId: string) => {
    setCartItems(prev => prev.filter(item => item.laptop.id !== laptopId));
  };

  // Helper trigger called inside SuccessView upon completion
  const handleClearCart = () => {
    setCartItems([]);
  };

  // 6. Checkout Payment Trigger
  const handleCheckoutSubmit = async (customerName: string, customerEmail: string) => {
    try {
      setIsCheckoutLoading(true);

      const token = await getAccessToken();
      if (!user || !token || !spreadsheetId) {
        // Force log-in if checkouts occur unauthorized
        alert("Please authorize Google Sheets Database Connection to host secure payments.");
        await handleLogin();
        setIsCheckoutLoading(false);
        return;
      }

      // Proxy payload
      const checkoutPayload = {
        items: cartItems.map(item => ({
          laptopId: item.laptop.id,
          brand: item.laptop.brand,
          name: item.laptop.name,
          price: item.laptop.basePrice,
          quantity: item.quantity,
          cpu: item.laptop.cpu,
          ram: item.laptop.ram,
          storage: item.laptop.storage
        })),
        customerName,
        customerEmail,
        spreadsheetId,
        accessToken: token
      };

      const stripeSessionRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });

      if (!stripeSessionRes.ok) {
        throw new Error('Connection to gateway failed.');
      }

      const session = await stripeSessionRes.json();
      if (session.url) {
        // Seamlessly redirects to Stripe Checkout or Sandbox Card Portal
        window.location.href = session.url;
      } else {
        throw new Error('No redirection route supplied.');
      }
    } catch (err: any) {
      console.error("Checkout initiation issue", err);
      alert(err.message || "Failed initializing payment gateway session.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // 7. Filtered and Sorted products
  const getFilteredLaptops = () => {
    let list = [...laptops];
    
    // Brand category filter
    if (brandFilter !== 'all') {
      list = list.filter(l => l.brand.toLowerCase() === brandFilter.toLowerCase());
    }

    // Sort strategy
    if (sortBy === 'priceAsc') {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'stock') {
      list.sort((a, b) => b.stockLevel - a.stockLevel);
    }

    return list;
  };

  // Sandbox payment confirmation webhook simulation trigger
  const handleCompleteSandboxPayment = () => {
    if (!sandboxParams) return;
    
    // Simulates redirects to CheckoutSuccess passing exact params
    const hostUrl = window.location.origin;
    const itemsEncoded = encodeURIComponent(JSON.stringify(sandboxParams.items));
    const tokenEncoded = encodeURIComponent(sandboxParams.accessToken);
    const nameEncoded = encodeURIComponent(sandboxParams.customerName);
    const emailEncoded = encodeURIComponent(sandboxParams.customerEmail);

    window.location.href = `${hostUrl}/checkout-success?sessionId=SANDBOX-TRX-${Date.now().toString().slice(-4)}&spreadsheetId=${sandboxParams.spreadsheetId}&accessToken=${tokenEncoded}&customerName=${nameEncoded}&customerEmail=${emailEncoded}&items=${itemsEncoded}`;
  };

  return (
    <div className="min-h-screen bg-stone-50/50 font-sans text-gray-900 selection:bg-black selection:text-white">
      {/* Navigation Headers */}
      <Navbar
        user={user}
        sheetUrl={spreadsheetUrl}
        syncStatus={syncStatus}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => {
          if (!user) handleLogin();
          else setActiveView('admin');
        }}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isStripeConfigured={isStripeConfigured}
        activeView={activeView}
        onSetView={(view) => setActiveView(view)}
        onManualSync={handleManualSync}
      />

      {/* Main Viewport Routing router-state rendering */}
      <main className="pb-24">
        {activeView === 'store' && (
          <div>
            {/* Elegant Hero Banner Stage */}
            <div className="relative py-14 sm:py-20 overflow-hidden border-b border-gray-100 bg-white">
              <div className="absolute inset-0 select-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
              
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center space-x-1.5 rounded-full bg-stone-50 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700 font-mono mb-4 shadow-3xs"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-stone-500 animate-pulse" />
                  <span>Interactive Real-time Google Sheet Syncing</span>
                </motion.div>

                <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl md:max-w-3xl mx-auto leading-tight">
                  High-Performance Laptops. <br />
                  <span className="text-gray-500">Dual-Synced Cloud DB.</span>
                </h1>
                
                <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-gray-500 leading-relaxed font-sans">
                  Configure corporate laptops instantly. Powered by Google Sheets for decentralized inventory records, backed by high-fidelity Stripe payment checkout loops.
                </p>

                {/* DB Info banner for unauthorized customers */}
                {!user && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLogin}
                      className="flex items-center space-x-2 rounded-xl bg-gray-950 px-5.5 py-3 text-xs font-bold text-white shadow-md hover:bg-gray-900 transition-all hover:scale-102 active:scale-98"
                    >
                      <Database className="h-4.5 w-4.5" />
                      <span>Link Your Google Sheet Database Now</span>
                    </button>
                  </div>
                )}
                {user && spreadsheetUrl && (
                  <div className="mt-8 flex justify-center items-center gap-3 flex-wrap">
                    <div className="flex items-center space-x-2 rounded-xl border border-gray-150 bg-stone-50/50 px-4 py-2 text-xs font-medium text-gray-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span>Connected to spreadsheet</span>
                    </div>
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="no-referrer"
                      className="flex items-center space-x-1 text-xs font-bold text-gray-950 hover:underline"
                    >
                      <span>View DB Spreadsheet</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Catalog Content Stage */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              {/* Toolbar Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
                {/* Brand selection filters */}
                <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                  <Filter className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
                  {['all', 'Aero', 'Helix', 'Matrix'].map(brand => (
                    <button
                      key={brand}
                      onClick={() => setBrandFilter(brand)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all ${
                        brandFilter === brand
                          ? 'bg-gray-950 text-white font-bold shadow-xs'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {brand === 'all' ? 'All Brands' : brand}
                    </button>
                  ))}
                </div>

                {/* Sorter Selector */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-black transition-colors"
                  >
                    <option value="default">Default Catalog</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="stock">Stock Level: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Laptops grid list */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {getFilteredLaptops().map(laptop => (
                  <LaptopCard
                    key={laptop.id}
                    laptop={laptop}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'admin' && user && (
          <AdminPanel
            spreadsheetId={spreadsheetId}
            sheetUrl={spreadsheetUrl}
            orders={orders}
            laptops={laptops}
            syncStatus={syncStatus}
            onManualSync={handleManualSync}
            isStripeConfigured={isStripeConfigured}
          />
        )}

        {activeView === 'sandbox' && sandboxParams && (
          <SandboxPayment
            customerName={sandboxParams.customerName}
            customerEmail={sandboxParams.customerEmail}
            totalAmount={sandboxParams.totalAmount}
            items={sandboxParams.items}
            onCompletePayment={handleCompleteSandboxPayment}
          />
        )}

        {activeView === 'success' && successParams && (
          <SuccessView
            spreadsheetId={successParams.spreadsheetId}
            accessToken={successParams.accessToken}
            customerName={successParams.customerName}
            customerEmail={successParams.customerEmail}
            items={successParams.items}
            sessionId={successParams.sessionId}
            laptops={laptops}
            onClearCart={handleClearCart}
            onNavigateToStore={() => {
              setActiveView('store');
              // Clear URL search params without reload
              window.history.replaceState({}, document.title, "/");
            }}
            onRefreshLaptops={async () => {
              await syncSheetDatabase(successParams.accessToken, successParams.spreadsheetId);
            }}
          />
        )}
      </main>

      {/* Slide-out Cart Drawer Screen rendering */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckoutSubmit}
        isCheckoutLoading={isCheckoutLoading}
        user={user}
      />
    </div>
  );
}
