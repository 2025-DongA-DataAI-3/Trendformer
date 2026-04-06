import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Award } from "lucide-react";
import "./RankList.css";

const RankList = () => {
  const [ranks, setRanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const renderLifecycleBadge = (stage) => {
    switch (stage) {
      case '성장':
        return <span className="rk-badge stage-growth">성장</span>;
      case '성숙':
        return <span className="rk-badge stage-mature">성숙</span>;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchRanks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:3002/api/trend/ranking");
        const data = await response.json();
        console.log("서버 응답 데이터:", data);

        if (data) {
          // 중복 제거: KEYWORD_ID 기준
          const unique = data.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.KEYWORD_ID === item.KEYWORD_ID)
          );
          setRanks(unique);
        }
      } catch (error) {
        console.error("랭킹 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanks();
  }, []);

  const handleKeywordClick = (item) => {
    navigate(`/lifecycle?contentId=${item.CONTENT_ID}&keyword=${encodeURIComponent(item.KEYWORD_NAME)}`);
  };

  return (
    <div className="rk-page">
      <div className="rk-phone-frame">
        <main className="rk-content">
          {isLoading ? (
            <div className="rk-loading">AI가 실시간 랭킹을 집계 중입니다...</div>
          ) : (
            <div className="rk-list">
              {ranks.length > 0 ? (
                ranks.map((item, index) => (
                  <button
                    key={item.KEYWORD_ID}
                    className={`rk-item ${index < 3 ? "rk-top-tier" : ""}`}
                    onClick={() => handleKeywordClick(item)}
                  >
                    <div className="rk-rank-num">
                      {index < 3 ? <Award size={18} className="rk-award-icon" /> : index + 1}
                    </div>
                    <div className="rk-info">
                      <div className="rk-name-wrapper">
                        <span className="rk-name">{item.KEYWORD_NAME}</span>
                        {renderLifecycleBadge(item.LIFECYCLE_STAGE)}
                      </div>
                      <span className="rk-meta">최신 조회수 {item.LATEST_VIEW?.toLocaleString()}회</span>
                    </div>
                    <div className="rk-action">
                      <span className="rk-arrow">&gt;</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rk-empty">AI 분석 조건(수집 횟수 2회 이상)을 만족하는 <br/> 키워드가 아직 없습니다.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RankList;