import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Cloud,
  Upload,
  FileText,
  Users,
  ScrollText,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mi Almacenamiento', href: '/storage', icon: Cloud },
  { name: 'Subir Archivo', href: '/upload', icon: Upload },
  { name: 'Historial', href: '/history', icon: FileText },
  { name: 'Estudiantes', href: '/students', icon: Users },
  { name: 'Logs', href: '/logs', icon: ScrollText },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">UMSA Cloud</h1>
            <p className="text-xs text-slate-400">Almacenamiento Seguro</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">SEGURO</span>
          </div>
          <p className="text-xs text-slate-400">
            Todos los archivos son escaneados automáticamente
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>

        {user && (
          <div className="text-xs text-slate-500 text-center">
            Sesión: {user.name}
          </div>
        )}
      </div>
    </div>
  );
}
