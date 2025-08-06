import { Bell, DollarSign, LogOut, Package, Users } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const sidebarItems = [
  { id: 'users', label: 'Quản lý Users', icon: Users },
  { id: 'storage', label: 'Quản lý Storage', icon: Package },
  { id: 'payout', label: 'Quản lý Payout', icon: DollarSign },
  { id: 'requests', label: 'Requests', icon: Bell },
];

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 h-screen w-64 shadow-2xl flex flex-col border-r border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3 shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-white">PackPals</h1>
            <p className="text-sm text-slate-400">Staff Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 ${
                    activeTab === item.id ? 'text-white' : 'text-slate-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4 p-3 bg-slate-800 rounded-xl border border-slate-600">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-10 w-10 flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-400">staff@packpals.com</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
