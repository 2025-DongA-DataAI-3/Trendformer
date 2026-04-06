import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, Play, X } from "lucide-react";
import "./CategoryVideos.css";
import "./Search.css";

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
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
};

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || "");

const getMediaUrl = (value) => {
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;
  if (value.startsWith("/")) return `http://localhost:3002${value}`;
  return `http://localhost:3002/uploads/${value}`;
};

const getYoutubeEmbedUrl = (url) => {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) return url;

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }

  const shortsMatch = url.match(/shorts\/([^?&]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
  }

  return url;
};

const getInstagramEmbedUrl = (url) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  if (cleanUrl.includes("/embed")) return cleanUrl;
  return cleanUrl.endsWith("/") ? `${cleanUrl}embed` : `${cleanUrl}/embed`;
};

const getTikTokEmbedUrl = (url) => {
  if (!url) return "";

  const cleanUrl = String(url).trim();
  const match = cleanUrl.match(/\/video\/(\d+)/);

  if (!match) return "";

  const videoId = match[1];
  return `https://www.tiktok.com/embed/v3/${videoId}`;
};

const normalizeVideoData = (video) => {
  const originalUrl =
    video.ORIGINAL_LINK ||
    video.ORIGINAL_URL ||
    video.CONTENT_URL ||
    video.URL ||
    video.url ||
    "";

  const filePath = video.FILE_PATH || video.file_path || "";
  const playableUrl = originalUrl || getMediaUrl(filePath);

  return {
    id: video.CONTENT_ID || video.content_id || video.id,
    platform:
      video.PLATFORM ||
      video.platform ||
      video.PLATFORM_TYPE ||
      video.platform_type ||
      "YOUTUBE",
    creator:
      video.CREATOR ||
      video.creator ||
      video.CHANNEL_NAME ||
      video.channel_name ||
      video.USER_ID ||
      video.user_id ||
      "@unknown",
    creatorName:
      video.CREATOR_NAME ||
      video.creator_name ||
      video.CREATOR ||
      video.creator ||
      video.CHANNEL_NAME ||
      video.channel_name ||
      video.USER_ID ||
      video.user_id ||
      "unknown",
    title: video.TITLE || video.title || "제목 없음",
    description:
      video.CONTENT ||
      video.content ||
      video.DESCRIPTION ||
      video.description ||
      "",
    thumbnail:
      video.THUMBNAIL_PATH ||
      video.thumbnail_url ||
      video.THUMBNAIL ||
      video.thumbnail ||
      getYoutubeThumbnail(originalUrl || playableUrl) ||
      "https://via.placeholder.com/600x900?text=No+Image",
    likes: Number(video.LIKE_COUNT || video.like_count || video.likes || 0),
    saved: Number(video.SAVED_COUNT || video.saved_count || video.saved || 0),
    url: playableUrl,
    originalUrl: originalUrl || playableUrl,
    createdAt: video.CREATED_AT || video.created_at || "",
    filePath,
  };
};

const CategoryVideos = () => {
  const { categoryId: categoryIdParam } = useParams();
  const categoryId = Number(categoryIdParam);

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

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

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setSelectedVideo(null);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const openVideoModal = (video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const renderModalMedia = (video) => {
    const platform = String(video.platform || "").toLowerCase();

    if (platform.includes("youtube")) {
      return (
        <iframe
          src={getYoutubeEmbedUrl(video.originalUrl || video.url)}
          className="tf-video-modal-video"
          title={video.title || "youtube modal"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (platform.includes("instagram")) {
      return (
        <iframe
          src={getInstagramEmbedUrl(video.originalUrl || video.url)}
          className="tf-video-modal-video instagram-modal-frame"
          title={video.title || "instagram modal"}
          allowFullScreen
        />
      );
    }

    if (platform.includes("tiktok")) {
  const tiktokEmbedUrl = getTikTokEmbedUrl(video.originalUrl || video.url);

  if (!tiktokEmbedUrl) {
    return (
      <div className="tf-video-modal-video tf-search-card-empty">
        틱톡 주소 없음
      </div>
    );
  }

  return (
    <iframe
      src={tiktokEmbedUrl}
      className="tf-video-modal-video tiktok-modal-frame"
      title={video.title || "tiktok modal"}
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

    return (
      <video
        src={video.url}
        className="tf-video-modal-video"
        controls
        autoPlay
        playsInline
      />
    );
  };

  const buildTagText = (video) => {
    const tags = [
      video.platform ? `#${String(video.platform).toLowerCase()}` : null,
      currentCategory.title ? `#${currentCategory.title.replace(/\s+/g, "")}` : null,
      "#meme",
    ].filter(Boolean);

    return tags.join(" ");
  };

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

                  <button
                    type="button"
                    className="cv-play-btn"
                    aria-label="영상 재생"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVideoModal(video);
                    }}
                  >
                    <Play size={18} fill="currentColor" />
                  </button>

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

      {selectedVideo && (
        <div className="tf-video-modal-overlay" onClick={closeVideoModal}>
          <div className="tf-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="tf-video-modal-close"
              onClick={closeVideoModal}
            >
              <X size={22} />
            </button>

            <div
              className={`tf-video-modal-player-wrap ${
                String(selectedVideo.platform || "").toLowerCase().includes("instagram")
                  ? "instagram-modal"
                  : String(selectedVideo.platform || "").toLowerCase().includes("tiktok")
                  ? "tiktok-modal"
                  : ""
              }`}
            >
              {renderModalMedia(selectedVideo)}
            </div>

            <div className="tf-video-modal-info">
              <div className="tf-video-modal-floating">
                <button type="button" className="tf-floating-btn">
                  <Heart size={18} />
                  <span>{selectedVideo.likes}</span>
                </button>

                <button type="button" className="tf-floating-btn">
                  <Bookmark size={18} />
                  <span>저장</span>
                </button>
              </div>

              <div className="tf-video-post-header">
                <div className="tf-video-post-user">
                  <div className="tf-video-post-avatar">
                    {(selectedVideo.creatorName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="tf-video-post-user-text">
                    <strong>{selectedVideo.creatorName || "unknown"}</strong>
                    <span>{selectedVideo.platform || "platform"}</span>
                  </div>
                </div>
                <div className="tf-video-post-date">
                  {selectedVideo.createdAt || ""}
                </div>
              </div>

              <h3>{selectedVideo.title || "제목 없음"}</h3>
              <p>
                {selectedVideo.description
                  ? selectedVideo.description
                  : `플랫폼 · ${selectedVideo.platform || "정보 없음"}`}
              </p>

              {selectedVideo.originalUrl && (
                <a
                  href={selectedVideo.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tf-original-link"
                >
                  원본 보러가기
                </a>
              )}

              <div
                style={{
                  marginTop: "18px",
                  fontSize: "12px",
                  color: "#5b7380",
                  fontWeight: 700,
                }}
              >
                {buildTagText(selectedVideo)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryVideos;