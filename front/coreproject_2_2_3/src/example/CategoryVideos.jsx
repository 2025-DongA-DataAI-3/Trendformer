import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Film } from "lucide-react";
import "./CategoryVideos.css";

const CategoryVideos = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const categoryName = location.state?.categoryName || `카테고리 ${categoryId}`;
  const categoryDescription =
    location.state?.categoryDescription || "선택한 카테고리의 영상 목록 페이지입니다.";

  return (
    <div className="category-page">
      <div className="category-frame">
        <main className="category-content">
          <section className="category-header-card">
            <button
              type="button"
              className="category-back-btn"
              onClick={() => navigate("/trend")}
            >
              <ArrowLeft size={16} />
              카테고리로 돌아가기
            </button>

            <p className="category-label">SELECTED CATEGORY</p>
            <h2 className="category-title">{categoryName}</h2>
            <p className="category-desc">{categoryDescription}</p>
          </section>

          <section className="category-player-card">
            <div className="category-player-top">
              <div className="category-player-badge">
                <Film size={14} />
                VIDEO PLAYER
              </div>
            </div>

            <div className="category-player-frame">
              <div className="category-player-empty">
                <div className="category-player-icon">
                  <Play size={30} />
                </div>
                <h3>영상 재생 화면</h3>
                <p>현재 이 카테고리에 등록된 영상이 없습니다.</p>
                <span>추후 이 영역에 선택한 영상이 재생됩니다.</span>
              </div>
            </div>
          </section>

          <section className="category-list-card">
            <div className="category-list-head">
              <p className="category-list-label">VIDEO LIST</p>
              <h3 className="category-list-title">{categoryName} 영상 목록</h3>
            </div>

            <div className="category-empty-list">
              아직 표시할 영상 카드가 없습니다.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default CategoryVideos;