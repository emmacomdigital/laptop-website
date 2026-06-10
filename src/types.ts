/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Laptop {
  id: string;
  name: string;
  brand: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  specifications: string;
  basePrice: number;
  imageUrl: string;
  stockLevel: number;
}

export interface CartItem {
  laptop: Laptop;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  laptopId: string;
  laptopName: string;
  quantity: number;
  totalPrice: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  stripeSessionId?: string;
  date: string;
}
