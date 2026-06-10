/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Laptop } from '../types';
import { Cpu, HardDrive, ShoppingCart, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LaptopCardProps {
  laptop: Laptop;
  onAddToCart: (laptop: Laptop) => void;
  key?: React.Key;
}

export default function LaptopCard({ laptop, onAddToCart }: LaptopCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(laptop);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const getStockBadge = (stockNum: number) => {
    if (stockNum === 0) {
      return (
        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
          Out of Stock
        </span>
      );
    }
    if (stockNum <= 5) {
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 animate-pulse">
          Only {stockNum} left!
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {stockNum} In Stock
      </span>
    );
  };

  return (
    <div 
      id={`laptop-card-${laptop.id}`} 
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={laptop.imageUrl}
          alt={laptop.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          <span className="inline-flex items-center rounded-md bg-black/85 px-2.5 py-1 text-[11px] font-bold text-white tracking-widest uppercase">
            {laptop.brand}
          </span>
          {getStockBadge(laptop.stockLevel)}
        </div>

        {/* Floating specification toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm backdrop-blur-sm hover:text-gray-900 hover:bg-white transition-colors"
          title="See detailed specification profile"
        >
          <Info className="h-4 w-4" />
        </button>

        {/* Specs Overlay Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 flex flex-col justify-end bg-black/85 p-4 text-white backdrop-blur-xs"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold font-mono tracking-wider text-gray-300">SYSTEM ARCHITECTURE</p>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-sans line-clamp-3 mb-1">
                {laptop.specifications}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 border-t border-white/10 pt-2 text-[10px] font-medium text-gray-300 font-mono">
                <div>CPU: {laptop.cpu.split(' ').slice(0, 3).join(' ')}</div>
                <div>RAM: {laptop.ram}</div>
                <div>GPU: {laptop.gpu.split(' ').slice(0, 2).join(' ')}</div>
                <div>Storage: {laptop.storage}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Description Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-black line-clamp-1">{laptop.name}</h3>
        </div>

        {/* Key Specs chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center space-x-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 font-mono">
            <Cpu className="h-2.5 w-2.5" />
            <span>{laptop.ram.split(' ')[0]}</span>
          </span>
          <span className="inline-flex items-center space-x-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 font-mono">
            <HardDrive className="h-2.5 w-2.5" />
            <span>{laptop.storage.split(' ')[0]}</span>
          </span>
          <span className="inline-flex items-center rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 font-mono">
            <span>{laptop.gpu.includes('RTX') ? 'RTX GPU' : 'Intel/Radeon'}</span>
          </span>
        </div>

        {/* Short Specs preview text */}
        <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {laptop.specifications}
        </p>

        {/* Price and Cart Call to Action */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Price</span>
            <p className="text-lg font-extrabold text-gray-900 tracking-tight">${laptop.basePrice.toLocaleString()}</p>
          </div>

          <button
            onClick={handleAdd}
            disabled={laptop.stockLevel <= 0}
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 ${
              laptop.stockLevel <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-950 text-white hover:bg-gray-900'
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
