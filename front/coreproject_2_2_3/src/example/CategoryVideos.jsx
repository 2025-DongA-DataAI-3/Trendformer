import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, Play } from "lucide-react";
import "./CategoryVideos.css";

const categoryMap = {
  1: {
    title: "챌린지 & 댄스",
    description: "틱톡/릴스 댄스 유행, 댄스 챌린지, 댄스 커버 특집",
  },
  2: {
    title: "유머 & 상황극",
    description: "스케치 코미디, 일상 공감, 병맛 밈, 밈 드라마",
  },
  3: {
    title: "게임 & 테크",
    description: "리그오브레전드, 로스트아크 등 게임 플레이, 테크 밈",
  },
  4: {
    title: "아이돌 & 듀엣",
    description: "K-POP 직캠, 라이브 편집 영상, 팬 리액션 콘텐츠",
  },
  5: {
    title: "라이프스타일",
    description: "브이로그, 자취 요리, 패션 OOTD, 운동 밈",
  },
  6: {
    title: "동물 & 힐링",
    description: "강아지/고양이 등 귀여운 동물 영상, 힐링 및 ASMR",
  },
  7: {
    title: "이슈/리액션",
    description: "뉴스 반응, 커뮤니티 논란, 반응/비평 영상",
  },
};

const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
};


const normalizeVideoData = (video) => {
  const originalUrl = video.ORIGINAL_LINK || video.ORIGINAL_URL || "";
  return {
    id: video.CONTENT_ID || video.content_id || video.id,
    platform: video.PLATFORM || video.platform || "YOUTUBE",
    creator:
      video.CREATOR ||
      video.creator ||
      video.CHANNEL_NAME ||
      video.channel_name ||
      "@unknown",
    title: video.TITLE || video.title || "제목 없음",
    thumbnail:
      video.THUMBNAIL_PATH ||
      video.thumbnail_url ||
      video.THUMBNAIL ||
      video.thumbnail ||
      getYoutubeThumbnail(originalUrl) ||
      "https://via.placeholder.com/600x900?text=No+Image",
    likes: video.LIKE_COUNT || video.like_count || video.likes || 0,
    saved: video.SAVED_COUNT || video.saved_count || video.saved || 0,
    url:
      video.CONTENT_URL ||
      video.content_url ||
      video.URL ||
      video.url ||
      "",
  };
};

const CategoryVideos = () => {
  const { categoryId: categoryIdParam } = useParams();
  const categoryId = Number(categoryIdParam);

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const currentCategory = useMemo(() => {
    return (
      categoryMap[categoryId] || {
        title: "카테고리",
        description: "선택한 카테고리의 밈 영상을 확인해보세요.",
      }
    );
  }, [categoryId]);

  useEffect(() => {
    const fetchCategoryVideos = async () => {
      if (!categoryId || Number.isNaN(categoryId)) {
        setVideos([]);
        setIsLoading(false);
        setIsError(true);
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);

        const response = await fetch(
          `http://localhost:3002/api/categories/${categoryId}/contents`
        );

        if (!response.ok) {
          throw new Error("카테고리 영상 조회 실패");
        }

        const data = await response.json();
        const contents = Array.isArray(data.contents) ? data.contents : [];
        const normalizedVideos = contents.map(normalizeVideoData);

        setVideos(normalizedVideos);
      } catch (error) {
        console.error("카테고리 영상 조회 오류:", error);
        setVideos([]);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryVideos();
  }, [categoryId]);

  return (
    <div className="cv-page">
      <div className="cv-back-wrap">
        <Link to="/trend" className="cv-back-btn">
          <ArrowLeft size={16} />
          <span>카테고리로 돌아가기</span>
        </Link>
      </div>

      <section className="cv-list-section">
        <div className="cv-list-header">
          <span className="cv-list-eyebrow">VIDEO LIST</span>
          <h3 className="cv-list-title">{currentCategory.title} 영상 목록</h3>
        </div>

        {isLoading ? (
          <div className="cv-empty-box">
            <p>영상을 불러오는 중입니다.</p>
          </div>
        ) : isError ? (
          <div className="cv-empty-box">
            <p>영상을 불러오지 못했습니다.</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="cv-video-grid">
            {videos.map((video) => (
              <article key={video.id} className="cv-video-card">
                <div className="cv-thumb-wrap">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="cv-thumb"
                  />

                  <span className="cv-platform-badge">{video.platform}</span>

                  {video.url ? (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="cv-play-btn"
                      aria-label="영상 재생"
                    >
                      <Play size={18} fill="currentColor" />
                    </a>
                  ) : (
                    <button type="button" className="cv-play-btn" aria-label="재생">
                      <Play size={18} fill="currentColor" />
                    </button>
                  )}

                  <div className="cv-card-actions">
                    <button type="button" className="cv-action-pill">
                      <Heart size={14} />
                      <span>{video.likes}</span>
                    </button>
                    <button type="button" className="cv-action-pill">
                      <Bookmark size={14} />
                      <span>{video.saved}</span>
                    </button>
                  </div>

                  <div className="cv-thumb-gradient" />
                </div>

                <div className="cv-card-body">
                  <p className="cv-card-title">{video.title}</p>
                  <span className="cv-creator">{video.creator}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cv-empty-box">
            <p>아직 표시할 영상 카드가 없습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryVideos;