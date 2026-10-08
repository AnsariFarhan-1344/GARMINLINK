import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Store, 
  TrendingUp, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import { StaticMapEmbed } from '../components/map/StaticMapEmbed';

export const MarketsPage: React.FC = () => {
  const { t } = useLanguage();

  const apmcMandiPrices = [
    { crop: 'Ratnagiri Alphonso Mango (A-Grade)', mandi: 'Chiplun / Vashi APMC', modalPrice: '₹1,200 / Dozen', trend: '+8%' },
    { crop: 'Raw Organic Cashew Nuts', mandi: 'Khed APMC Yard', modalPrice: '₹145 / kg', trend: '+4%' },
    { crop: 'Thompson Seedless Grapes (Export)', mandi: 'Nashik APMC Mandi', modalPrice: '₹85 / kg', trend: '+12%' },
    { crop: 'Dried Mackerel & Prawns', mandi: 'Harnai / Ratnagiri Bunder', modalPrice: '₹380 / kg', trend: '+2%' },
    { crop: 'Konkan Kokum Concentrate Syrup', mandi: 'Panvel Agro Terminal', modalPrice: '₹220 / Liter', trend: '+6%' },
    { crop: 'Warli Handcrafted Bamboo Lamps', mandi: 'Mumbai Artisan Emporium', modalPrice: '₹650 / Piece', trend: '+15%' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Market Network Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#E7EBD9] text-forest border border-rural-border">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              APMC Mandi Rates & Wholesale Directory
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Live market indices, wholesale auction yards, and direct procurement links across Maharashtra.
            </p>
          </div>
        </div>
      </div>

      {/* APMC PRICE TICKER CARDS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-forest" />
          <span>Today's Real-Time APMC Mandi Benchmark Prices</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apmcMandiPrices.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-6 rounded-2xl border border-rural-border shadow-sm space-y-2 hover:border-forest/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy truncate">{item.crop}</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {item.trend}
                </span>
              </div>

              <div className="text-2xl font-black text-gold font-display">
                {item.modalPrice}
              </div>

              <div className="text-xs text-rural-muted flex items-center gap-1.5 pt-1 border-t border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-forest" />
                <span>{item.mandi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* APMC MANDI LOCATIONS WITH STATIC GOOGLE MAPS EMBED */}
      <div className="space-y-4 pt-4 border-t border-rural-border">
        <div>
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Store className="w-4 h-4 text-forest" />
            <span>Major APMC Mandis & Terminal Locations</span>
          </h2>
          <p className="text-xs text-rural-muted mt-0.5">
            Key auction yards and wholesale hubs with live Google Maps previews and directions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-forest px-2 py-0.5 rounded-full bg-soft-green">
                  MANDI-APMC-01
                </span>
                <h3 className="font-bold text-navy text-sm mt-1.5">APMC Vashi Wholesale Terminal</h3>
                <p className="text-xs text-rural-muted">Sector 19, Turbhe / Vashi, Navi Mumbai</p>
              </div>
            </div>
            <StaticMapEmbed 
              address="APMC Market, Sector 19, Vashi, Navi Mumbai, Maharashtra 400705" 
              title="APMC Vashi" 
              height={140} 
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-forest px-2 py-0.5 rounded-full bg-soft-green">
                  MANDI-APMC-02
                </span>
                <h3 className="font-bold text-navy text-sm mt-1.5">Nashik Central APMC Subzi Yard</h3>
                <p className="text-xs text-rural-muted">Panchavati Yard, Nashik, Maharashtra</p>
              </div>
            </div>
            <StaticMapEmbed 
              address="APMC Market Yard, Panchavati, Nashik, Maharashtra 422003" 
              title="APMC Nashik" 
              height={140} 
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-forest px-2 py-0.5 rounded-full bg-soft-green">
                  MANDI-APMC-03
                </span>
                <h3 className="font-bold text-navy text-sm mt-1.5">Chiplun Regional APMC Yard</h3>
                <p className="text-xs text-rural-muted">Bahadur Shaikh Naka, Chiplun, Ratnagiri</p>
              </div>
            </div>
            <StaticMapEmbed 
              address="APMC Market, Bahadur Shaikh Naka, Chiplun, Maharashtra 415605" 
              title="Chiplun APMC" 
              height={140} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
