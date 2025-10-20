import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, Receipt, DollarSign, Download, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Sidebar from './Sidebar';
import LogoSvg from '../../logo/Black Logo.svg';
import React, { Suspense } from 'react';

const ExpenseForm = React.lazy(() => import('./ExpenseForm'));
const RecentExpenses = React.lazy(() => import('./RecentExpenses'));
const Analytics = React.lazy(() => import('./Analytics'));

import api from '../lib/axios';
import { DashboardStats } from '../types';

interface CurrentMonthStats {
  month: string;
  month_number: number;
  year: number;
  total_expenses: number;
  count: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentMonthStats, setCurrentMonthStats] = useState<CurrentMonthStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchCurrentMonthStats();
    const onUpdated = () => {
      fetchStats();
      fetchCurrentMonthStats();
    };
    window.addEventListener('expenses:updated', onUpdated as EventListener);
    return () => window.removeEventListener('expenses:updated', onUpdated as EventListener);
  }, []);

  useEffect(() => {
    const path = location.pathname || '';
    if (path.startsWith('/dashboard')) {
      const parts = path.split('/').filter(Boolean);
      const section = parts.length >= 2 ? parts[1] : 'dashboard';
      if (section && section !== activeSection) setActiveSection(section);
    } else {
      if (activeSection !== 'dashboard') setActiveSection('dashboard');
    }
  }, [location.pathname]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const target = section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`;
    navigate(target);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      const payload = response.data?.data ?? response.data;
      setStats(payload);
    } catch (err) {
      notify('error', 'Failed to load dashboard stats');
    }
  };

  const fetchCurrentMonthStats = async () => {
    try {
      const response = await api.get('/expenses/current-month/');
      const payload = response.data?.data ?? response.data;
      setCurrentMonthStats(payload);
    } catch (err) {
      notify('error', 'Failed to load current month stats');
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
    fetchCurrentMonthStats();
    setShowForm(false);
  };

  const handleShowForm = () => {
    setShowForm(true);
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
        return (
          <Suspense fallback={<div className="p-6 text-center">Loading expenses...</div>}>
            <RecentExpenses />
          </Suspense>
        );
      case 'analytics':
      return (
        <Suspense fallback={<div className="p-6 text-center">Loading analytics...</div>}>
          <Analytics />
        </Suspense>
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
            {!showForm && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-800">Welcome back, {user?.username}!</h3>
                    <p className="text-sm md:text-base text-slate-600 mt-1">Click "Add New Expense" to get started.</p>
                  </div>
                </div>
              </div>
            )}

            {stats && currentMonthStats && (
              <div className="space-y-6">
                {/* Top Row: Last Month Transactions & This Month Transactions */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {/* Last Month Transactions */}
                  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
                    <div className="flex flex-col h-full">
                      <p className="text-xs md:text-sm font-medium text-slate-500 mb-3">Last Month Transactions</p>
                      <div className="flex items-end justify-between mt-auto">
                        <p className="text-2xl md:text-3xl font-bold text-slate-800">
                          {(stats as any).previous_month?.count ?? 0}
                        </p>
                        <div className="bg-blue-100 rounded-full p-2 md:p-3">
                          <Receipt className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* This Month Transactions */}
                  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
                    <div className="flex flex-col h-full">
                      <p className="text-xs md:text-sm font-medium text-slate-500 mb-3">This Month Transactions</p>
                      <div className="flex items-end justify-between mt-auto">
                        <p className="text-2xl md:text-3xl font-bold text-slate-800">
                          {currentMonthStats?.count ?? 0}
                        </p>
                        <div className="bg-blue-100 rounded-full p-2 md:p-3">
                          <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Last Month & This Month Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Last Month */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex flex-col h-full">
                      <p className="text-sm font-medium text-slate-500 mb-4">Last Month Amount</p>
                      <div className="flex items-end justify-between mt-auto">
                        <p className="text-3xl font-bold text-slate-800">
                          ${Number((stats as any).previous_month?.total ?? (stats as any).current_year?.total ?? 0).toFixed(2)}
                        </p>
                        <div className="bg-emerald-100 rounded-full p-3">
                          <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* This Month Amount */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex flex-col h-full">
                      <p className="text-sm font-medium text-slate-500 mb-4">This Month Amount</p>
                      <div className="flex items-end justify-between mt-auto">
                        <p className="text-3xl font-bold text-slate-800">
                          ${Number(currentMonthStats.total_expenses).toFixed(2)}
                        </p>
                        <div className="bg-orange-100 rounded-full p-3">
                          <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  onClick={() => handleSectionChange('recent-expenses')}
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

            {showForm && (
              <div data-form="expense-form">
                <Suspense fallback={<div className="p-6 text-center">Loading form...</div>}>
                  <ExpenseForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                  />
                </Suspense>
              </div>
            )}
          </div>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'recent-expenses':
        return 'Recent Expenses';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      <div className="lg:ml-64 min-h-screen transition-all duration-300">
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
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
                  <img src={LogoSvg} alt="The Billman Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">The Billman</h1>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-0.5">
                  <img src={LogoSvg} alt="The Billman Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{getSectionTitle()}</h1>
                  <p className="text-sm text-slate-500">Welcome back, {user?.username}</p>
                </div>
              </div>
              <div className="flex gap-3">
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}