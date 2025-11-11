import { Menu } from 'lucide-react';
import { APP_CONFIG } from '../../services/api';

export default function Header({ onMenuClick }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-2">
            <h1 className="text-xl font-semibold text-gray-800">
              {APP_CONFIG.APP_TITLE}
            </h1>
            <p className="text-xs text-gray-500">
              v{APP_CONFIG.APP_VERSION}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Admin Dashboard
          </span>
        </div>
      </div>
    </header>
  );
}