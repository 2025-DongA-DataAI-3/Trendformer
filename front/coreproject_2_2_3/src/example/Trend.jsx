import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import RankList from "./RankList"; 
import "./Trend.css";

const categoryList = [
  { id: 1, name: "챌린지 & 댄스", description: "참여형 챌린지와 다양한 퍼포먼스 중심의 밈 콘텐츠", highlight: true },
  { id: 2, name: "유머 & 상황극", description: "공감 기반 스토리와 짧은 연출 중심의 유머 콘텐츠", highlight: false },
  { id: 3, name: "게임 & 테크", description: "게임 플레이와 기술 관련 트렌드를 담은 콘텐츠", highlight: false },
  { id: 4, name: "아이돌 & 덕질", description: "팬 활동과 아티스트 중심의 팬덤 콘텐츠", highlight: false },
  { id: 5, name: "라이프스타일", description: "일상, 취미, 자기관리 등 개인의 라이프를 담은 콘텐츠", highlight: false },
  { id: 6, name: "동물 & 힐링", description: "편안함과 즐거움을 주는 감성 중심 콘텐츠", highlight: false },
  { id: 7, name: "스포츠 & 액티비티", description: "운동, 활동, 퍼포먼스를 중심으로 한 역동적인 콘텐츠", highlight: false },
  { id: 8, name: "이슈 & 리액션", description: "실시간 화제와 다양한 반응을 다루는 트렌드 콘텐츠", highlight: false },
];

const Trend = () => {
  const navigate = useNavigate();
  const [isRankOpen, setIsRankOpen] = useState(false);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.id}`, {
      state: { categoryName: category.name, categoryDescription: category.description },
    });
  };

  return (
    <div className="trend-page">
      <div className="trend-phone-frame">
        <main className="trend-content">
          <section className="trend-list-section">
            <div className="trend-list-head">
              <div>
                <p className="trend-list-label">CATEGORY LIST</p>
                <h3 className="trend-list-title">밈 카테고리</h3>
              </div>
              {/* <button type="button" className="trend-quick-btn">
                <Flame size={14} /> 빠른 진입
              </button> */}
            </div>

            {/* 카테고리 그리드 */}
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
                  </div>
                  <p className="trend-category-desc">{category.description}</p>
                </button>
              ))}
            </div>

            {/* 🔥 카드 바로 밑으로 버튼 이동 (공백 제거의 핵심) */}
            <div className="trend-rank-bar-container">
              <p className="trend-pull-hint"></p>
              <button
                type="button"
                className="trend-lifecycle-rank-bar"
                onClick={() => setIsRankOpen(true)}
              >
                <div className="trend-rank-bar-content">
                  <TrendingUp size={18} />
                  <span>최근 인기 키워드 분석 순위</span>
                </div>
                <span className="trend-rank-bar-arrow">&gt;</span>
              </button>
            </div>
          </section>
        </main>

        {/* 랭킹 오버레이 (슈웅 애니메이션) */}
        <AnimatePresence>
          {isRankOpen && (
            <>
              <motion.div 
                className="trend-rank-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRankOpen(false)}
              />
              <motion.div
                className="trend-rank-modal-motion"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 100) setIsRankOpen(false);
                }}
              >
                <div className="trend-modal-handle" onClick={() => setIsRankOpen(false)}>
                  <span className="handle-bar"></span>
                </div>
                <div className="trend-modal-scroll-area">
                  <RankList isModal={true} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Trend;