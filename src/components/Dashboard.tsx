import { useState, useEffect } from 'react';
import { LogOut, TrendingUp, Receipt, DollarSign, Download, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ExpenseForm from './ExpenseForm';
import Sidebar from './Sidebar';
import RecentExpenses from './RecentExpenses';
import api from '../lib/axios';
import { DashboardStats } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    fetchStats();
    const onUpdated = () => fetchStats();
    window.addEventListener('expenses:updated', onUpdated as EventListener);
    return () => window.removeEventListener('expenses:updated', onUpdated as EventListener);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      const payload = response.data?.data ?? response.data;
      setStats(payload);
    } catch (err) {
      notify('error', 'Failed to load dashboard stats');
    }
  };

  const handleExport = async () => {
    try {
      notify('info', 'Preparing export...');
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
      notify('success', 'Expenses exported successfully');
    } catch (err) {
      notify('error', 'Failed to export expenses');
    }
  };

  const handleFormSuccess = () => {
    fetchStats();
    setShowForm(false);
  };

  const handleShowForm = () => {
    setShowForm(true);
    // Small delay to ensure the form is rendered before scrolling
    setTimeout(() => {
      const formElement = document.querySelector('[data-form="expense-form"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
                  onClick={handleShowForm}
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
              <div data-form="expense-form">
                <ExpenseForm
                  onSuccess={handleFormSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
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
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />
      
      {/* Main Content - Always have left margin on desktop */}
      <div className="lg:ml-64 min-h-screen transition-all duration-300">
        {/* Header - Fixed with proper z-index */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="lg:hidden flex items-center gap-3">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">The Billman</h1>
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

        {/* Page Content - Add top padding to account for fixed header */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}