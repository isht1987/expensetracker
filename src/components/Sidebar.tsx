import { Home, Receipt, TrendingUp, Settings, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'recent-expenses', label: 'Recent Expenses', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange, isCollapsed, onCollapseChange }: SidebarProps) {

  return (
    <>
      {/* Mobile overlay - appears above header */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => onCollapseChange(true)}
        />
      )}
      
      {/* Sidebar - Higher z-index on mobile, positioned to be above header */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-lg transition-transform duration-300 ${
        isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
      } w-64 lg:z-30 z-[60]`}>
        
        {/* Header section */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Expense Tracker</h1>
            <p className="text-sm text-slate-500">Manage your expenses</p>
          </div>
          <button
            onClick={() => onCollapseChange(!isCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSectionChange(item.id);
                      // Auto-close sidebar on small screens (below lg breakpoint)
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        onCollapseChange(true);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick tip section */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Quick Tip</p>
              </div>
            </div>
            <p className="text-xs text-emerald-700">Upload receipts to track your expenses automatically!</p>
          </div>
        </div>
      </div>
    </>
  );
}