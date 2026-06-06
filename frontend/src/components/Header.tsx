"use client";

import React, { useState, useEffect } from "react";
import KeepAlivePing from "./KeepAlivePing";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "./student/BottomNav";
import StudentTopBar from "./student/StudentTopBar";
import StudentDrawer from "./student/StudentDrawer";
import AdminTopBar from "./admin/AdminTopBar";
import AdminDrawer from "./admin/AdminDrawer";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isLoggedIn, loading } = useAuth();

  const isStudent = isLoggedIn && user?.role === "student";
  const isAdmin = isLoggedIn && user?.role === "admin";
  const isMobileShell = isStudent || isAdmin;

  useEffect(() => {
    const open = sidebarOpen || drawerOpen;
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, drawerOpen]);

  if (loading) {
    return <KeepAlivePing />;
  }

  if (isMobileShell) {
    return (
      <>
        <KeepAlivePing />
        <div className="md:hidden">
          {isStudent ? (
            <>
              <StudentTopBar setDrawerOpen={setDrawerOpen} />
              <StudentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            </>
          ) : (
            <>
              <AdminTopBar setDrawerOpen={setDrawerOpen} />
              <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            </>
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
