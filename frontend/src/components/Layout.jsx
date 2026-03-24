import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
