import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import "./ImageSlider.css";
import { useLocation } from "react-router-dom";

const LIKE_STORAGE_KEY = "postLikes";
const SAVED_POSTS_KEY = "savedPosts";
const MEDIA_WINDOW = 1; // 현재 기준 앞뒤 1개만 실제 미디어 렌더링

const getLoginUserId = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    return storedUser?.USER_ID || storedUser?.id || null;
  } catch {
    return null;
  }
};

const getVideoUrl = (filePath) => {
  if (!filePath || !String(filePath).trim()) return null;

  const cleanPath = String(filePath).trim();

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  if (cleanPath.startsWith("/")) {
    return `http://localhost:3002${cleanPath}`;
  }

  return `http://localhost:3002/uploads/${cleanPath}`;
};

const isPlayableVideoUrl = (url) => {
  if (!url) return false;

  const cleanUrl = String(url).toLowerCase();

  if (cleanUrl.includes(".mp4")) return true;
  if (cleanUrl.includes("mime=video%2fmp4")) return true;
  if (cleanUrl.includes("mime=video/mp4")) return true;
  if (cleanUrl.includes("googlevideo.com/videoplayback")) return true;

  return false;
};

const getInstagramEmbedUrl = (url) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  if (cleanUrl.includes("/embed")) return cleanUrl;
  const noQuery = cleanUrl.split("?")[0];
  const normalized = noQuery.endsWith("/") ? noQuery : `${noQuery}/`;
  return `${normalized}embed`;
};

const getTikTokPlayerUrl = (url) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/\/video\/(\d+)/);
  if (!match) return "";
  const videoId = match[1];
  return `https://www.tiktok.com/player/v1/${videoId}?controls=1&description=0&music_info=0&autoplay=1&loop=1`;
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";

  const cleanUrl = String(url).trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match?.[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${videoId}&controls=1&rel=0`;
    }
  }

  return "";
};

const postTikTokCommand = (iframeEl, type, value) => {
  if (!iframeEl?.contentWindow) return;
  iframeEl.contentWindow.postMessage(
    { "x-tiktok-player": true, type, value },
    "*"
  );
};

const makeTag = (value) => {
  if (!value) return null;
  return `#${String(value).replace(/\s+/g, "")}`;
};

const SlideItem = ({
  item,
  slideIndex,
  activeIndex,
  likeInfo,
  saved,
  expandedPost,
  toggleExpanded,
  toggleLike,
  toggleSave,
  goPrev,
  goNext,
  total,
  videoRefs,
  tikTokRefs,
  progress,
  onVideoTimeUpdate,
  onVideoLoadedMetadata,
}) => {
  const isActive = slideIndex === activeIndex;
  const shouldRenderMedia = Math.abs(slideIndex - activeIndex) <= MEDIA_WINDOW;

  const isTikTok = item.PLATFORM_TYPE?.toLowerCase() === "tiktok";
  const isInstagram = item.PLATFORM_TYPE?.toLowerCase() === "instagram";
  const isYoutube = item.PLATFORM_TYPE?.toLowerCase() === "youtube";

  const videoUrl = getVideoUrl(item.FILE_PATH);
  const instagramEmbedUrl = getInstagramEmbedUrl(
    item.ORIGINAL_LINK || item.FILE_PATH || ""
  );
  const tikTokPlayerUrl = getTikTokPlayerUrl(item.ORIGINAL_LINK || "");
  const youtubeEmbedUrl = getYouTubeEmbedUrl(
    item.ORIGINAL_LINK || item.FILE_PATH || ""
  );

  const keywordTag = makeTag(item.KEYWORD_NAME);
  const platformTag = makeTag(item.PLATFORM_TYPE || "trend");

  return (
    <div className="slide">
      <div className="video-frame">
        {!shouldRenderMedia ? (
          <div className="content-video" />
        ) : isTikTok ? (
          tikTokPlayerUrl ? (
            <div className="embed-crop tiktok-crop">
              <iframe
                ref={(el) => {
                  if (el) tikTokRefs.current[item.CONTENT_ID] = el;
                  else delete tikTokRefs.current[item.CONTENT_ID];
                }}
                src={tikTokPlayerUrl}
                title={item.TITLE || "tiktok embed"}
                className="embed-frame tiktok-frame"
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="content-video">틱톡 주소가 없습니다.</div>
          )
        ) : isInstagram ? (
          instagramEmbedUrl ? (
            <div className="embed-crop instagram-crop">
              <iframe
                src={instagramEmbedUrl}
                title={item.TITLE || "instagram embed"}
                className="embed-frame instagram-frame"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="content-video">인스타그램 주소가 없습니다.</div>
          )
        ) : isYoutube ? (
          videoUrl && isPlayableVideoUrl(videoUrl) ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current[item.CONTENT_ID] = el;
                else delete videoRefs.current[item.CONTENT_ID];
              }}
              className="content-video"
              src={videoUrl}
              muted
              loop
              playsInline
              preload={isActive ? "auto" : "metadata"}
              controls={false}
              onTimeUpdate={() => onVideoTimeUpdate(item.CONTENT_ID)}
              onLoadedMetadata={() => onVideoLoadedMetadata(item.CONTENT_ID)}
            />
          ) : youtubeEmbedUrl ? (
            <div className="embed-crop youtube-crop">
              <iframe
                src={youtubeEmbedUrl}
                title={item.TITLE || "youtube embed"}
                className="embed-frame youtube-frame"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="content-video">유튜브 주소가 없습니다.</div>
          )
        ) : videoUrl && isPlayableVideoUrl(videoUrl) ? (
          <video
            ref={(el) => {
              if (el) videoRefs.current[item.CONTENT_ID] = el;
              else delete videoRefs.current[item.CONTENT_ID];
            }}
            className="content-video"
            src={videoUrl}
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            controls={false}
            onTimeUpdate={() => onVideoTimeUpdate(item.CONTENT_ID)}
            onLoadedMetadata={() => onVideoLoadedMetadata(item.CONTENT_ID)}
          />
        ) : (
          <div className="content-video">영상 주소가 없습니다.</div>
        )}

        <div className="video-progress">
          <div
            className="video-progress-fill"
            style={{ width: `${progress || 0}%` }}
          />
        </div>

        <div className="video-gradient" />

        <div className="video-overlay">
          <div className="video-meta-line">
            <span className="video-category">{item.PLATFORM_TYPE || "Meme"}</span>
            <span className="video-user">@{item.CREATOR_NAME || item.USER_ID || "unknown"}</span>
          </div>

          <h4
            className={`video-title ${
              expandedPost === item.CONTENT_ID ? "expanded" : "collapsed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(item.CONTENT_ID);
            }}
          >
            {item.TITLE || "지금 뜨는 밈 콘텐츠"}
          </h4>

          {expandedPost === item.CONTENT_ID && item.ORIGINAL_LINK && (
            <a
              href={item.ORIGINAL_LINK}
              target="_blank"
              rel="noreferrer"
              className="origin-link"
              onClick={(e) => e.stopPropagation()}
            >
              원본 보러가기
            </a>
          )}

          <div className="video-tags">
            {platformTag && <span>{platformTag}</span>}
            <span>#shorts</span>
            {keywordTag ? <span>{keywordTag}</span> : <span>#meme</span>}
          </div>
        </div>

        <div className="video-actions">
          <button
            type="button"
            className={`action-btn ${likeInfo.liked ? "liked" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(item);
            }}
          >
            <Heart size={20} fill={likeInfo.liked ? "currentColor" : "none"} />
            <span>{likeInfo.count}</span>
          </button>

          <button
            type="button"
            className={`action-btn ${saved ? "saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(item);
            }}
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
            disabled={slideIndex === 0}
          >
            <ChevronUp size={16} />
          </button>
          <span className="hint-count">
            {slideIndex + 1} / {total}
          </span>
          <button
            type="button"
            className="hint-btn"
            onClick={goNext}
            disabled={slideIndex === total - 1}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MemoSlideItem = React.memo(SlideItem);

const ImageSlider = () => {
  const location = useLocation();

  const [index, setIndex] = useState(0);
  const [contents, setContents] = useState([]);
  const [likeState, setLikeState] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  const touchStartY = useRef(0);
  const wheelLock = useRef(false);
  const videoRefs = useRef({});
  const tikTokRefs = useRef({});

  const goNext = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, contents.length - 1));
  }, [contents.length]);

  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleExpanded = useCallback((postId) => {
    setExpandedPost((prev) => (prev === postId ? null : postId));
  }, []);

  const handleVideoTimeUpdate = useCallback((contentId) => {
    const video = videoRefs.current[contentId];
    if (!video || !video.duration) return;

    const progress = (video.currentTime / video.duration) * 100;
    setProgressMap((prev) => ({ ...prev, [contentId]: progress }));
  }, []);

  const handleVideoLoadedMetadata = useCallback((contentId) => {
    setProgressMap((prev) => ({ ...prev, [contentId]: 0 }));
  }, []);

  useEffect(() => {
    const storedLikes = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};
    const storedSavedPosts = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];
    setLikeState(storedLikes);
    setSavedPosts(storedSavedPosts);
  }, []);

  useEffect(() => {
    if (location.state?.reset) {
      setIndex(0);
    }
  }, [location]);

  useEffect(() => {
    let isMounted = true;

    const fetchContents = async () => {
      try {
        const res = await fetch("http://localhost:3002/content/top100");
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);

        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];

        const uniqueData = Array.from(
          new Map(safeData.map((item) => [item.CONTENT_ID, item])).values()
        );

        if (isMounted) {
          setContents(uniqueData);
          setIndex(0);
        }
      } catch (err) {
        console.error("AI 랭킹 콘텐츠 불러오기 실패:", err);
      }
    };

    fetchContents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    const active = contents[index];
    if (!active) return;

    const platform = active.PLATFORM_TYPE?.toLowerCase();

    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return;

      if (Number(id) !== Number(active.CONTENT_ID)) {
        try {
          video.pause();
          video.currentTime = 0;
        } catch (e) {
          console.log("비활성 영상 정지 실패:", e);
        }
      }
    });

    Object.entries(tikTokRefs.current).forEach(([id, iframe]) => {
      if (!iframe) return;

      if (Number(id) !== Number(active.CONTENT_ID)) {
        postTikTokCommand(iframe, "pause");
        postTikTokCommand(iframe, "seek", 0);
      }
    });

    if (platform === "instagram") return;

    if (platform === "tiktok") {
      const activeTikTok = tikTokRefs.current[active.CONTENT_ID];
      if (activeTikTok) {
        postTikTokCommand(activeTikTok, "seek", 0);
        postTikTokCommand(activeTikTok, "play");
      }
      return;
    }

    const activeVideo = videoRefs.current[active.CONTENT_ID];
    if (!activeVideo) return;

    activeVideo.muted = true;
    activeVideo.playsInline = true;

    const playPromise = activeVideo.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch((err) => {
        console.log("자동재생 실패:", err);
      });
    }
  }, [index, contents]);

  const getLikeInfo = useCallback((postId, baseLikes = 0) => {
    const saved = likeState[postId];
    if (!saved) return { count: Number(baseLikes) || 0, liked: false };
    return saved;
  }, [likeState]);

  const isSaved = useCallback(
    (postId) => savedPosts.some((item) => item.id === postId),
    [savedPosts]
  );

  const createSavedPost = useCallback((post, nextCount) => ({
    id: post.CONTENT_ID,
    img: getVideoUrl(post.FILE_PATH),
    category: post.PLATFORM_TYPE || "Meme",
    title: post.TITLE || "제목 없음",
    desc: `${post.USER_ID || "unknown"}님의 게시물`,
    tags: post.KEYWORD_NAME
      ? [`#${post.PLATFORM_TYPE}`, `#${String(post.KEYWORD_NAME).replace(/\s+/g, "")}`]
      : [`#${post.PLATFORM_TYPE || "meme"}`],
    saves: nextCount,
    userId: post.USER_ID || "unknown",
    nickname: post.USER_ID || "unknown",
    date: post.CREATED_AT || "",
    filePath: getVideoUrl(post.FILE_PATH),
    originalUrl: post.ORIGINAL_LINK || "",
    isVideo: true,
  }), []);

  const toggleLike = useCallback(async (post) => {
    const userId = getLoginUserId();
    const postId = post.CONTENT_ID;

    if (!userId || !postId) {
      console.error("좋아요 처리 실패: userId 또는 contentId 없음");
      return;
    }

    const current = getLikeInfo(postId, 0);

    try {
      const res = await fetch("http://localhost:3002/interaction/like", {
        method: current.liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          content_id: postId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "좋아요 처리 실패");
      }

      const next = {
        liked: !current.liked,
        count: current.liked
          ? Math.max(current.count - 1, 0)
          : current.count + 1,
      };

      setLikeState((prev) => {
        const updatedLikes = { ...prev, [postId]: next };
        localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(updatedLikes));
        return updatedLikes;
      });
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  }, [getLikeInfo]);

  const toggleSave = useCallback(async (post) => {
    const userId = getLoginUserId();
    const postId = post.CONTENT_ID;

    if (!userId || !postId) {
      console.error("북마크 처리 실패: userId 또는 contentId 없음");
      return;
    }

    const saved = isSaved(postId);

    try {
      const res = await fetch("http://localhost:3002/interaction/bookmark", {
        method: saved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          content_id: postId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "북마크 처리 실패");
      }

      setSavedPosts((prev) => {
        const likeInfo = getLikeInfo(postId, 0);

        const nextSaved = saved
          ? prev.filter((item) => item.id !== postId)
          : [
              createSavedPost(post, likeInfo.count),
              ...prev.filter((item) => item.id !== postId),
            ];

        localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextSaved));
        return nextSaved;
      });
    } catch (error) {
      console.error("보관 처리 실패:", error);
    }
  }, [createSavedPost, getLikeInfo, isSaved]);

  const slideItems = useMemo(
    () =>
      contents.map((item, realIndex) => ({
        item,
        realIndex,
      })),
    [contents]
  );

  const handleTouchStart = (e) => {
    touchStartY.current = e.changedTouches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY;

    if (Math.abs(diff) < 40) return;

    if (diff > 0) goNext();
    else goPrev();
  };

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
        }, 300);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="slider"
        style={{ transform: `translateY(-${index * 100}%)` }}
      >
        {slideItems.map(({ item, realIndex }) => (
          <MemoSlideItem
            key={`${item.CONTENT_ID}_${realIndex}`}
            item={item}
            slideIndex={realIndex}
            activeIndex={index}
            likeInfo={getLikeInfo(item.CONTENT_ID, 0)}
            saved={isSaved(item.CONTENT_ID)}
            expandedPost={expandedPost}
            toggleExpanded={toggleExpanded}
            toggleLike={toggleLike}
            toggleSave={toggleSave}
            goPrev={goPrev}
            goNext={goNext}
            total={contents.length}
            videoRefs={videoRefs}
            tikTokRefs={tikTokRefs}
            progress={progressMap[item.CONTENT_ID] || 0}
            onVideoTimeUpdate={handleVideoTimeUpdate}
            onVideoLoadedMetadata={handleVideoLoadedMetadata}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;