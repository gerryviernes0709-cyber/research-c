import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center h-14 px-6 bg-white border-b border-gray-200">
          <h1 className="text-sm font-medium text-gray-500">PeptideIQ</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
