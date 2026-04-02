import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { House, Grid2x2, Plus, Search, UserRound } from "lucide-react";
import "./Layout.css";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout-page">
      <div className="layout-phone-frame">
        <header className="layout-header">
          <h1 className="layout-title">TrendFormer</h1>
        </header>

        <div className="layout-body">
          <Outlet />
        </div>

        <nav className="layout-bottom-nav">
          <button
            type="button"
            className={`layout-nav-item ${isActive("/") ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <House size={18} />
            <small>홈</small>
          </button>

          <button
            type="button"
            className={`layout-nav-item ${isActive("/trend") ? "active" : ""}`}
            onClick={() => navigate("/trend")}
          >
            <Grid2x2 size={18} />
            <small>카테고리</small>
          </button>

          <button
            type="button"
            className={`layout-nav-item layout-nav-center ${isActive("/upload") ? "active" : ""}`}
            onClick={() => navigate("/upload")}
          >
            <span className="layout-nav-plus">
              <Plus size={18} />
            </span>
            <small>업로드</small>
          </button>

          <button
            type="button"
            className={`layout-nav-item ${isActive("/search") ? "active" : ""}`}
            onClick={() => navigate("/search")}
          >
            <Search size={18} />
            <small>검색</small>
          </button>

          <button
            type="button"
            className={`layout-nav-item ${isActive("/profile") ? "active" : ""}`}
            onClick={() => navigate("/profile")}
          >
            <UserRound size={18} />
            <small>프로필</small>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Layout;