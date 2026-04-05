import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// 🔥 ThumbsUp 대신 화력을 상징하는 Flame(불꽃) 아이콘 추가
import { ArrowLeft, Brain, Zap, Flame, Activity, TrendingUp, Heart } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import "./Lifecycle.css";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const Lifecycle = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const queryParams = new URLSearchParams(location.search);
  const keyword = queryParams.get("keyword") || "분석 키워드";

  useEffect(() => {
    const fetchLifecycleData = async () => {
      if (!keyword) return;
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3002/api/lifecycle/detail?keyword=${encodeURIComponent(keyword)}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLifecycleData();
  }, [keyword]);

  // 차트 데이터 설정
  const chartData = {
    labels: data?.chartData?.labels || [],
    datasets: [
      {
        label: '트렌드 통합 지수',
        data: data?.chartData?.scores || [], 
        borderColor: '#1c9da0',
        backgroundColor: 'rgba(28, 157, 160, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#1c9da0',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        callbacks: {
          label: (context) => ` 트렌드 지수: ${context.parsed.y.toLocaleString()}pt`
        }
      }
    },
    scales: {
      y: { beginAtZero: false, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  const getStageInfo = (stage) => {
    switch (stage) {
      case "도입": return { label: "신규 탄생 🌱", color: "#34d399", tip: "가장 먼저 시작해서 트렌드 세터가 되어보세요!" };
      case "성장": return { label: "급성장 중 🔥", color: "#fbbf24", tip: "지금이 황금기입니다! 당장 유행에 참여해 보세요." };
      case "성숙": return { label: "안정적인 유행 📈", color: "#60a5fa", tip: "누구나 다 아는 유행입니다. 창의적인 접근이 필요해요." };
      case "쇠퇴": return { label: "유행 종료 임박 🍂", color: "#94a3b8", tip: "화력이 떨어지고 있습니다. 다음 밈을 준비하세요." };
      default: return { label: "데이터 분석 중..", color: "#e2e8f0", tip: "실시간 정보를 수집하고 있습니다." };
    }
  };

  const stageInfo = getStageInfo(data?.aiInfo?.stage);

  if (loading) return <div className="lc-loading">AI가 실시간 데이터를 매칭 중입니다...</div>;

  return (
    <div className="lc-page">
      <div className="lc-phone-frame">
        <header className="lc-header">
          <button onClick={() => navigate(-1)} className="lc-back-btn"><ArrowLeft /></button>
          <h2>트렌드 상세 리포트</h2>
        </header>

        <main className="lc-content">
          <section className="lc-hero">
            <h1 className="lc-keyword">#{keyword}</h1>
            <div className="lc-ai-badge"><Brain size={14} /> AI 분석 모델 가동 중</div>
          </section>

          <div className="lc-main-card" style={{ borderTop: `6px solid ${stageInfo.color}` }}>
            <div className="lc-label">AI 판별 생애주기</div>
            <div className="lc-stage-name" style={{ color: stageInfo.color }}>{stageInfo.label}</div>
            <p className="lc-tip">{stageInfo.tip}</p>
          </div>

          <div className="lc-full-stat-card">
  <div className="lc-full-stat-icon">
    <Zap size={24} color="#ff9f43" fill="#ff9f43" />
  </div>
  <div className="lc-full-stat-info">
    <span className="lc-stat-label">AI 분석 실시간 확산 가속도</span>
    <div className="lc-stat-value-group">
      <span className="lc-full-stat-value">{data?.aiInfo?.speed || 0}</span>
      <span className="lc-stat-unit">unit/s</span>
    </div>
  </div>
  <div className="lc-full-stat-trend">
    {data?.aiInfo?.speed > 1.0 ? "급상승 중" : "안정적 흐름"}
  </div>
</div>

          <div className="lc-chart-card">
            <div className="lc-report-header" style={{color: '#1e293b'}}>
              <Activity size={18} color="#1c9da0" />
              <span>실시간 트렌드 지수 (Trend Index)</span>
            </div>
            <div className="lc-chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="lc-report-card">
            <div className="lc-report-header">
              <Activity size={18} />
              <span>AI 모델 최종 의견</span>
            </div>
            <p className="lc-report-text">
              현재 분석 중인 <strong>#{keyword}</strong> 밈은 <strong>{data?.aiInfo?.stage}</strong> 단계로 확인됩니다. 
              최근 통합 트렌드 지수가 {data?.aiInfo?.speed > 1.5 ? '폭발적으로' : '완만하게'} 
              상승하고 있어, 당분간 {data?.aiInfo?.speed > 1.5 ? '높은 관심도가' : '적당한 관심도가'} 유지될 것으로 보입니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Lifecycle;