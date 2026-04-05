import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import "./Lifecycle.css";

const defaultDashboardData = {
  summary: [
    { id: 1, label: "총 콘텐츠", value: "12.7만", change: "오늘 기준", status: "info" },
    { id: 2, label: "최고 피크 시간", value: "19:00", change: "고정값", status: "warning" },
    { id: 3, label: "성장률", value: "+13%", change: "전주 대비", status: "positive" },
    { id: 4, label: "평균 생애", value: "50시간", change: "3일 미만", status: "purple" },
  ],
  hourlyTrend: [
    { label: "00:00", value: 4 },
    { label: "04:00", value: 5 },
    { label: "08:00", value: 4 },
    { label: "12:00", value: 10 },
    { label: "16:00", value: 8 },
    { label: "20:00", value: 18 },
    { label: "24:00", value: 12 },
  ],
  weeklySearch: [
    { label: "월", value: 11 },
    { label: "화", value: 12 },
    { label: "수", value: 10 },
    { label: "목", value: 8 },
    { label: "금", value: 10 },
    { label: "토", value: 9 },
    { label: "일", value: 6 },
  ],
  platformShare: [
    { label: "모바일", value: 84 },
    { label: "PC", value: 16 },
  ],
  lifecycleAnalysis: [
    { label: "상승형", value: 69, colorType: "positive" },
    { label: "완만형", value: 11, colorType: "warning" },
    { label: "폭발형", value: 20, colorType: "danger" },
  ],
};

const normalizeSummary = (summary) => {
  if (!Array.isArray(summary) || summary.length === 0) {
    return defaultDashboardData.summary;
  }

  return summary.map((item, index) => ({
    id: item.id || index + 1,
    label: item.label || "항목",
    value: item.value ?? "-",
    change: item.change ?? "",
    status:
      item.status ||
      defaultDashboardData.summary[index]?.status ||
      "info",
  }));
};

const normalizeChartList = (list, fallback) => {
  if (!Array.isArray(list) || list.length === 0) {
    return fallback;
  }

  return list.map((item, index) => ({
    label: item.label || `항목 ${index + 1}`,
    value: Number(item.value) || 0,
    colorType: item.colorType || "positive",
  }));
};

function LifecycleLineChart({ data }) {
  const width = 760;
  const height = 220;
  const paddingTop = 20;
  const paddingRight = 18;
  const paddingBottom = 30;
  const paddingLeft = 34;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const ySteps = 4;

  const points = data
    .map((item, index) => {
      const x =
        paddingLeft + (index / Math.max(data.length - 1, 1)) * innerWidth;
      const y =
        paddingTop + innerHeight - (item.value / maxValue) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const peakIndex = data.reduce((maxIndex, item, index, arr) => {
    return item.value > arr[maxIndex].value ? index : maxIndex;
  }, 0);

  return (
    <div className="lc-line-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="lc-line-chart"
        preserveAspectRatio="none"
      >
        {Array.from({ length: ySteps + 1 }).map((_, index) => {
          const y = paddingTop + (innerHeight / ySteps) * index;
          const tickValue = Math.round(maxValue - (maxValue / ySteps) * index);

          return (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                className="lc-grid-line"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="lc-y-axis-label"
              >
                {tickValue}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const x =
            paddingLeft + (index / Math.max(data.length - 1, 1)) * innerWidth;

          return (
            <line
              key={index}
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={height - paddingBottom}
              className="lc-grid-line vertical"
            />
          );
        })}

        <polyline points={points} className="lc-line-path" fill="none" />

        {data.map((item, index) => {
          const x =
            paddingLeft + (index / Math.max(data.length - 1, 1)) * innerWidth;
          const y =
            paddingTop + innerHeight - (item.value / maxValue) * innerHeight;
          const isPeak = index === peakIndex;

          return (
            <g key={index}>
              {isPeak && <circle cx={x} cy={y} r="10" className="lc-dot-ring" />}
              <circle cx={x} cy={y} r={isPeak ? "5" : "4"} className="lc-dot" />
            </g>
          );
        })}
      </svg>

      <div className="lc-line-labels">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function LifecycleBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="lc-bar-chart">
      {data.map((item, index) => (
        <div key={index} className="lc-bar-item">
          <span className="lc-bar-value">{item.value}</span>

          <div className="lc-bar-track">
            <div
              className="lc-bar-fill"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
          </div>

          <span className="lc-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function LifecycleDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const firstValue = data[0]?.value || 0;
  const firstPercent = Math.round((firstValue / total) * 100);

  return (
    <div className="lc-donut-wrap">
      <div
        className="lc-donut"
        style={{
          background: `conic-gradient(
            #4f86ff 0% ${firstPercent}%,
            #27c5a2 ${firstPercent}% 100%
          )`,
        }}
      >
        <div className="lc-donut-inner">
          <strong>{total}%</strong>
        </div>
      </div>

      <div className="lc-legend">
        {data.map((item, index) => (
          <div key={index} className="lc-legend-item">
            <span className={`lc-legend-dot ${index === 0 ? "blue" : "green"}`} />
            <span className="lc-legend-label">{item.label}</span>
            <span className="lc-legend-value">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSummaryClass(status) {
  if (status === "warning") return "warning";
  if (status === "positive") return "positive";
  if (status === "purple") return "purple";
  return "info";
}

function getAnalysisClass(colorType) {
  if (colorType === "warning") return "warning";
  if (colorType === "danger") return "danger";
  return "positive";
}

function Lifecycle() {
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchLifecycleData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const response = await fetch("http://localhost:3002/api/lifecycle");

        if (!response.ok) {
          throw new Error("생애 주기 데이터 조회 실패");
        }

        const data = await response.json();

        setDashboardData({
          summary: normalizeSummary(data.summary),
          hourlyTrend: normalizeChartList(
            data.hourlyTrend,
            defaultDashboardData.hourlyTrend
          ),
          weeklySearch: normalizeChartList(
            data.weeklySearch || data.dailyVolume,
            defaultDashboardData.weeklySearch
          ),
          platformShare: normalizeChartList(
            data.platformShare,
            defaultDashboardData.platformShare
          ),
          lifecycleAnalysis: normalizeChartList(
            data.lifecycleAnalysis,
            defaultDashboardData.lifecycleAnalysis
          ),
        });
      } catch (error) {
        console.error("생애 주기 데이터 조회 오류:", error);
        setDashboardData(defaultDashboardData);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLifecycleData();
  }, []);

  const summaryCards = useMemo(() => dashboardData.summary, [dashboardData]);

  return (
    <div className="lc-page">
      <div className="lc-phone-frame">
        <main className="lc-content">
          <div className="lc-back-wrap">
            <Link to="/trend" className="lc-back-btn">
              <ArrowLeft size={16} />
              <span>카테고리로 돌아가기</span>
            </Link>
          </div>

          <section className="lc-section">
            <div className="lc-header">
              <span className="lc-eyebrow">LIFECYCLE DASHBOARD</span>
              <h2 className="lc-title">생애 주기 분석</h2>
              <p className="lc-description">
                밈의 생성부터 확산, 하락까지 흐름을 확인하는 분석 페이지
              </p>
            </div>

            {isLoading && (
              <div className="lc-status-box">생애 주기 데이터를 불러오는 중입니다.</div>
            )}

            {!isLoading && isError && (
              <div className="lc-status-box">
                데이터를 불러오지 못해 기본 예시 데이터를 표시하고 있습니다.
              </div>
            )}

            <div className="lc-summary-grid">
              {summaryCards.map((item) => (
                <article
                  key={item.id}
                  className={`lc-summary-card ${getSummaryClass(item.status)}`}
                >
                  <span className="lc-summary-label">{item.label}</span>
                  <strong className="lc-summary-value">{item.value}</strong>
                  <span className="lc-summary-change">{item.change}</span>
                </article>
              ))}
            </div>

            <div className="lc-dashboard-grid">
              <section className="lc-card">
                <div className="lc-card-head">
                  <div className="lc-card-title-wrap">
                    <TrendingUp size={18} />
                    <h3>24시간 검색량 추이</h3>
                  </div>
                </div>
                <LifecycleLineChart data={dashboardData.hourlyTrend} />
              </section>

              <section className="lc-card">
                <div className="lc-card-head">
                  <div className="lc-card-title-wrap">
                    <BarChart3 size={18} />
                    <h3>요일별 검색량</h3>
                  </div>
                </div>
                <LifecycleBarChart data={dashboardData.weeklySearch} />
              </section>

              <section className="lc-card">
                <div className="lc-card-head">
                  <div className="lc-card-title-wrap">
                    <PieChart size={18} />
                    <h3>플랫폼 분포</h3>
                  </div>
                </div>
                <LifecycleDonutChart data={dashboardData.platformShare} />
              </section>

              <section className="lc-card">
                <div className="lc-card-head">
                  <div className="lc-card-title-wrap">
                    <Activity size={18} />
                    <h3>생애 주기 분석</h3>
                  </div>
                </div>

                <div className="lc-analysis-list">
                  {dashboardData.lifecycleAnalysis.map((item, index) => (
                    <div key={index} className="lc-analysis-item">
                      <div className="lc-analysis-row">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="lc-analysis-track">
                        <div
                          className={`lc-analysis-fill ${getAnalysisClass(item.colorType)}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Lifecycle;