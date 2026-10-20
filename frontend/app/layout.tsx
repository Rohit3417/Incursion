import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Incursion - Recruitment & Evaluation Engine',
  description: 'Deterministic, explainable candidate scoring and auditable hackathon review platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}