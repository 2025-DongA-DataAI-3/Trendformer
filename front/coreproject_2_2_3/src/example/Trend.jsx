import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, FolderSearch, Shuffle, Tag } from "lucide-react";
import "./Trend.css";

const categoryList = [
  {
    id: 1,
    name: "챌린지 & 댄스",
    description: "참여형 챌린지와 다양한 퍼포먼스 중심의 밈 콘텐츠",
    highlight: true,
  },
  {
    id: 2,
    name: "유머 & 상황극",
    description: "공감 기반 스토리와 짧은 연출 중심의 유머 콘텐츠",
    highlight: false,
  },
  {
    id: 3,
    name: "게임 & 테크",
    description: "게임 플레이와 기술 관련 트렌드를 담은 콘텐츠",
    highlight: false,
  },
  {
    id: 4,
    name: "아이돌 & 덕질",
    description: "팬 활동과 아티스트 중심의 팬덤 콘텐츠",
    highlight: false,
  },
  {
    id: 5,
    name: "라이프스타일",
    description: "일상, 취미, 자기관리 등 개인의 라이프를 담은 콘텐츠",
    highlight: false,
  },
  {
    id: 6,
    name: "동물 & 힐링",
    description: "편안함과 즐거움을 주는 감성 중심 콘텐츠",
    highlight: false,
  },
  {
    id: 7,
    name: "스포츠 & 액티비티",
    description: "운동, 활동, 퍼포먼스를 중심으로 한 역동적인 콘텐츠",
    highlight: false,
  },
  {
    id: 8,
    name: "이슈 & 리액션",
    description: "실시간 화제와 다양한 반응을 다루는 트렌드 콘텐츠",
    highlight: false,
  },
];

const DRAG_TRIGGER = 70;
const MAX_DRAG = 42;

const Trend = () => {
  const navigate = useNavigate();

  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.id}`, {
      state: {
        categoryName: category.name,
        categoryDescription: category.description,
      },
    });
  };

  const handleSavedCategoryClick = () => {
    console.log("저장된 카테고리 탐색");
  };

  const startDrag = (clientY) => {
    dragStartY.current = clientY;
    isDragging.current = true;
  };

  const updateDrag = (clientY) => {
    if (!isDragging.current) return;
    const diff = dragStartY.current - clientY;
    const clamped = Math.max(0, Math.min(diff, MAX_DRAG));
    setDragOffset(clamped);
    if (diff >= DRAG_TRIGGER) {
      isDragging.current = false;
      setDragOffset(0);
      navigate("/lifecycle");
    }
  };

  const endDrag = () => {
    isDragging.current = false;
    setDragOffset(0);
  };

  useEffect(() => {
    const handleMouseMove = (e) => updateDrag(e.clientY);
    const handleMouseUp = () => endDrag();
    const handleTouchMove = (e) => {
      if (!e.changedTouches?.length) return;
      updateDrag(e.changedTouches[0].clientY);
    };
    const handleTouchEnd = () => endDrag();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return (
    <div className="trend-page">
      <div className="trend-phone-frame">
        <main className="trend-content">

          {/* 팀원1에서 채택 - hero 카드 */}

          <section className="trend-list-section">
            <div className="trend-list-head">
              <div>
                <p className="trend-list-label">CATEGORY LIST</p>
                <h3 className="trend-list-title">밈 카테고리</h3>
              </div>
              <button
                type="button"
                className="trend-quick-btn"
                onClick={handleSavedCategoryClick}
              >
                <Flame size={14} />
                빠른 진입
              </button>
            </div>

            <div className="trend-category-grid">
              {categoryList.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`trend-category-card ${category.highlight ? "is-highlight" : ""}`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="trend-category-top">
                    <h4 className="trend-category-name">{category.name}</h4>
                    <Tag size={18} className="trend-category-icon" />
                  </div>
                  <p className="trend-category-desc">{category.description}</p>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* 팀원2에서 채택 - 드래그로 lifecycle 이동 */}
        <div className="trend-lifecycle-handle-fixed-wrap">
          <button
            type="button"
            className="trend-lifecycle-handle"
            aria-label="위로 드래그해서 생애 주기 열기"
            onMouseDown={(e) => startDrag(e.clientY)}
            onTouchStart={(e) => {
              if (!e.changedTouches?.length) return;
              startDrag(e.changedTouches[0].clientY);
            }}
            style={{ transform: `translateY(-${dragOffset}px)` }}
          >
            <span className="trend-lifecycle-handle-bar" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Trend;