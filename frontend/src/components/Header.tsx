"use client";

import React, { useEffect } from "react";
import KeepAlivePing from "./KeepAlivePing";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";
import BottomNav from "./student/BottomNav";
import StudentDrawer from "./student/StudentDrawer";
import AdminDrawer from "./admin/AdminDrawer";

export default function Header() {
  const { sidebarOpen, setSidebarOpen, drawerOpen, setDrawerOpen } = useLayout();
  const { user, isLoggedIn, loading } = useAuth();

  const isStudent = isLoggedIn && user?.role === "student";
  const isAdmin = isLoggedIn && user?.role === "admin";
  const isMobileShell = isStudent || isAdmin;

  if (loading) {
    return <KeepAlivePing />;
  }

  if (isMobileShell) {
    return (
      <>
        <KeepAlivePing />
        <div className="md:hidden">
          {isStudent ? (
            <StudentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          ) : (
            <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          )}
        </div>
        <div className="hidden md:block">
          <Topbar setSidebarOpen={setSidebarOpen} />
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            studentMode={isStudent}
            adminMode={isAdmin}
          />
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <KeepAlivePing />
      <Topbar setSidebarOpen={setSidebarOpen} />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </>
  );
}

