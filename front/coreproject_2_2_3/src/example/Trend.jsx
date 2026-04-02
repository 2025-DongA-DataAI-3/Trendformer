import React from "react";
import { useNavigate } from "react-router-dom";
import { Flame, FolderSearch, Shuffle, Tag } from "lucide-react";
import "./Trend.css";

const categoryList = [
  {
    id: 1,
    name: "챌린지 & 댄스",
    color: "linear-gradient(135deg, rgba(31,138,138,0.34), rgba(63,208,201,0.14))",
  },
  {
    id: 2,
    name: "유머 & 상황극",
    color: "linear-gradient(135deg, rgba(29,95,154,0.32), rgba(63,208,201,0.12))",
  },
  {
    id: 3,
    name: "게임 & 테크",
    color: "linear-gradient(135deg, rgba(21,114,108,0.3), rgba(126,243,234,0.12))",
  },
  {
    id: 4,
    name: "아이돌 & 덕질",
    color: "linear-gradient(135deg, rgba(18,86,130,0.34), rgba(90,175,215,0.12))",
  },
  {
    id: 5,
    name: "라이프스타일",
    color: "linear-gradient(135deg, rgba(31,138,138,0.28), rgba(29,95,154,0.14))",
  },
  {
    id: 6,
    name: "동물 & 힐링",
    color: "linear-gradient(135deg, rgba(13,77,94,0.36), rgba(63,208,201,0.1))",
  },
  {
    id: 7,
    name: "스포츠 & 액티비티",
    color: "linear-gradient(135deg, rgba(25,108,104,0.3), rgba(111,233,224,0.12))",
  },
  {
    id: 8,
    name: "이슈 & 리액션",
    color: "linear-gradient(135deg, rgba(20,86,109,0.34), rgba(63,208,201,0.1))",
  },
];

const categoryContents = {
  유행어: [
    {
      title: "지금 다 따라하는 유행어 밈",
      creator: "@trend_lab",
      tag: "#유행어 #실시간",
      stats: "반응 급상승",
    },
    {
      title: "댓글에서 먼저 뜨는 짧은 멘트 밈",
      creator: "@meme_daily",
      tag: "#밈 #대사",
      stats: "오늘 인기",
    },
  ],
  챌린지: [
    {
      title: "짧게 따라하기 좋은 챌린지 밈",
      creator: "@shorts_pick",
      tag: "#챌린지 #숏폼",
      stats: "참여도 높음",
    },
    {
      title: "지금 가장 많이 확산되는 챌린지",
      creator: "@viral_now",
      tag: "#도전 #트렌드",
      stats: "실시간 확산",
    },
  ],
  동물: [
    {
      title: "반응이 미친 동물 리액션 밈",
      creator: "@pet_loop",
      tag: "#동물 #리액션",
      stats: "저장률 높음",
    },
    {
      title: "짧은 순간으로 터지는 동물 밈",
      creator: "@cute_feed",
      tag: "#귀여움 #밈",
      stats: "좋아요 증가",
    },
  ],
  게임: [
    {
      title: "게임 순간 반응으로 뜬 밈",
      creator: "@gg_clip",
      tag: "#게임 #클립",
      stats: "조회수 상승",
    },
    {
      title: "플레이보다 반응이 더 웃긴 밈",
      creator: "@fun_play",
      tag: "#게임밈 #숏폼",
      stats: "인기 급상승",
    },
  ],
  연예: [
    {
      title: "짧은 표정과 반응으로 뜬 연예 밈",
      creator: "@pop_flash",
      tag: "#연예 #반응",
      stats: "오늘 많이 봄",
    },
    {
      title: "인터뷰 장면이 밈이 된 콘텐츠",
      creator: "@clip_issue",
      tag: "#방송 #밈",
      stats: "공유 증가",
    },
  ],
  드라마: [
    {
      title: "명장면 한 컷으로 퍼지는 드라마 밈",
      creator: "@scene_cut",
      tag: "#드라마 #대사",
      stats: "공감 반응 높음",
    },
    {
      title: "표정 하나로 설명되는 장면 밈",
      creator: "@mood_pick",
      tag: "#장면 #밈",
      stats: "재생률 높음",
    },
  ],
  일상공감: [
    {
      title: "다들 한 번쯤 겪는 공감형 밈",
      creator: "@daily_meme",
      tag: "#공감 #일상",
      stats: "저장률 상승",
    },
    {
      title: "직장인, 학생 모두 공감하는 밈",
      creator: "@relate_now",
      tag: "#공감짤 #트렌드",
      stats: "반응 꾸준함",
    },
  ],
  패러디: [
    {
      title: "합성 편집으로 완성된 패러디 밈",
      creator: "@edit_room",
      tag: "#패러디 #편집",
      stats: "완성도 높음",
    },
    {
      title: "원본보다 더 퍼지는 패러디 클립",
      creator: "@viral_edit",
      tag: "#편집밈 #짤",
      stats: "확산 중",
    },
  ],
};

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