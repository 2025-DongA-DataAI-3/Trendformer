import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Play,
} from "lucide-react";
import "./ImageSlider.css";
import TikTokCard from "./TikTokCard"; // 필요시 삭제

const LIKE_STORAGE_KEY = "postLikes";
const SAVED_POSTS_KEY = "savedPosts";

const ImageSlider = () => {
  const [index, setIndex] = useState(0);
  const [contents, setContents] = useState([]);
  const [likeState, setLikeState] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const touchStartY = useRef(0);
  const videoRefs = useRef({});
  const wheelLock = useRef(false);
  const [isPlaying, setIsPlaying] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  const handleTimeUpdate = (contentId) => {
    const video = videoRefs.current[contentId];
    if (!video || !video.duration) return;

    const progress = (video.currentTime / video.duration) * 100;

    setProgressMap((prev) => ({
      ...prev,
      [contentId]: progress,
    }));
  };

  const handleLoadedMetadata = (contentId) => {
    setProgressMap((prev) => ({
      ...prev,
      [contentId]: 0,
    }));
  };

  const toggleExpanded = (postId) => {
    setExpandedPost((prev) => (prev === postId ? null : postId));
  };

  useEffect(() => {
    const storedLikes = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};
    const storedSavedPosts = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];

    setLikeState(storedLikes);
    setSavedPosts(storedSavedPosts);
  }, []);

  useEffect(() => {
    fetch("http://localhost:3002/content")
      .then((res) => res.json())
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setContents(safeData);
      })
      .catch((err) => {
        console.error("콘텐츠 불러오기 실패:", err);
      });
  }, []);

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, contents.length - 1));
  };

  const goPrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [contents.length]);

  const getVideoUrl = (filePath) => {
    if (!filePath) return "";

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    if (filePath.startsWith("/")) {
      return `http://localhost:3002${filePath}`;
    }

    return `http://localhost:3002/uploads/${filePath}`;
  };

  const getLikeInfo = (postId, baseLikes = 0) => {
    const saved = likeState[postId];
    if (!saved) {
      return { count: baseLikes, liked: false };
    }
    return saved;
  };

  const isSaved = (postId) => {
    return savedPosts.some((item) => item.id === postId);
  };

  const createSavedPost = (post, nextCount) => {
    return {
      id: post.CONTENT_ID,
      img: getVideoUrl(post.FILE_PATH),
      category: post.PLATFORM_TYPE || "Meme",
      title: post.TITLE || "제목 없음",
      desc: `${post.USER_ID || "unknown"}님의 게시물`,
      tags: post.PLATFORM_TYPE ? [`#${post.PLATFORM_TYPE}`] : ["#meme"],
      saves: nextCount,
      userId: post.USER_ID || "unknown",
      nickname: post.USER_ID || "unknown",
      date: post.CREATED_AT || "",
      filePath: getVideoUrl(post.FILE_PATH),
      originalUrl: post.ORIGINAL_URL || post.ORIGINAL_LINK || "",
      isVideo: true,
    };
  };

  const toggleLike = (post) => {
    const postId = post.CONTENT_ID;
    const current = getLikeInfo(postId, Number(post.LIKES) || 0);
    const willLike = !current.liked;

    const next = {
      liked: willLike,
      count: willLike ? current.count + 1 : Math.max(current.count - 1, 0),
    };

    const updatedLikes = {
      ...likeState,
      [postId]: next,
    };

    setLikeState(updatedLikes);
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(updatedLikes));

    const currentSaved = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];

    if (willLike) {
      const exists = currentSaved.some((item) => item.id === postId);

      let nextSaved;
      if (exists) {
        nextSaved = currentSaved.map((item) =>
          item.id === postId ? { ...item, saves: next.count } : item
        );
      } else {
        nextSaved = [createSavedPost(post, next.count), ...currentSaved];
      }

      setSavedPosts(nextSaved);
      localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextSaved));
      return;
    }

    const nextSaved = currentSaved.filter((item) => item.id !== postId);
    setSavedPosts(nextSaved);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextSaved));
  };

  const toggleSave = (post) => {
    const postId = post.CONTENT_ID;
    const currentSaved = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];
    const exists = currentSaved.some((item) => item.id === postId);

    let nextSaved;

    if (exists) {
      nextSaved = currentSaved.filter((item) => item.id !== postId);
    } else {
      const likeInfo = getLikeInfo(postId, Number(post.LIKES) || 0);
      nextSaved = [createSavedPost(post, likeInfo.count), ...currentSaved];
    }

    setSavedPosts(nextSaved);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextSaved));
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.changedTouches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY;

    if (Math.abs(diff) < 40) return;

    if (diff > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  const togglePlayPause = (contentId) => {
    const video = videoRefs.current[contentId];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying((prev) => ({ ...prev, [contentId]: true }));
    } else {
      video.pause();
      setIsPlaying((prev) => ({ ...prev, [contentId]: false }));
    }
  };

  useEffect(() => {
  const active = contents[index];
  if (!active) return;

  const isTikTok = active.PLATFORM_TYPE?.toLowerCase() === "tiktok";

  Object.entries(videoRefs.current).forEach(([id, video]) => {
    if (!video) return;

    if (Number(id) !== Number(active.CONTENT_ID)) {
      video.pause();
      video.currentTime = 0;
    }
  });

  if (isTikTok) {
    return;
  }

  const activeVideo = videoRefs.current[active.CONTENT_ID];
  if (!activeVideo) return;

  activeVideo.muted = true;
  activeVideo
    .play()
    .then(() => {
      setIsPlaying({ [active.CONTENT_ID]: true });
    })
    .catch((err) => {
      console.log("자동재생 실패:", err);
    });
}, [index, contents]);

  const activeItem = useMemo(() => contents[index] || null, [contents, index]);

  if (!contents.length) {
    return (
      <div className="viewer loading-viewer">
        <div className="viewer-empty-card">
          <div className="viewer-empty-badge">
            <Sparkles size={14} />
            LOADING
          </div>
          <h4>트렌드 피드를 불러오는 중입니다</h4>
          <p>실시간 밈 데이터를 연결하면 여기서 바로 숏폼처럼 볼 수 있어요.</p>
        </div>
      </div>
    );
  }

  return (

    <div
      className="viewer"
      onWheel={(e) => {
        if (wheelLock.current) return;

        wheelLock.current = true;

        if (e.deltaY > 0) goNext();
        if (e.deltaY < 0) goPrev();

        setTimeout(() => {
          wheelLock.current = false;
        }, 350);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="slider"
        style={{
          transform: `translateY(-${index * 100}%)`,
        }}
      >
        {contents.map((item, i) => {
          const likeInfo = getLikeInfo(item.CONTENT_ID, Number(item.LIKES) || 0);
          const saved = isSaved(item.CONTENT_ID);
          const shouldRenderVideo = Math.abs(i - index) <= 1;
          const isTikTok = item.PLATFORM_TYPE?.toLowerCase() === "tiktok"; //삭제
          const videoUrl = getVideoUrl(item.FILE_PATH);//삭제

          return (
            <div className="slide" key={item.CONTENT_ID || i}>
  <div className="video-frame">
    {shouldRenderVideo ? (
      isTikTok ? (
        <TikTokCard videoId={item.TIKTOK_VIDEO_ID || item.CONTENT_ID} />
      ) : videoUrl ? (
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[item.CONTENT_ID] = el;
            } else {
              delete videoRefs.current[item.CONTENT_ID];
            }
          }}
          className="content-video"
          src={videoUrl}
          muted
          autoPlay={i === index}
          loop
          playsInline
          controls={false}
          preload={i === index ? "auto" : "none"}
          onClick={() => togglePlayPause(item.CONTENT_ID)}
          onLoadedData={() => {
            if (i === index) {
              const video = videoRefs.current[item.CONTENT_ID];
              if (video) {
                video.muted = true;
                video.play().catch((err) => {
                  console.log("로드 후 재생 실패:", err);
                });
              }
            }
          }}
          onTimeUpdate={() => handleTimeUpdate(item.CONTENT_ID)}
          onLoadedMetadata={() => handleLoadedMetadata(item.CONTENT_ID)}
        />
      ) : (
        <div className="content-video">영상 주소가 없습니다.</div>
      )
    ) : (
      <div className="content-video" />
    )}
                
                <div className="video-progress">
                  <div
                    className="video-progress-fill"
                    style={{ width: `${progressMap[item.CONTENT_ID] || 0}%` }}
                  />
                </div>

                <div className="video-gradient" />

                <div className="viewer-top-chip">
                  <span className="viewer-live-dot" />
                  {i < 10 ? `${i + 1}위 🔥` : `${i + 1}위`}
                </div>

                <div className="video-overlay">
                  <div className="video-meta-line">
                    <span className="video-category">
                      {item.PLATFORM_TYPE || "Meme"}
                    </span>
                    <span className="video-user">@{item.USER_ID || "unknown"}</span>
                  </div>

                  <h4
                    className={`video-title ${expandedPost === item.CONTENT_ID ? "expanded" : "collapsed"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(item.CONTENT_ID);
                    }}
                  >

                    {item.TITLE || "지금 뜨는 밈 콘텐츠"}
                  </h4>
                  {expandedPost === item.CONTENT_ID &&
                    (item.ORIGINAL_URL || item.ORIGINAL_LINK) && (
                      <a
                        href={item.ORIGINAL_URL || item.ORIGINAL_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="origin-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        원본 보러가기
                      </a>
                    )}
                  <div className="video-tags">
                    <span>#{item.PLATFORM_TYPE || "trend"}</span>
                    <span>#shorts</span>
                    <span>#meme</span>
                  </div>

                </div>

                <div className="video-actions">
                  <button
                    type="button"
                    className={`action-btn ${likeInfo.liked ? "liked" : ""}`}
                    onClick={() => toggleLike(item)}
                  >
                    <Heart
                      size={20}
                      fill={likeInfo.liked ? "currentColor" : "none"}
                    />
                    <span>{likeInfo.count}</span>
                  </button>

                  <button
                    type="button"
                    className={`action-btn ${saved ? "saved" : ""}`}
                    onClick={() => toggleSave(item)}
                  >
                    <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
                    <span>{saved ? "저장됨" : "저장"}</span>
                  </button>
                </div>

                <div className="viewer-nav-hint">
                  <button
                    type="button"
                    className="hint-btn"
                    onClick={goPrev}
                    disabled={index === 0}
                  >
                    <ChevronUp size={16} />
                  </button>

                  <span className="hint-count">
                    {index + 1} / {contents.length}
                  </span>

                  <button
                    type="button"
                    className="hint-btn"
                    onClick={goNext}
                    disabled={index === contents.length - 1}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {i === index && (
                  <div className="viewer-play-badge">
                    <Play size={12} fill="currentColor" />
                    NOW PLAYING
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeItem && (
        <div className="viewer-bottom-summary">
          <strong>지금 보고 있는 밈</strong>
          <span>{activeItem.TITLE || "제목 없음"}</span>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;