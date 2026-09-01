import React from 'react';
import { TEAMS_METADATA } from '../data/initialData';
import { Shield } from 'lucide-react';

interface TeamBadgeProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFullName?: boolean;
  isUserTeam?: boolean;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  size = 'md',
  showFullName = true,
  isUserTeam = false,
}) => {
  const meta = TEAMS_METADATA[name];
  const short = meta?.shortName || (name.length > 8 ? name.slice(0, 3).toUpperCase() : name);
  const primaryColor = meta?.colors.primary || '#1e293b';
  const secondaryColor = meta?.colors.secondary || '#3b82f6';
  const textColor = meta?.colors.text || '#ffffff';
  const borderColor = meta?.colors.border || '#475569';

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-sm font-bold',
    xl: 'w-14 h-14 text-base font-extrabold',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm font-medium',
    lg: 'text-base font-semibold',
    xl: 'text-lg font-bold',
  };

  const isNational = meta?.type === 'national';
  const isClassicOrAllStar = meta?.type === 'classic' || meta?.type === 'allstar';

  return (
    <div className="inline-flex items-center gap-2 max-w-full">
      <div
        className={`relative shrink-0 rounded-lg flex items-center justify-center font-bold tracking-tight shadow-md transition-transform duration-200 group-hover:scale-105 border ${sizeClasses[size]}`}
        style={{
          backgroundColor: primaryColor,
          color: textColor,
          borderColor: borderColor,
        }}
        title={`${name} (${meta?.type || 'Time'})`}
      >
        {/* Subtle shield overlay styling */}
        <div
          className="absolute inset-0 rounded-lg opacity-20 bg-gradient-to-br from-white to-black pointer-events-none"
        />
        <span className="relative z-10 font-mono tracking-tighter truncate px-0.5">
          {short.slice(0, 4)}
        </span>

        {isUserTeam && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0b101b] animate-pulse" />
        )}
      </div>

      {showFullName && (
        <div className="flex flex-col min-w-0">
          <span className={`truncate text-slate-100 ${textClasses[size]} ${isUserTeam ? 'text-emerald-300 font-semibold' : ''}`}>
            {name}
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-[11px] text-slate-400 font-normal truncate">
              {isNational ? `Seleção • ${meta?.country}` : isClassicOrAllStar ? 'Especial / All-Star' : 'Clube'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
