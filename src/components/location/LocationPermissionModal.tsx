import React from 'react';
import { useUserLocation, MAHARASHTRA_VILLAGES } from '../../context/LocationContext';
import { MapPin, Navigation, Compass, X, Check, ShieldCheck } from 'lucide-react';

export const LocationPermissionModal: React.FC = () => {
  const {
    showPermissionModal,
    setShowPermissionModal,
    requestLiveGps,
    setVillage,
    setDemoDapoli,
    locationMode,
    locationName,
    permissionStatus
  } = useUserLocation();

  if (!showPermissionModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden text-navy">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-forest to-forest-dark p-6 text-white text-center relative">
          <button
            onClick={() => setShowPermissionModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex p-3 rounded-2xl bg-white/15 backdrop-blur-md mb-3 border border-white/20">
            <Compass className="w-8 h-8 text-cream animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-display">
            📍 अचूक पिकअपसाठी लोकेशन चालू करा
          </h2>
          <p className="text-xs text-cream-200 mt-1">
            Enable Live Location for Fair Transport Matching
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-earth-700 leading-relaxed text-center">
            ग्रामीणलिंक तुमच्या गावातील जवळच्या गाड्या शोधण्यासाठी आणि अचूक वाहतूक खर्च काढण्यासाठी स्थान वापरते.
            <br />
            <span className="text-xs text-earth-500 mt-1 block">
              We use your device GPS to pinpoint your exact pickup point, calculate real distance, and sort nearest available transporters.
            </span>
          </p>

          <div className="space-y-3">
            {/* Primary Action: High Accuracy GPS */}
            <button
              onClick={requestLiveGps}
              className="w-full py-3.5 px-4 rounded-2xl bg-forest hover:bg-forest-dark text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 group"
            >
              <Navigation className="w-4 h-4 text-haldi group-hover:scale-110 transition" />
              <span>
                {permissionStatus === 'LOCATING' ? 'स्थान शोधत आहे... (Locating...)' : 'Allow Live GPS (High Accuracy)'}
              </span>
            </button>

            {/* Secondary Action: Demo Dapoli */}
            <button
              onClick={() => {
                setDemoDapoli();
                setShowPermissionModal(false);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-cream-100 hover:bg-cream-200 text-forest-dark font-semibold text-xs border border-cream-300 transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-terracotta" />
              <span>Use Demo Location (Dapoli, Ratnagiri)</span>
            </button>
          </div>

          {/* Village Dropdown Fallback */}
          <div className="pt-3 border-t border-cream-200">
            <label className="block text-xs font-bold text-earth-700 mb-1.5">
              किंवा गाव निवडा (Or select village manually):
            </label>
            <select
              defaultValue="Dapoli"
              onChange={(e) => {
                setVillage(e.target.value);
                setShowPermissionModal(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-cream-300 bg-earth-50 text-xs text-navy font-medium focus:ring-2 focus:ring-forest focus:outline-none"
            >
              {MAHARASHTRA_VILLAGES.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.taluka}, {v.district})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-earth-500">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <span>गोपनीयता सुरक्षित • Coordinates never shared with third parties</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
