'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Chart types
interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface LazyPieChartProps {
  data: CategoryData[];
}

// Loading component
const PieChartLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Pie Chart yükleniyor...</p>
      <p className="text-sm text-gray-500 mt-1">Kategori verisi görselleştiriliyor</p>
    </div>
  </div>
);

// Direct import wrapped in dynamic component
const RechartsPieChart = dynamic(
  () => import('recharts').then(mod => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = mod;
    
    const PieChartComponent = ({ data }: { data: CategoryData[] }) => (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#2563eb"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
    
    return { default: PieChartComponent };
  }),
  { loading: () => <PieChartLoading />, ssr: false }
);

const LazyPieChart: React.FC<LazyPieChartProps> = ({ data }) => {
  return (
    <div className="h-64">
      <RechartsPieChart data={data} />
    </div>
  );
};

export default LazyPieChart;