import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from './Toast';
import ShiftModal from './ShiftModal';

export default function Layout({ children, currentPath, navigate, title }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notifications */}
      <Toast />

      {/* Shift Drawer Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        navigate={navigate}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={title}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          onOpenShiftModal={() => setIsShiftModalOpen(true)}
          navigate={navigate}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/80">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
