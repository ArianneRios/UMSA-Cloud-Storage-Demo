import { Bell, Search, User, HardDrive, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageUsed = user?.storage_used || 0;
  const maxStorage = user?.max_storage && user.max_storage > 0
    ? user.max_storage
    : 1024 * 1024 * 1024; // 1 GB por defecto

  const storagePercentage = Math.min(
    Math.round((storageUsed / maxStorage) * 100),
    100
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }

    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }

    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar archivos, estudiantes, logs..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-cyan-300">
            Sistema Online - Escaneo AWS activo
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-400">Sistema Online</span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Almacenamiento</span>
            <span className="text-xs font-semibold text-white">
              {formatStorage(storageUsed)} / {formatStorage(maxStorage)}
            </span>
          </div>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${storagePercentage > 80
                ? 'bg-red-500'
                : storagePercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
                }`}
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-4 border-l border-slate-700 hover:bg-slate-800/50 rounded-lg py-1 pr-2 transition-colors"
          >
            <div className="text-right">
              <div className="text-sm font-medium text-white">{user?.name || 'Usuario'}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.role || 'Rol'}</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
