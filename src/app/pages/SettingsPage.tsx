import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Database, Cloud, Zap, Shield, Bell, Activity, HardDrive, Lock, Save, RefreshCw } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import type { AppSettings } from '../../types';
import { toast } from 'sonner';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-slate-400">Configuración del sistema e integraciones</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-3">Sección no implementada en esta versión demo.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            La configuración de infraestructura se maneja directamente desde las variables de entorno en el servidor para garantizar la seguridad del sistema y el cumplimiento de las políticas de acceso.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Database className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-300">Base de Datos</div>
                <div className="text-lg font-bold text-white">PostgreSQL</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-slate-300">Backend API</div>
                <div className="text-lg font-bold text-white">NestJS</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Cloud className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-sm font-medium text-slate-300">Cloud Storage & Compute</div>
                <div className="text-lg font-bold text-white">AWS S3 + Lambda</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Shield className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-sm font-medium text-slate-300">Escaneo de Seguridad</div>
                <div className="text-lg font-bold text-white">VirusTotal</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Bell className="w-8 h-8 text-pink-400" />
              <div>
                <div className="text-sm font-medium text-slate-300">Sistema de Alertas</div>
                <div className="text-lg font-bold text-white">AWS SNS</div>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-sm font-medium text-emerald-400">Estado del Sistema</div>
                <div className="text-lg font-bold text-emerald-400">Sistema Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
