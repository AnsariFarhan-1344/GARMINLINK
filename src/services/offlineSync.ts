// Offline Sync Service for Low Connectivity in Rural Maharashtra
export interface OfflineQueuedShipment {
  id: string;
  trackingNumber: string;
  productName: string;
  weightKg: number;
  pickupLocation: string;
  destination: string;
  category: string;
  timestamp: number;
  syncStatus: 'PENDING_OFFLINE' | 'SYNCED';
  pickupOtp?: string;
  senderName?: string;
}

const STORAGE_KEY = 'graminlink_offline_shipments';

export const getOfflineShipments = (): OfflineQueuedShipment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline shipments:', err);
    return [];
  }
};

export const saveOfflineShipment = (
  shipment: Omit<OfflineQueuedShipment, 'id' | 'timestamp' | 'syncStatus'>
): OfflineQueuedShipment => {
  const list = getOfflineShipments();
  const newEntry: OfflineQueuedShipment = {
    ...shipment,
    id: `OFFLINE-${Date.now()}`,
    timestamp: Date.now(),
    syncStatus: 'PENDING_OFFLINE'
  };
  list.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-shipment-updated'));
  }
  return newEntry;
};

export const syncPendingOfflineShipments = (
  onSync: (shipment: OfflineQueuedShipment) => void
): number => {
  const list = getOfflineShipments();
  let count = 0;
  const updated = list.map((item) => {
    if (item.syncStatus === 'PENDING_OFFLINE') {
      onSync(item);
      count++;
      return { ...item, syncStatus: 'SYNCED' as const };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (count > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-shipment-updated'));
  }
  return count;
};

export const clearSyncedOfflineShipment = (id: string) => {
  const list = getOfflineShipments().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const isAppOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
