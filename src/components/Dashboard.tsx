import { useState, useEffect } from 'react';
import { LogOut, TrendingUp, Receipt, DollarSign, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ExpenseForm from './ExpenseForm';
import Sidebar from './Sidebar';
import RecentExpenses from './RecentExpenses';
import api from '../lib/axios';
import { DashboardStats } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      const payload = response.data?.data ?? response.data;
      setStats(payload);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/export/excel/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting expenses:', err);
    }
  };

  const handleFormSuccess = () => {
    fetchStats();
    setShowForm(false);
  };
  

  const renderContent = () => {
    switch (activeSection) {
      case 'recent-expenses':
        return <RecentExpenses />;
      case 'analytics':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Analytics Coming Soon</h3>
            <p className="text-slate-500">Advanced expense analytics and reports will be available here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Settings</h3>
            <p className="text-slate-500">Account and application settings will be available here.</p>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {typeof (stats as any).current_year?.count !== 'undefined' ? (stats as any).current_year.count : (stats.total_expenses ?? 0)}
                      </p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <Receipt className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Amount</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        ${Number((stats as any).current_year?.total ?? stats.total_amount ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-emerald-100 rounded-full p-3">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">This Month</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        ${Number((stats as any).current_month?.total ?? stats.monthly_total ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-100 rounded-full p-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  <Receipt className="w-5 h-5" />
                  Add New Expense
                </button>
                <button
                  onClick={() => setActiveSection('recent-expenses')}
                  className="flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  View All Expenses
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export Data
                </button>
              </div>
            </div>

            {/* Add Expense Form */}
            {showForm && (
              <ExpenseForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            )}

            {/* Welcome Message */}
            {!showForm && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Welcome back, {user?.username}!</h3>
                    <p className="text-slate-600 mt-1">Ready to track your expenses? Click "Add New Expense" to get started.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="lg:hidden">
                <h1 className="text-xl font-bold text-slate-800">Expense Tracker</h1>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-bold text-slate-800 capitalize">
                  {activeSection.replace('-', ' ')}
                </h1>
                <p className="text-sm text-slate-500">Welcome back, {user?.username}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}