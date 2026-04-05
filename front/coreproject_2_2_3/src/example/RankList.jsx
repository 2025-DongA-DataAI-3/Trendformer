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
        return (
          <span className="rk-badge stage-growth">성장</span>
        );
      case '성숙':
        return (
          <span className="rk-badge stage-mature">성숙</span>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
  const fetchRanks = async () => {
    try {
      // 1. 로딩 시작 (이미 초기값이 true라면 생략 가능하지만 명시적으로!)
      setIsLoading(true); 

      // 2. 서버 주소 (서버와 일치하는지 다시 확인!)
      const response = await fetch("http://localhost:3002/api/trend/ranking");
      const data = await response.json();
      
      console.log("서버 응답 데이터:", data); // 브라우저 F12 콘솔에서 이게 뜨는지 보세요!

      // 3. 데이터가 있을 때만 담기
      if (data) {
        setRanks(data);
      }
    } catch (error) {
      console.error("랭킹 로드 실패:", error);
    } finally {
      // 4. 🔥 [핵심] 모든 과정이 다 끝나고 나서 마지막에 로딩 해제!
      setIsLoading(false); 
    }
  };
  fetchRanks();
}, []);

  // 키워드 클릭 시 상세 페이지로 이동 (contentId를 반드시 같이 넘겨야 그래프가 뜹니다!)
  const handleKeywordClick = (item) => {
    navigate(`/lifecycle?contentId=${item.CONTENT_ID}&keyword=${encodeURIComponent(item.KEYWORD_NAME)}`);
  };

  return (
    <div className="rk-page">
      <div className="rk-phone-frame">
        {/* ... (Header, Intro 부분 동일) ... */}

        <main className="rk-content">
          {isLoading ? (
            <div className="rk-loading">AI가 실시간 랭킹을 집계 중입니다...</div>
          ) : (
            <div className="rk-list">
              {ranks.length > 0 ? (
                ranks.map((item, index) => (
                  <button
                    key={index}
                    className={`rk-item ${index < 3 ? "rk-top-tier" : ""}`}
                    onClick={() => handleKeywordClick(item)}
                  >
                    <div className="rk-rank-num">
                      {index < 3 ? <Award size={18} className="rk-award-icon" /> : index + 1}
                    </div>
                    <div className="rk-info">
                      {/* 🔥 이름 옆에 심플 배지 배치 */}
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