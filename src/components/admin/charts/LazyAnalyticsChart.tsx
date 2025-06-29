'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Recharts types
interface ChartDataPoint {
  name: string;
  products: number;
  visitors: number;
  chats: number;
}

interface LazyAnalyticsChartProps {
  data: ChartDataPoint[];
}

// Loading component
const ChartLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Chart yükleniyor...</p>
      <p className="text-sm text-gray-500 mt-1">Recharts kütüphanesi yükleniyor</p>
    </div>
  </div>
);

// Direct import wrapped in dynamic component
const RechartsChart = dynamic(
  () => import('recharts').then(mod => {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    
    const AreaChartComponent = ({ data }: { data: ChartDataPoint[] }) => (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Area type="monotone" dataKey="visitors" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
          <Area type="monotone" dataKey="chats" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    );
    
    return { default: AreaChartComponent };
  }),
  { loading: () => <ChartLoading />, ssr: false }
);

const LazyAnalyticsChart: React.FC<LazyAnalyticsChartProps> = ({ data }) => {
  return (
    <div className="h-64">
      <RechartsChart data={data} />
    </div>
  );
};

export default LazyAnalyticsChart;