/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Laptop, Order } from '../types';

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

const DB_TITLE = 'Laptop Store - Real-time Inventory DB';

/**
 * Clean helper to verify responses and report issues
 */
async function handleResponse(response: Response, actionText: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || response.statusText;
    throw new Error(`Failed to ${actionText}: ${message}`);
  }
  return response.json();
}

/**
 * Check if the DB sheet exists in the user's Drive. If so, return metadata, otherwise create it.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<{ id: string, name: string, url: string }> {
  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(DB_TITLE)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const listData = await handleResponse(listRes, 'search spreadsheet in Drive');

    if (listData.files && listData.files.length > 0) {
      const file = listData.files[0];
      return { id: file.id, name: file.name, url: file.webViewLink };
    }

    // Creating sheet from scratch
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: DB_TITLE
        },
        sheets: [
          { properties: { title: 'Inventory' } },
          { properties: { title: 'Orders' } }
        ]
      })
    });
    const spreadsheet = await handleResponse(createRes, 'create spreadsheet');
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Initialize with default sample inventory and orders header
    await initializeSheetData(accessToken, spreadsheetId);

    return { id: spreadsheetId, name: DB_TITLE, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error in findOrCreateSpreadsheet:', error);
    throw error;
  }
}

/**
 * Populates header rows and default stock laptops in Sheets
 */
async function initializeSheetData(accessToken: string, spreadsheetId: string) {
  const inventoryHeader = [
    'ID', 'Name', 'Brand', 'CPU', 'RAM', 'Storage', 'GPU', 'Specifications', 'Base Price', 'Image URL', 'Stock Level'
  ];

  const inventoryRows = [
    inventoryHeader,
    ...DEFAULT_LAPTOPS.map(laptop => [
      laptop.id,
      laptop.name,
      laptop.brand,
      laptop.cpu,
      laptop.ram,
      laptop.storage,
      laptop.gpu,
      laptop.specifications,
      laptop.basePrice.toString(),
      laptop.imageUrl,
      laptop.stockLevel.toString()
    ])
  ];

  const ordersHeader = [
    'Order ID', 'Customer Name', 'Customer Email', 'Laptop ID', 'Laptop Name', 'Quantity', 'Total Price', 'Payment Status', 'Date'
  ];

  const ordersRows = [ordersHeader];

  // Store batch values update
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Inventory!A1',
          values: inventoryRows
        },
        {
          range: 'Orders!A1',
          values: ordersRows
        }
      ]
    })
  });

  await handleResponse(updateRes, 'initialize spreadsheets data');
}

/**
 * Fetch all products from 'Inventory' sheet
 */
export async function fetchLaptops(accessToken: string, spreadsheetId: string): Promise<Laptop[]> {
  const range = 'Inventory!A1:K100'; // Reads up to 100 laptops
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await handleResponse(res, 'fetch inventory data');

  if (!data.values || data.values.length <= 1) {
    return [];
  }

  const rows = data.values;
  const headers = rows[0];

  return rows.slice(1).map((row: string[]) => {
    // Map headers dynamically to tolerate manual shifts, defaulting to index fallback
    const getVal = (headerName: string, defaultIdx: number): string => {
      const idx = headers.indexOf(headerName);
      return idx !== -1 ? (row[idx] ?? '') : (row[defaultIdx] ?? '');
    };

    return {
      id: getVal('ID', 0),
      name: getVal('Name', 1),
      brand: getVal('Brand', 2),
      cpu: getVal('CPU', 3),
      ram: getVal('RAM', 4),
      storage: getVal('Storage', 5),
      gpu: getVal('GPU', 6),
      specifications: getVal('Specifications', 7),
      basePrice: parseFloat(getVal('Base Price', 8)) || 0,
      imageUrl: getVal('Image URL', 9),
      stockLevel: parseInt(getVal('Stock Level', 10)) || 0
    };
  });
}

/**
 * Fetch orders history from 'Orders' sheet
 */
export async function fetchOrders(accessToken: string, spreadsheetId: string): Promise<Order[]> {
  const range = 'Orders!A1:I500';
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await handleResponse(res, 'fetch orders history');

  if (!data.values || data.values.length <= 1) {
    return [];
  }

  const rows = data.values;
  const headers = rows[0];

  return rows.slice(1).map((row: string[]) => {
    const getVal = (headerName: string, defaultIdx: number): string => {
      const idx = headers.indexOf(headerName);
      return idx !== -1 ? (row[idx] ?? '') : (row[defaultIdx] ?? '');
    };

    return {
      id: getVal('Order ID', 0),
      customerName: getVal('Customer Name', 1),
      customerEmail: getVal('Customer Email', 2),
      laptopId: getVal('Laptop ID', 3),
      laptopName: getVal('Laptop Name', 4),
      quantity: parseInt(getVal('Quantity', 5)) || 1,
      totalPrice: parseFloat(getVal('Total Price', 6)) || 0,
      paymentStatus: (getVal('Payment Status', 7) as 'Pending' | 'Paid' | 'Failed') || 'Pending',
      date: getVal('Date', 8)
    };
  });
}

/**
 * Updates stock levels for a list of items using a highly precise cell lookup or matching.
 * In React runtime, we fetch the inventory rows first to locate the ID accurately, then update that row.
 */
export async function updateInventoriesAfterSale(
  accessToken: string,
  spreadsheetId: string,
  itemsToUpdate: { laptopId: string; newStock: number }[]
): Promise<void> {
  const range = 'Inventory!A1:K100';
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await handleResponse(res, 'find laptop rows to update stock');

  if (!data.values) return;

  const rows = data.values;
  const headers = rows[0];
  const idIdx = headers.indexOf('ID');
  const stockIdx = headers.indexOf('Stock Level');

  if (idIdx === -1 || stockIdx === -1) {
    throw new Error('Spreadsheet structure was modified. "ID" and "Stock Level" headers must exist.');
  }

  // Create update payload for each laptop matched
  const dataUpdates = [];

  for (const item of itemsToUpdate) {
    // Find row
    const rowNum = rows.findIndex((row: string[]) => row[idIdx] === item.laptopId) + 1; // 1-based index
    if (rowNum > 1) {
      // Stock column letter mapping
      const colLetter = String.fromCharCode(65 + stockIdx); // A, B, C...
      const cellRange = `Inventory!${colLetter}${rowNum}`;

      dataUpdates.push({
        range: cellRange,
        values: [[item.newStock.toString()]]
      });
    }
  }

  if (dataUpdates.length > 0) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates
      })
    });
    await handleResponse(updateRes, 'batch update inventory stock levels');
  }
}

/**
 * Add a record of a confirmed transaction/order to the 'Orders' sheet
 */
export async function appendOrderRecord(
  accessToken: string,
  spreadsheetId: string,
  order: Order
): Promise<void> {
  const range = 'Orders!A:I';
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const orderRow = [
    order.id,
    order.customerName,
    order.customerEmail,
    order.laptopId,
    order.laptopName,
    order.quantity.toString(),
    order.totalPrice.toString(),
    order.paymentStatus,
    order.date
  ];

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [orderRow]
    })
  });

  await handleResponse(res, 'append order log to Google sheet');
}
