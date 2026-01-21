import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  path?: string;
}

export enum ViewState {
  HOME = 'HOME',
  STORE_VEGAN_EARTH = 'STORE_VEGAN_EARTH',
  STORE_PLAYING_GORILLA = 'STORE_PLAYING_GORILLA',
  STORE_URBAN_VII = 'STORE_URBAN_VII',
  STORE_CHITOS_TOYS = 'STORE_CHITOS_TOYS',
  INVENTORY_OVERVIEW = 'INVENTORY_OVERVIEW',
  INVENTORY_ITEMS = 'INVENTORY_ITEMS',
  SHIPMENTS_OVERVIEW = 'SHIPMENTS_OVERVIEW',
  SHIPMENTS_MANAGE = 'SHIPMENTS_MANAGE',
  USERS = 'USERS',
  CONFIGURATION = 'CONFIGURATION',
}

export type AdjustmentType = 
  | 'Outbound Shipment' 
  | 'Inbound Addition' 
  | 'Damage / Breakage' 
  | 'Manual Correction' 
  | 'Cycle Count Adjustment';

export interface InventoryAdjustment {
  id: string;
  date: Date;
  type: AdjustmentType;
  units: number;
  notes?: string;
  source: 'manual' | 'system';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  shipped?: number;
  reserved: number;
  price: number;
  status: 'In Stock' | 'Stranded' | 'Stockout';
  store: string;
  upc?: string | null;
  description?: string | null;
  image_url?: string | null;
  adjustments?: InventoryAdjustment[];
  metadata?: {
    createdAt: Date;
    lastUpdated: Date;
  };
}

export interface KPIData {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ShipmentProduct {
  id?: string; // DB UUID
  sku: string;
  title: string;
  units: number;
  costPerUnit: number;
  received: number; // Computed locally from receiving lines
}

export interface ReceivingLineItem {
  sku: string;
  units: number;
}

export interface ReceivingLine {
  id: string; // DB UUID
  date: Date;
  products: ReceivingLineItem[];
}

export interface Invoice {
  id?: string;
  name: string;
  url: string;
  uploadedAt: Date;
  file?: File; // For internal processing during upload
}

export type ShipmentStatus = 'Processing' | 'Partially Received' | 'Received';

export interface Shipment {
  uuid: string; // Internal DB Primary Key
  id: string;   // User-entered Shipment ID
  name: string;
  status: ShipmentStatus;
  metadata: {
    createdAt: Date;
  };
  contents: ShipmentProduct[];
  receivingLines: ReceivingLine[];
  invoices: Invoice[];
}