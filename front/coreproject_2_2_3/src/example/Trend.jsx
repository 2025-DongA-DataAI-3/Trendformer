import React from "react";
import { useNavigate } from "react-router-dom";
import { Flame, FolderSearch, Shuffle, Tag } from "lucide-react";
import "./Trend.css";

const categoryList = [
  {
    id: 1,
    name: "챌린지 & 댄스",
    description: "틱톡/릴스 댄스 유행, 댄스 챌린지, 댄스 커버 특집",
    highlight: true,
  },
  {
    id: 2,
    name: "유머 & 상황극",
    description: "스케치 코미디, 일상 공감, 병맛 밈, 밈 드라마",
    highlight: false,
  },
  {
    id: 3,
    name: "게임 & 테크",
    description: "리그오브레전드, 로스트아크 등 게임 플레이, 테크 밈",
    highlight: false,
  },
  {
    id: 4,
    name: "아이돌 & 덕질",
    description: "K-POP 직캠, 라이브 편집 영상, 팬 리액션 콘텐츠",
    highlight: false,
  },
  {
    id: 5,
    name: "라이프스타일",
    description: "브이로그, 자취 요리, 패션 OOTD, 오운완(운동) 밈",
    highlight: false,
  },
  {
    id: 6,
    name: "동물 & 힐링",
    description: "강아지/고양이 등 귀여운 동물 영상, 힐링 및 ASMR",
    highlight: false,
  },
  {
    id: 7,
    name: "스포츠 & 액티비티",
    description: "국대 밈, 스포츠 하이라이트, 운동 분석, 익스트림 콘텐츠",
    highlight: false,
  },
  {
    id: 8,
    name: "이슈 & 리액션",
    description: "실시간 커뮤니티 화제, 뉴스 쇼트, 유튜버 리액션",
    highlight: false,
  },
];

const Trend = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.id}`, {
      state: {
        categoryName: category.name,
        categoryDescription: category.description,
      },
    });
  };

  return (
    <div className="trend-page">
      <div className="trend-phone-frame">
        <main className="trend-content">
          <section className="trend-hero-card">
            <div className="trend-hero-badge">
              <Shuffle size={14} />
              CATEGORY DISCOVERY
            </div>

            <h2 className="trend-hero-title">
              카테고리를 누르면 관심 밈을 빠르게 찾을 수 있어요
            </h2>

            <p className="trend-hero-desc">
              사용자가 헷갈리지 않도록 카테고리 구조를 단순하게 정리하고,
              선택 즉시 관련 추천 밈이 보이도록 구성한 화면입니다.
            </p>

            <div className="trend-hero-actions">
              <button type="button" className="trend-chip-btn">
                <FolderSearch size={14} />
                저장된 카테고리 탐색
              </button>

              <button type="button" className="trend-chip-btn">
                <Shuffle size={14} />
                랜덤 추천 연결
              </button>
            </div>
          </section>

          <section className="trend-list-section">
            <div className="trend-list-head">
              <div>
                <p className="trend-list-label">CATEGORY LIST</p>
                <h3 className="trend-list-title">밈 카테고리</h3>
              </div>

              <button type="button" className="trend-quick-btn">
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
      </div>
    </div>
  );
};

export default Trend;