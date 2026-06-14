import { FileStatus } from '../../types';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Upload } from 'lucide-react';

interface StatusBadgeProps {
  status: FileStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    UPLOADED: {
      label: 'Uploaded',
      icon: Upload,
      className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    },
    ANALYZING: {
      label: 'Analyzing',
      icon: Loader2,
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    },
    CLEAN: {
      label: 'Clean',
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    QUARANTINED: {
      label: 'En cuarentena',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    ERROR: {
      label: 'Error',
      icon: AlertCircle,
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  };

  const { label, icon: Icon, className } = config[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${className} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  );
}
