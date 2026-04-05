import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  LayoutGrid,
  PlusSquare,
  Search as SearchIcon,
  User,
  Sparkles,
  Bell,
} from "lucide-react";
import "./Layout.css";

const Layout = () => {
  const location = useLocation();

  const pageTitles = {
    "/": {
      eyebrow: "REAL-TIME MEME PLATFORM",
      title: "TrendFormer",
      subtitle: "실시간 인기 밈을 가장 직관적으로 탐색하는 숏폼 플랫폼",
    },
    "/trend": {
      eyebrow: "TrendFomer",
      title: "Category",
      subtitle: "관심 있는 밈 주제를 빠르게 탐색해보세요",
    },
    "/upload": {
      eyebrow: "TrendFomer",
      title: "UpLoad",
      subtitle: "내가 만든 밈 영상과 이미지를 공유해보세요",
    },
    "/search": {
      eyebrow: "TrendFomer",
      title: "Discover",
      subtitle: "검색 기록과 추천어로 원하는 밈을 찾아보세요",
    },
    "/profile": {
      eyebrow: "TrendFomer",
      title: "My Archive",
      subtitle: "좋아요와 저장한 콘텐츠를 한눈에 관리하세요",
    },
  };

  const current = pageTitles[location.pathname] || pageTitles["/"];
  const isHome = location.pathname === "/";

  return (
    <div className="tf-wrapper">
      <div className="tf-app-shell">
        <div className="tf-bg-orb tf-bg-orb-left" />
        <div className="tf-bg-orb tf-bg-orb-right" />

        <header className={`tf-top-header ${isHome ? "home-header" : ""}`}>
          <div className="tf-header-row">
            <div className="tf-header-text">
              <NavLink className="tf-title" to="/">
                {current.title}
              </NavLink>
            </div>

            <div className="tf-header-actions">
              

              <div className="tf-header-badge">
                
              </div>
            </div>
          </div>
        </header>

        <main className="tf-content">
          <Outlet />
        </main>

        <nav className="tf-bottom-bar">
          <NavLink
            to="/"
            end
            state={{ reset: true }}
            className={({ isActive }) =>
              isActive ? "tf-bottom-item active" : "tf-bottom-item"
            }
          >
            <HomeIcon size={20} />
            <span>홈</span>
          </NavLink>

          <NavLink
            to="/trend"
            className={({ isActive }) =>
              isActive ? "tf-bottom-item active" : "tf-bottom-item"
            }
          >
            <LayoutGrid size={20} />
            <span>카테고리</span>
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive ? "tf-bottom-item tf-upload-item active-upload" : "tf-bottom-item tf-upload-item"
            }
          >
            <div className="tf-upload-icon-wrap">
              <PlusSquare size={22} />
            </div>
            <span>업로드</span>
          </NavLink>

          <NavLink
            to="/search"
            end
            state={{ reset: true }}
            className={({ isActive }) =>
              isActive ? "tf-bottom-item active" : "tf-bottom-item"
            }
            onClick={() => {
              const content = document.querySelector(".tf-content");
              if (content) content.scrollTo({ top: 0, behavior: "smooth" });
            }}
            >
            <SearchIcon size={20} />
            <span>검색</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "tf-bottom-item active" : "tf-bottom-item"
            }
          >
            <User size={20} />
            <span>프로필</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Layout;