import DirectToFactoryTabs from './DirectToFactoryTabs';

export default function DirectToFactoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="sr-only">ส่งตรงเข้าโรงงาน</h1>
      <DirectToFactoryTabs />
      {children}
    </div>
  );
}
