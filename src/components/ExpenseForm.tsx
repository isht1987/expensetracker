import { useState, useEffect } from 'react';
import { Upload, DollarSign, Calendar, FileText, X, Plus } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import api from '../lib/axios';
import { Expense } from '../types';

interface ExpenseFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const FALLBACK_CATEGORIES = [
  'Fuel Expenses',
  'Meals',
  'Car Payments',
  'Insurance',
  'Car Maintenance',
  'Car Repair',
  'Legal Fines',
  'Others',
];

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [recentReceipts, setRecentReceipts] = useState<Expense[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        notify('error', 'Image size must be less than 10MB');
        return;
      }
      
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      notify('success', 'Image uploaded successfully');
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    setPreviewUrl(null);
    notify('info', 'Image removed');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setFormData({ 
      ...formData, 
      category: newCategory,
      customCategory: newCategory === 'Others' ? formData.customCategory : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for custom category
    if (formData.category === 'Others' && !formData.customCategory.trim()) {
      notify('error', 'Please specify a custom category when selecting "Others"');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('category', formData.category);
      if (formData.category === 'Others') {
        submitData.append('custom_category', formData.customCategory);
      }
      submitData.append('amount', formData.amount);
      submitData.append('date', formData.date);
      if (formData.description) submitData.append('description', formData.description);
      if (receiptImage) submitData.append('receipt_image', receiptImage);

      await api.post('/expenses/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      notify('success', 'Expense added successfully');

      // Reset form
      setFormData({
        category: '',
        customCategory: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setReceiptImage(null);
      setPreviewUrl(null);
      onSuccess();
      
      // Notify dashboard and other components that expenses updated
      try { 
        window.dispatchEvent(new Event('expenses:updated')); 
      } catch (e) {
        // Silent fail
      }
      
      // Refresh history
      fetchHistory();
    } catch (err: any) {
      const errorMessage = err.response?.data?.custom_category?.[0]
        || err.response?.data?.message
        || 'Failed to add expense. Please try again.';
      notify('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChoices();
    fetchHistory();
  }, []);

  const fetchChoices = async () => {
    try {
      const resp = await api.get('/categories/choices/');
      if (Array.isArray(resp.data) && resp.data.length > 0) {
        const names = resp.data.map((c: any) => (typeof c === 'string' ? c : c.name || c.label || ''))
          .filter(Boolean);
        if (names.length) {
          setCategories(names);
          notify('info', 'Categories loaded');
        }
      }
    } catch (e) {
      notify('warning', 'Using default categories');
    }
  };

  const fetchHistory = async () => {
    try {
      const resp = await api.get('/expenses/history/');
      if (Array.isArray(resp.data)) {
        setRecentReceipts(resp.data);
      } else if (resp.data && Array.isArray(resp.data.results)) {
        setRecentReceipts(resp.data.results);
      }
    } catch (e) {
      // Silent fail for history
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">New Receipt</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.category}
                onChange={handleCategoryChange}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Show custom category field when "Others" is selected */}
        {formData.category === 'Others' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customCategory}
              onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="Enter custom category name"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Upload Photo
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-48 rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">Click to upload receipt</p>
                <p className="text-sm text-slate-400 mt-1">PNG, JPG up to 10MB</p>
              </label>
            )}
          </div>
        </div>

        {/* Receipt history panel (collapsible) */}
        <div className="border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <span className="font-medium text-slate-700">Recent Receipts</span>
            <span className="text-xs text-slate-500">{recentReceipts.length} items</span>
          </button>
          {showHistory && (
            <div className="bg-slate-50 p-4 border-t border-slate-200">
              {recentReceipts.length === 0 ? (
                <p className="text-sm text-slate-500">No recent receipts</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {recentReceipts.slice(0, 10).map((r) => (
                    <li key={r.id} className="flex justify-between items-center bg-white p-2 rounded">
                      <div>
                        <p className="text-sm font-medium">${parseFloat(r.amount).toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{r.category_name || r.category}</p>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add Additional Comments
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Add notes about this expense..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {isLoading ? 'Adding...' : 'Add Expense'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}