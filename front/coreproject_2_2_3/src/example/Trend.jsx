import React, { useMemo, useState } from "react";
import {
  Dice5,
  FolderOpen,
  Flame,
  PlayCircle,
  Sparkles,
  Tags,
} from "lucide-react";

const categoryList = [
  {
    id: 1,
    name: "유행어",
    desc: "지금 가장 많이 따라 쓰는 밈",
    color: "linear-gradient(135deg, rgba(31,138,138,0.34), rgba(63,208,201,0.14))",
  },
  {
    id: 2,
    name: "챌린지",
    desc: "짧고 강하게 퍼지는 숏폼 챌린지",
    color: "linear-gradient(135deg, rgba(29,95,154,0.32), rgba(63,208,201,0.12))",
  },
  {
    id: 3,
    name: "동물",
    desc: "반응 좋은 귀여운 동물 밈",
    color: "linear-gradient(135deg, rgba(21,114,108,0.3), rgba(126,243,234,0.12))",
  },
  {
    id: 4,
    name: "게임",
    desc: "게임 플레이, 반응, 편집 밈",
    color: "linear-gradient(135deg, rgba(18,86,130,0.34), rgba(90,175,215,0.12))",
  },
  {
    id: 5,
    name: "연예",
    desc: "방송, 인터뷰, 무대 반응 밈",
    color: "linear-gradient(135deg, rgba(31,138,138,0.28), rgba(29,95,154,0.14))",
  },
  {
    id: 6,
    name: "드라마",
    desc: "장면 패러디와 대사 밈",
    color: "linear-gradient(135deg, rgba(13,77,94,0.36), rgba(63,208,201,0.1))",
  },
  {
    id: 7,
    name: "일상공감",
    desc: "누구나 공감하는 생활형 밈",
    color: "linear-gradient(135deg, rgba(25,108,104,0.3), rgba(111,233,224,0.12))",
  },
  {
    id: 8,
    name: "패러디",
    desc: "편집과 합성 중심의 인기 밈",
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
  const [selectedCategory, setSelectedCategory] = useState("유행어");
  const [shuffleCount, setShuffleCount] = useState(0);

  const randomContent = useMemo(() => {
    const list = categoryContents[selectedCategory] || [];
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }, [selectedCategory, shuffleCount]);

  return (
    <div style={styles.page}>
      <section style={styles.heroCard}>
        <div style={styles.heroBadge}>
          <Sparkles size={14} />
          CATEGORY DISCOVERY
        </div>

        <h2 style={styles.heroTitle}>카테고리를 누르면 관심 밈을 빠르게 찾을 수 있어요</h2>
        <p style={styles.heroDesc}>
          사용자가 헷갈리지 않도록 카테고리 구조를 단순하게 정리하고,
          선택 즉시 랜덤 추천 밈이 보이도록 구성한 화면입니다.
        </p>

        <div style={styles.heroMetaRow}>
          <div style={styles.metaPill}>
            <FolderOpen size={14} />
            저장된 카테고리 탐색
          </div>
          <div style={styles.metaPill}>
            <Dice5 size={14} />
            랜덤 추천 연결
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <div>
            <span style={styles.eyebrow}>CATEGORY LIST</span>
            <h3 style={styles.sectionTitle}>밈 카테고리</h3>
          </div>

          <div style={styles.liveChip}>
            <Flame size={14} />
            빠른 진입
          </div>
        </div>

        <div style={styles.grid}>
          {categoryList.map((category) => {
            const active = selectedCategory === category.name;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                style={{
                  ...styles.categoryCard,
                  ...(active ? styles.categoryCardActive : {}),
                  background: active ? category.color : "rgba(255,255,255,0.03)",
                }}
              >
                <div style={styles.categoryTop}>
                  <span style={styles.categoryName}>{category.name}</span>
                  <Tags size={16} color={active ? "#dffffd" : "#98aeb6"} />
                </div>
                <p style={styles.categoryDesc}>{category.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <div>
            <span style={styles.eyebrow}>RANDOM PICK</span>
            <h3 style={styles.sectionTitle}>{selectedCategory} 랜덤 추천</h3>
          </div>
        </div>

        <article style={styles.randomCard}>
          <div style={styles.previewArea}>
            <div style={styles.previewOverlay}>
              <div style={styles.previewChip}>
                <PlayCircle size={16} />
                랜덤 영상 추천
              </div>
              <span style={styles.previewCategory}>{selectedCategory}</span>
            </div>
          </div>

          <div style={styles.randomBody}>
            <div style={styles.randomInfo}>
              <h4 style={styles.randomTitle}>
                {randomContent?.title || "추천 콘텐츠가 준비 중입니다"}
              </h4>
              <p style={styles.randomCreator}>{randomContent?.creator || "@trendformer"}</p>
              <div style={styles.randomTags}>
                <span>{randomContent?.tag || "#meme #trend"}</span>
                <span>{randomContent?.stats || "실시간 추천"}</span>
              </div>
            </div>

            <div style={styles.randomActions}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => setShuffleCount((prev) => prev + 1)}
              >
                <Dice5 size={18} />
                다른 랜덤 보기
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => alert(`${selectedCategory} 카테고리 영상 뷰어 연결 예정`)}
              >
                <PlayCircle size={18} />
                이 카테고리 보러가기
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

const styles = {
  page: {
    padding: "0 16px 28px",
    color: "#f2fbfb",
    boxSizing: "border-box",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    padding: "20px",
    borderRadius: "26px",
    marginBottom: "18px",
    background:
      "linear-gradient(180deg, rgba(13, 22, 34, 0.94) 0%, rgba(10, 18, 28, 0.98) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    color: "#dffffd",
    background:
      "linear-gradient(135deg, rgba(31,138,138,0.24) 0%, rgba(63,208,201,0.12) 100%)",
    border: "1px solid rgba(126,243,234,0.16)",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "14px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.22,
    letterSpacing: "-0.04em",
    color: "#f4fbfb",
  },
  heroDesc: {
    margin: "10px 0 0",
    color: "#b7c9cf",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  heroMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },
  metaPill: {
    height: "36px",
    padding: "0 14px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "#e7fbfa",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "12px",
    fontWeight: 700,
  },
  section: {
    marginBottom: "18px",
  },
  sectionHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: "4px",
    color: "#bafffb",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },
  sectionTitle: {
    margin: 0,
    color: "#f4fbfb",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  liveChip: {
    height: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#d9fffd",
    background: "rgba(63,208,201,0.1)",
    border: "1px solid rgba(63,208,201,0.14)",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  categoryCard: {
    textAlign: "left",
    padding: "16px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: "108px",
  },
  categoryCardActive: {
    border: "1px solid rgba(126,243,234,0.18)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
  },
  categoryTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "10px",
  },
  categoryName: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#f4fbfb",
    letterSpacing: "-0.03em",
  },
  categoryDesc: {
    margin: 0,
    color: "#b7c9cf",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  randomCard: {
    overflow: "hidden",
    borderRadius: "26px",
    background:
      "linear-gradient(180deg, rgba(13, 22, 34, 0.94) 0%, rgba(10, 18, 28, 0.98) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  previewArea: {
    height: "210px",
    background:
      "radial-gradient(circle at top left, rgba(63,208,201,0.2), transparent 30%), linear-gradient(135deg, #0c1725 0%, #08111b 100%)",
    position: "relative",
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  previewChip: {
    display: "inline-flex",
    width: "fit-content",
    alignItems: "center",
    gap: "7px",
    height: "34px",
    padding: "0 14px",
    borderRadius: "999px",
    color: "#f4fbfb",
    background: "rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "12px",
    fontWeight: 800,
  },
  previewCategory: {
    alignSelf: "flex-start",
    height: "34px",
    padding: "0 14px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(63,208,201,0.14)",
    border: "1px solid rgba(126,243,234,0.16)",
    color: "#dffffd",
    fontSize: "12px",
    fontWeight: 800,
  },
  randomBody: {
    padding: "18px",
  },
  randomInfo: {
    marginBottom: "16px",
  },
  randomTitle: {
    margin: 0,
    color: "#f4fbfb",
    fontSize: "21px",
    lineHeight: 1.3,
    letterSpacing: "-0.03em",
  },
  randomCreator: {
    margin: "8px 0 0",
    color: "#9db2b9",
    fontSize: "13px",
    fontWeight: 700,
  },
  randomTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  randomActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  primaryButton: {
    height: "48px",
    border: "none",
    borderRadius: "15px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    color: "#ffffff",
    background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)",
    boxShadow: "0 10px 20px rgba(35,157,160,0.22)",
  },
  secondaryButton: {
    height: "48px",
    borderRadius: "15px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    color: "#e5f4f4",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
};

export default Trend;