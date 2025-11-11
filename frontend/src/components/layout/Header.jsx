import { Menu, Bell, User, Settings } from 'lucide-react';
import { APP_CONFIG } from '../../services/api';

export default function Header({ onMenuClick }) {
  return (
    <header className="bg-linear-to-r from-blue-50 to-cyan-50 shadow-sm border-b border-indigo-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors duration-200 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-3 md:ml-4">
            <h1 className="text-xl font-bold text-indigo-600">
              {APP_CONFIG.APP_TITLE}
            </h1>
            <p className="text-xs text-indigo-400 mt-0.5">
              v{APP_CONFIG.APP_VERSION}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          
        </div>
      </div>
    </header>
  );
}