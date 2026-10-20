'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UploadCloud,
  Sliders,
  Award,
  GitCompare,
  History,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/upload', label: '1. Upload Data', icon: UploadCloud, desc: 'CSV/JSON import & schema check' },
  { href: '/config', label: '2. Configure', icon: Sliders, desc: 'Scoring dimensions & weights' },
  { href: '/results', label: '3. Results', icon: Award, desc: 'Rankings, overrides & What-If' },
  { href: '/compare', label: '4. Compare', icon: GitCompare, desc: 'Sensitivity & strategy diffs' },
  { href: '/history', label: '5. History', icon: History, desc: 'Audit trail & cryptographic proof' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 p-5 flex flex-col justify-between shrink-0 shadow-lg select-none">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">Incursion</h1>
            <p className="text-[11px] text-slate-400 font-medium">Evaluation Engine</p>
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/upload' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                  <div
                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">Deterministic Engine</p>
        <p className="text-[10px] text-slate-500 leading-tight">
          SHA-256 canonical hashing & auditable override logs.
        </p>
      </div>
    </aside>
  );
}
