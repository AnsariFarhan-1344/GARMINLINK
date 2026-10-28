import React, { createContext, useContext, useState, useCallback } from 'react';
import { PrefilledBookingData, RecommendedVehicleCard, ExtractedCargoRequest } from '../types/assistant';
import { GoodsCategory, DestinationType } from '../types';

interface GaadiSahayakContextType {
  isOpen: boolean;
  openAssistant: (initialText?: string) => void;
  closeAssistant: () => void;
  initialPromptText?: string;
  prefilledBooking: PrefilledBookingData | null;
  setPrefilledBooking: (data: PrefilledBookingData | null) => void;
  clearPrefilledBooking: () => void;
  triggerBookingWithVehicle: (
    card: RecommendedVehicleCard, 
    request: ExtractedCargoRequest,
    onNavigateTab?: (tab: any) => void
  ) => void;
}

const GaadiSahayakContext = createContext<GaadiSahayakContextType | undefined>(undefined);

export const GaadiSahayakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [initialPromptText, setInitialPromptText] = useState<string | undefined>(undefined);
  const [prefilledBooking, setPrefilledBooking] = useState<PrefilledBookingData | null>(null);

  const openAssistant = useCallback((initialText?: string) => {
    setInitialPromptText(initialText);
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setInitialPromptText(undefined);
  }, []);

  const clearPrefilledBooking = useCallback(() => {
    setPrefilledBooking(null);
  }, []);

  const triggerBookingWithVehicle = useCallback((
    card: RecommendedVehicleCard,
    request: ExtractedCargoRequest,
    onNavigateTab?: (tab: any) => void
  ) => {
    let destType: DestinationType = 'TALUKA_HUB';
    const destLower = (request.destination || '').toLowerCase();
    if (destLower.includes('apmc') || destLower.includes('mandi') || destLower.includes('chiplun') || destLower.includes('nashik')) {
      destType = 'MANDI_APMC';
    } else if (destLower.includes('panvel') || destLower.includes('ratnagiri')) {
      destType = 'DISTRICT_HUB';
    }

    const payload: PrefilledBookingData = {
      productName: request.product_original || request.product || 'Produce',
      goodsCategory: (request.category || 'FRUITS') as GoodsCategory,
      weightKg: request.weight_kg || 40,
      destination: request.destination || 'Chiplun APMC Regional Mandi & Cold Hub',
      destinationType: destType,
      vehicleId: card.vehicle.id,
      driverName: card.driverName,
      estimatedCost: card.estimatedCostRs,
      pickupVillage: request.pickup_village || undefined
    };

    setPrefilledBooking(payload);
    setIsOpen(false);

    if (onNavigateTab) {
      onNavigateTab('book_pickup');
    }
  }, []);

  return (
    <GaadiSahayakContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        initialPromptText,
        prefilledBooking,
        setPrefilledBooking,
        clearPrefilledBooking,
        triggerBookingWithVehicle
      }}
    >
      {children}
    </GaadiSahayakContext.Provider>
  );
};

export const useGaadiSahayak = () => {
  const context = useContext(GaadiSahayakContext);
  if (!context) {
    throw new Error('useGaadiSahayak must be used within a GaadiSahayakProvider');
  }
  return context;
};
