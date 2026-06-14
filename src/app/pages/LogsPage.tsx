import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Search, Activity, RefreshCw, Download, Filter, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { logService } from '../../services/logService';
import type { SystemLog } from '../../types';
import { toast } from 'sonner';

export function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await logService.getLogs();
      setLogs(data);
    } catch (error) {
      toast.error('Error al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      
      return matchesSearch && matchesLevel && matchesAction;
    });
  }, [logs, searchTerm, levelFilter, actionFilter]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const getLevelIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getLevelBadge = (level: SystemLog['level']) => {
    const colors: Record<string, string> = {
      info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      error: 'bg-red-500/10 text-red-400 border-red-500/20'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full ${colors[level]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Fecha', 'Nivel', 'Acción', 'Usuario', 'Mensaje', 'Detalles'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.action,
        log.user,
        `"${log.message.replace(/"/g, '""')}"`,
        log.details ? `"${log.details.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados correctamente');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('all');
    setActionFilter('all');
  };

  const stats = useMemo(() => {
    return {
      total: logs.length,
      info: logs.filter(l => l.level === 'info').length,
      success: logs.filter(l => l.level === 'success').length,
      warning: logs.filter(l => l.level === 'warning').length,
      error: logs.filter(l => l.level === 'error').length,
    };
  }, [logs]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Logs del Sistema</h1>
            <p className="text-slate-400">Monitorea la actividad y eventos del sistema</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.info}</p>
                <p className="text-xs text-slate-400">Info</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.success}</p>
                <p className="text-xs text-slate-400">Éxito</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.warning}</p>
                <p className="text-xs text-slate-400">Advertencias</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.error}</p>
                <p className="text-xs text-slate-400">Errores</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">Todos los niveles</option>
              <option value="info">Info</option>
              <option value="success">Éxito</option>
              <option value="warning">Advertencia</option>
              <option value="error">Error</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">Todas las acciones</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Registros de Actividad</h2>
            <p className="text-sm text-slate-400">
              Mostrando {filteredLogs.length} de {logs.length} registros
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No se encontraron logs con los filtros aplicados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase w-12"></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Nivel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Acción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-4">{getLevelIcon(log.level)}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-4">{getLevelBadge(log.level)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full bg-slate-700/50 text-slate-300 border-slate-600">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">{log.user}</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-white">{log.message}</p>
                          {log.details && (
                            <p className="text-xs text-slate-400 mt-1">{log.details}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
