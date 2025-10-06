import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Calendar, DollarSign, X, Receipt } from 'lucide-react';
import api from '../lib/axios';
import { Expense } from '../types';

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder]);

  const fetchExpenses = async () => {
    try {
  const response = await api.get('/expenses/');
      let payload: any = response.data;
      if (payload && typeof payload === 'object') {
        if (Array.isArray(payload)) {
          // fine
        } else if (Array.isArray(payload.data)) {
          payload = payload.data;
        } else if (Array.isArray(payload.results)) {
          payload = payload.results;
        } else if (Array.isArray(payload.items)) {
          payload = payload.items;
        } else {
          console.warn('Unexpected expenses payload shape', payload);
          payload = [];
        }
      }
      setExpenses(payload);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryLabel(expense).toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => getCategoryLabel(expense) === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case 'category':
          comparison = getCategoryLabel(a).localeCompare(getCategoryLabel(b));
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredExpenses(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/expenses/${id}/`);
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const openImageModal = (imageUrl: string) => {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    const abs = imageUrl && !/^https?:\/\//i.test(imageUrl) ? `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}` : imageUrl;
    setModalImage(abs || null);
    setModalOpen(true);
  };
  const getCategoryLabel = (expense: Expense) => {
    // Support various shapes returned by backend
    // Preference order:
    // 1. category_display (API-friendly)
    // 2. custom_category (when category is 'Others')
    // 3. category (string)
    // 4. category_name (legacy)
    // 5. nested category.name/title
    // Fall back to 'Uncategorized'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyExp: any = expense as any;
    const candidate = (
      (anyExp.category_display as string) ||
      (anyExp.custom_category as string) ||
      (anyExp.category as string) ||
      (expense.category_name as string) ||
      (anyExp.category && (anyExp.category.name || anyExp.category.title)) ||
      ''
    ).toString();

    const cleaned = candidate.trim();
    if (!cleaned) return 'Uncategorized';
    // Normalize common malformed values
    if (/uncategor/i.test(cleaned)) return 'Uncategorized';
    // Title-case the label (simple)
    return cleaned.split(/\s+/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };

  const FIXED_CATEGORIES = [
    'Fuel Expenses',
    'Car Payments',
    'Insurance',
    'Car Maintenance',
    'Car Repair',
    'Legal Fines',
    'Others',
  ];

  const categories = Array.from(new Set([
    ...FIXED_CATEGORIES,
    ...expenses.map(e => getCategoryLabel(e)).filter(Boolean),
  ]));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Recent Expenses</h1>
          <p className="text-slate-500 mt-1">View and manage all your expense receipts</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="font-medium">{filteredExpenses.length} expenses</span>
          <span className="text-slate-400">•</span>
          <span>${filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)} total</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Expenses Grid */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No expenses found</h3>
          <p className="text-slate-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first expense'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-slate-800">
                      {parseFloat(expense.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                  <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    {getCategoryLabel(expense)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expense.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {expense.description}
                </p>
              )}

              {expense.receipt_image && (
                <div
                  className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => openImageModal(expense.receipt_image as string)}
                >
                  <img
                    src={expense.receipt_image as string}
                    alt="Receipt"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium">
                      Click to view
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {modalOpen && modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 bg-white rounded-full p-2 shadow-lg z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <img 
                src={modalImage} 
                alt="Receipt" 
                className="mx-auto max-h-[80vh] w-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}