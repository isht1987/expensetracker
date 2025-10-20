import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import api from '../lib/axios';
import { useNotification } from '../contexts/NotificationContext';

interface MonthlyData {
  month: string;
  month_number: number;
  total: number;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface DashboardStats {
  monthly_trend: MonthlyData[];
  category_breakdown: CategoryData[];
  top_categories?: CategoryData[];
  current_year: {
    total: number;
    count: number;
  };
  current_month?: {
    total: number;
    count: number;
    month_name: string;
  };
  previous_month?: {
    total: number;
    count: number;
    month_name?: string;
  };
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
];

export default function Analytics() {
  const { notify } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'year' | 'quarter' | 'month'>('year');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/dashboard/stats/');
      const payload = response.data?.data ?? response.data;
      setStats(payload);
    } catch (err) {
      notify('error', 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const monthlyData = stats.monthly_trend || [];
  const categoryData = stats.category_breakdown || stats.top_categories || [];
  
  // Calculate insights
  const currentMonthTotal = stats.current_month?.total || monthlyData[monthlyData.length - 1]?.total || 0;
  const previousMonthTotal = stats.previous_month?.total || monthlyData[monthlyData.length - 2]?.total || 0;
  const monthChangePercent = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;
  const isIncreasing = monthChangePercent > 0;

  // Calculate average daily spending
  const avgDailySpend = stats.current_year.total / 365;

  // Get filtered data based on timeFilter
  const getFilteredData = () => {
    if (timeFilter === 'quarter') {
      return monthlyData.slice(-3);
    } else if (timeFilter === 'month') {
      return monthlyData.slice(-1);
    }
    return monthlyData;
  };

  const filteredData = getFilteredData();

  // Custom label for mobile-friendly pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Financial Analytics</h2>
        <div className="flex gap-2 bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'month'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeFilter('quarter')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'quarter'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quarter
          </button>
          <button
            onClick={() => setTimeFilter('year')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'year'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-emerald-900">Total Spent (Year)</h3>
            <div className="p-2 bg-emerald-200 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">${Number(stats.current_year.total || 0).toFixed(2)}</div>
          <p className="text-xs text-emerald-700 mt-2">{stats.current_year.count || 0} transactions</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-900">Avg per Month</h3>
            <div className="p-2 bg-blue-200 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">${Number((stats.current_year.total / 12) || 0).toFixed(2)}</div>
          <p className="text-xs text-blue-700 mt-2">Monthly average</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-orange-900">Daily Average</h3>
            <div className="p-2 bg-orange-200 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900">${avgDailySpend.toFixed(2)}</div>
          <p className="text-xs text-orange-700 mt-2">Per day spending</p>
        </div>

        <div className={`bg-gradient-to-br ${isIncreasing ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'} rounded-xl shadow-sm border p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${isIncreasing ? 'text-red-900' : 'text-green-900'}`}>Month Trend</h3>
            <div className={`p-2 ${isIncreasing ? 'bg-red-200' : 'bg-green-200'} rounded-lg`}>
              {isIncreasing ? (
                <ArrowUpRight className={`h-4 w-4 ${isIncreasing ? 'text-red-700' : 'text-green-700'}`} />
              ) : (
                <ArrowDownRight className={`h-4 w-4 text-green-700`} />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold ${isIncreasing ? 'text-red-900' : 'text-green-900'}`}>
            {isIncreasing ? '+' : ''}{monthChangePercent.toFixed(1)}%
          </div>
          <p className={`text-xs ${isIncreasing ? 'text-red-700' : 'text-green-700'} mt-2`}>vs last month</p>
        </div>
      </div>

      {/* Monthly Trend Chart - Area Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Spending Trend</h3>
          <p className="text-sm text-slate-500 mt-1">Your spending pattern over time</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#10b981" 
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="Monthly Spending"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Spending by Category</h3>
            <p className="text-sm text-slate-500 mt-1">Top categories breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                dataKey="category"
                type="category"
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#64748b' }}
                width={100}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => `$${Number(value).toFixed(2)}`}
              />
              <Bar 
                dataKey="total" 
                fill="#3b82f6" 
                radius={[0, 8, 8, 0]}
                name="Total Spent"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Mobile Responsive */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Category Distribution</h3>
            <p className="text-sm text-slate-500 mt-1">Proportion of spending</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="total"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend for mobile */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-slate-600 truncate">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Top Spending Categories</h3>
          <p className="text-sm text-slate-500 mt-1">Detailed breakdown of your expenses</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Category</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((item, index) => {
                const percentage = (item.total / stats.current_year.total) * 100;
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-slate-800">{item.category}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-sm text-slate-600">{item.count || 0}</td>
                    <td className="text-right py-3 px-4 text-sm font-semibold text-slate-800">
                      ${Number(item.total).toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">💡 Quick Insights</h3>
          <ul className="space-y-2">
            <li className="text-sm text-purple-800">
              • Your top category is <strong>{categoryData[0]?.category || 'N/A'}</strong> with ${Number(categoryData[0]?.total || 0).toFixed(2)}
            </li>
            <li className="text-sm text-purple-800">
              • You spend an average of <strong>${avgDailySpend.toFixed(2)}</strong> per day
            </li>
            <li className="text-sm text-purple-800">
              • Total transactions this year: <strong>{stats.current_year.count}</strong>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200 p-6">
          <h3 className="text-lg font-semibold text-cyan-900 mb-3">📊 Spending Habits</h3>
          <ul className="space-y-2">
            <li className="text-sm text-cyan-800">
              • Your spending is {isIncreasing ? 'increasing' : 'decreasing'} by <strong>{Math.abs(monthChangePercent).toFixed(1)}%</strong>
            </li>
            <li className="text-sm text-cyan-800">
              • Top 3 categories account for <strong>{((categoryData.slice(0, 3).reduce((sum, cat) => sum + cat.total, 0) / stats.current_year.total) * 100).toFixed(1)}%</strong> of spending
            </li>
            <li className="text-sm text-cyan-800">
              • Average transaction: <strong>${(stats.current_year.total / stats.current_year.count).toFixed(2)}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}