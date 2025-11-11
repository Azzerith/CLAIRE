import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3,
  X 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Dosen', href: '/dosen', icon: Users },
  { name: 'Jadwal', href: '/jadwal', icon: Calendar },
  { name: 'Evaluasi', href: '/evaluasi', icon: BarChart3 },
];

export default function Sidebar({ open, setOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-indigo-500 bg-opacity-20 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-linear-to-b from-blue-50 to-cyan-50 shadow-xl transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-0
        border-r border-indigo-200
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-200 bg-linear-to-r from-blue-50 to-cyan-50">
          <div>
            <h2 className="text-xl font-bold text-indigo-600">Academic Portal</h2>
            <p className="text-xs text-indigo-400 mt-1">Navigation Menu</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-100 transition-colors duration-200 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300
                  shadow-sm hover:shadow-md border border-transparent
                  ${isActive 
                    ? 'bg-linear-to-r from-indigo-500 to-purple-400 text-white shadow-lg transform scale-[1.02] border-indigo-300' 
                    : 'text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 hover:translate-x-1'
                  }
                `}
                onClick={() => setOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-indigo-500'
                    }`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-200 bg-white/60">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-cyan-200"></div>
              <div className="w-2 h-2 rounded-full bg-purple-300"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            </div>
            <span className="text-xs text-indigo-400">Academic System v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
}