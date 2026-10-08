import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Filter, 
  DollarSign, 
  Truck, 
  Leaf, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { mockDistrictAnalytics, mockMonthlyTrends } from '../data/mockData';

export const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const COLORS = ['#556B2F', '#263238', '#C59D5F', '#60706A', '#82985B', '#607D8B'];

  const categoryDistribution = [
    { name: 'Processed Food & Snacks', value: 38 },
    { name: 'Fresh Fruits (Mango, Grapes)', value: 24 },
    { name: 'Fisheries & Marine', value: 16 },
    { name: 'Handicrafts & Artisans', value: 12 },
    { name: 'Dairy & Vegetables', value: 10 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Analytics Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Logistics Impact & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Cost reduction metrics, fleet capacity utilization, and carbon emissions across Maharashtra.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-rural-border text-navy shadow-sm outline-none"
          >
            <option value="ALL">All Districts (Maharashtra)</option>
            <option value="Ratnagiri">Ratnagiri</option>
            <option value="Nashik">Nashik</option>
            <option value="Raigad">Raigad</option>
            <option value="Palghar">Palghar</option>
            <option value="Pune">Pune</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-rural-border text-navy shadow-sm outline-none"
          >
            <option value="ALL">All Goods Categories</option>
            <option value="PROCESSED_FOOD">Processed Food</option>
            <option value="FRUITS">Fresh Fruits</option>
            <option value="FISHERIES">Fisheries</option>
            <option value="HANDICRAFTS">Handicrafts</option>
          </select>
        </div>
      </div>

      {/* TOP AGGREGATE IMPACT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Total Freight Savings</span>
          <div className="text-3xl font-black text-gold font-display mt-1">₹42.8 Lakh</div>
          <span className="text-[12px] text-forest font-medium mt-1 block">58.4% average reduction</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Total Weight Moved</span>
          <div className="text-3xl font-black text-navy font-display mt-1">280.5 Tons</div>
          <span className="text-[12px] text-rural-muted mt-1 block">Consolidated rural cargo</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Fleet Utilization Rate</span>
          <div className="text-3xl font-black text-forest font-display mt-1">84.6%</div>
          <span className="text-[12px] text-forest font-medium mt-1 block">+52% vs unpooled tempos</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Empty Return Reduction</span>
          <div className="text-3xl font-black text-gold font-display mt-1">88.2%</div>
          <span className="text-[12px] text-rural-muted mt-1 block">Via return cargo matching</span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Monthly Shipments & Savings Growth */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest" />
              <span>Monthly Shipments & Pooling Adoption (Apr - Sep)</span>
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyTrends}>
                <defs>
                  <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#556B2F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#556B2F" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorPooled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#263238" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#263238" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9DED0" />
                <XAxis dataKey="month" stroke="#60706A" fontSize={11} />
                <YAxis stroke="#60706A" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D9DED0', borderRadius: '0.75rem', fontSize: '12px', color: '#263238' }}
                />
                <Area type="monotone" dataKey="totalShipments" name="Total Shipments" stroke="#556B2F" fillOpacity={1} fill="url(#colorShipments)" strokeWidth={2} />
                <Area type="monotone" dataKey="pooledShipments" name="Pooled Shipments" stroke="#263238" fillOpacity={1} fill="url(#colorPooled)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: District-Wise Cost Savings */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-forest" />
              <span>District-Wise Cost Savings (₹ in Lakhs)</span>
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDistrictAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9DED0" />
                <XAxis dataKey="district" stroke="#60706A" fontSize={11} />
                <YAxis stroke="#60706A" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D9DED0', borderRadius: '0.75rem', fontSize: '12px', color: '#263238' }}
                />
                <Bar dataKey="costSavedRs" name="Savings (₹)" fill="#556B2F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Cargo Category Distribution */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-forest" />
              <span>Rural Cargo Category Distribution</span>
            </h3>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D9DED0', borderRadius: '0.75rem', fontSize: '12px', color: '#263238' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Return Trip Empty Leg Reduction */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-forest" />
              <span>Empty Return Trip Reduction Rate (%)</span>
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyTrends}>
                <defs>
                  <linearGradient id="colorDeadhead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C59D5F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C59D5F" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9DED0" />
                <XAxis dataKey="month" stroke="#60706A" fontSize={11} />
                <YAxis stroke="#60706A" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D9DED0', borderRadius: '0.75rem', fontSize: '12px', color: '#263238' }}
                />
                <Area type="monotone" dataKey="deadheadReducedPct" name="Empty Trips Eliminated %" stroke="#C59D5F" fillOpacity={1} fill="url(#colorDeadhead)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
