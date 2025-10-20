import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Calendar, DollarSign, X, Receipt, ChevronDown } from 'lucide-react';
import api from '../lib/axios';
import { Expense } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [displayedExpenses, setDisplayedExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState(9);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    setDisplayedExpenses(filteredExpenses.slice(0, itemsToShow));
  }, [filteredExpenses, itemsToShow]);

  const { notify } = useNotification();

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
    } catch (err: any) {
      notify('error', 'Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryLabel(expense).toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => getCategoryLabel(expense) === selectedCategory);
    }

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
    setItemsToShow(ITEMS_PER_PAGE);
  };

  const handleDelete = async (id: number) => {
    setExpenseToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await api.delete(`/expenses/${expenseToDelete}/`);
      notify('success', 'Expense deleted');
      fetchExpenses();
      try { window.dispatchEvent(new Event('expenses:updated')); } catch (e) {}
    } catch (err: any) {
      notify('error', 'Failed to delete expense');
      console.error('Error deleting expense:', err);
    } finally {
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setExpenseToDelete(null);
  };

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_PAGE);
  };

  const openImageModal = (imageUrl: string) => {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    const abs = imageUrl && !/^https?:\/\//i.test(imageUrl) ? `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}` : imageUrl;
    setModalImage(abs || null);
    setModalOpen(true);
  };

  const getCategoryLabel = (expense: Expense) => {
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
    if (/uncategor/i.test(cleaned)) return 'Uncategorized';
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Recent Expenses</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">View and manage all your expense receipts</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <p className="text-xs sm:text-sm text-emerald-700 font-medium mb-1">Total Amount</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
              ${filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Total Transactions</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
              {filteredExpenses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition appearance-none bg-white"
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
            className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Expenses Grid */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">No expenses found</h3>
          <p className="text-sm sm:text-base text-slate-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first expense'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      <span className="text-xl sm:text-2xl font-bold text-slate-800">
                        {parseFloat(expense.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                    <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getCategoryLabel(expense)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {expense.description && (
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-2">
                    {expense.description}
                  </p>
                )}

                {/* Hide image on mobile (< 640px), show on larger screens */}
                {expense.receipt_image && (
                  <div
                    className="hidden sm:block relative aspect-video bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => openImageModal(expense.receipt_image as string)}
                  >
                    <img
                      src={expense.receipt_image as string}
                      alt="Receipt"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium">
                        Click to view
                      </span>
                    </div>
                  </div>
                )}

                {/* View Receipt button for mobile */}
                {expense.receipt_image && (
                  <button
                    onClick={() => openImageModal(expense.receipt_image as string)}
                    className="sm:hidden w-full mt-3 py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    View Receipt
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {displayedExpenses.length < filteredExpenses.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 sm:px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <span className="text-sm sm:text-base">Load More</span>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Showing X of Y indicator */}
          {filteredExpenses.length > ITEMS_PER_PAGE && (
            <div className="text-center text-xs sm:text-sm text-slate-500">
              Showing {displayedExpenses.length} of {filteredExpenses.length} expenses
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {modalOpen && modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-slate-500 hover:text-slate-700 bg-white rounded-full p-2 shadow-lg z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 sm:p-6">
              <img 
                src={modalImage} 
                alt="Receipt" 
                className="mx-auto max-h-[80vh] w-auto rounded-lg"
                decoding="async"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Delete Expense</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-6">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}