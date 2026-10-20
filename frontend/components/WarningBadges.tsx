import { AlertTriangle, HelpCircle, XOctagon, Eye } from 'lucide-react';

export interface BadgeItem {
  type: 'MISSING' | 'INVALID' | 'UNCERTAIN' | 'NEEDS_REVIEW' | string;
  tooltip?: string;
}

interface WarningBadgesProps {
  badges: BadgeItem[];
}

export default function WarningBadges({ badges }: WarningBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const getStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MISSING':
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: <AlertTriangle size={12} className="text-gray-500" />,
        };
      case 'INVALID':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <XOctagon size={12} className="text-rose-600" />,
        };
      case 'UNCERTAIN':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <HelpCircle size={12} className="text-amber-600" />,
        };
      case 'NEEDS_REVIEW':
      default:
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: <Eye size={12} className="text-purple-600" />,
        };
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {badges.map((b, idx) => {
        const style = getStyle(b.type);
        return (
          <span
            key={idx}
            title={b.tooltip || b.type}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border cursor-help shadow-2xs ${style.bg}`}
          >
            {style.icon}
            {b.type}
          </span>
        );
      })}
    </div>
  );
}