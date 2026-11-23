import React from 'react';

/**
 * RUDRA SILVER ERP - Base Layout Wrapper
 */
interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col font-sans antialiased">
      {children}
    </div>
  );
};

export default MainLayout;
