import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  X,
  Heart,
  Sparkles,
  History,
  WandSparkles,
  Play,
  Bookmark,
} from "lucide-react";
import "./Search.css";

const STORAGE_KEY = "searchHistory";
const LIKE_STORAGE_KEY = "postLikes";
const SAVED_POSTS_KEY = "savedPosts";

const defaultAiKeywords = [
  "유행어 밈",
  "챌린지 숏폼",
  "동물 리액션",
  "게임 밈",
  "공감짤",
  "드라마 패러디",
  "최신 밈",
  "오늘 뜨는 숏폼",
];

const Search = () => {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [showSuggestPanel, setShowSuggestPanel] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [likeState, setLikeState] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const searchAreaRef = useRef(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const savedLikes = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};
    const storedSavedPosts = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];

    setHistory(savedHistory);
    setLikeState(savedLikes);
    setSavedPosts(storedSavedPosts);
  }, []);

  const shuffleArray = (array) => {
    const copied = [...array];

    for (let i = copied.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }

    return copied;
  };

  useEffect(() => {
    fetch("http://localhost:3002/content")
      .then((res) => res.json())
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        const shuffled = shuffleArray(safeData);
        setContents(shuffled);
        setFilteredContents(shuffled);
      })
      .catch((err) => {
        console.error("콘텐츠 불러오기 실패:", err);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target)) {
        setShowSuggestPanel(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowSuggestPanel(false);
        setSelectedVideo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

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

  const saveHistory = (keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSearch = (keyword = query) => {
    const trimmed = keyword.trim();

    if (!trimmed) {
      setFilteredContents(shuffleArray(contents));
      setQuery("");
      setShowSuggestPanel(false);
      return;
    }

    saveHistory(trimmed);
    setQuery(trimmed);
    setShowSuggestPanel(false);

    const result = contents.filter((item) => {
      const text = `
        ${item.TITLE || ""}
        ${item.KEYWORDS || ""}
        ${item.PLATFORM_TYPE || ""}
        ${item.USER_ID || ""}
        ${item.CONTENT_ID || ""}
      `.toLowerCase();

      return text.includes(trimmed.toLowerCase());
    });

    setFilteredContents(shuffleArray(result));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleDeleteHistoryItem = (keyword) => {
    const updated = history.filter((item) => item !== keyword);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleResetSearch = () => {
    setQuery("");
    setFilteredContents(shuffleArray(contents));
    setShowSuggestPanel(false);
  };

  const openVideoModal = (item) => {
    setSelectedVideo(item);
    setShowSuggestPanel(false);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const getLikeInfo = (postId, baseLikes = 0) => {
    const saved = likeState[postId];
    if (!saved) {
      return { count: Number(baseLikes) || 0, liked: false };
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

  const personalizedKeywords = useMemo(() => {
    const source = [...history, ...defaultAiKeywords];
    const unique = [...new Set(source)].filter(Boolean);

    const mapped = unique.map((keyword, index) => ({
      id: `${keyword}-${index}`,
      label: keyword,
      reason:
        index < Math.max(1, Math.ceil(history.length * 0.6))
          ? "최근 검색 기반"
          : "AI 추천",
    }));

    return mapped.slice(0, 8);
  }, [history]);

  const suggestionHistory = history.slice(0, 6);
  const suggestionAi = personalizedKeywords.slice(0, 4);

  return (
    <div className="tf-search-page">
      <section className="tf-search-hero">
        <div className="tf-search-badge">
          <Sparkles size={14} />
          SEARCH DISCOVERY
        </div>

        <h2>검색 기록과 추천 검색어로 더 빠르게 밈을 찾을 수 있어요</h2>
        <p>
          검색창을 누르면 최근 검색 6, AI 추천 4 비율로 먼저 보여주고,
          아래에는 랜덤한 밈 썸네일이 보이도록 구성한 탐색형 검색 화면입니다.
        </p>
      </section>

      <section className="tf-search-area" ref={searchAreaRef}>
        <form className="tf-search-bar-wrap" onSubmit={handleSubmit}>
          <div
            className={`tf-search-input-box ${showSuggestPanel ? "focused" : ""}`}
            onClick={() => setShowSuggestPanel(true)}
          >
            <SearchIcon size={18} className="tf-search-icon" />

            <input
              type="text"
              placeholder="밈, 챌린지, 유행어를 검색해보세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestPanel(true)}
              className="tf-search-input"
            />

            {query && (
              <button
                type="button"
                className="tf-search-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetSearch();
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button type="submit" className="tf-search-submit-btn">
            검색
          </button>
        </form>

        {showSuggestPanel && (
          <div className="tf-suggest-panel">
            <div className="tf-suggest-grid">
              <section className="tf-suggest-section history-block">
                <div className="tf-suggest-head">
                  <div className="tf-suggest-title-wrap">
                    <History size={16} />
                    <h3>최근 검색어</h3>
                  </div>

                  {history.length > 0 && (
                    <button
                      type="button"
                      className="tf-suggest-clear-all"
                      onClick={handleClearHistory}
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {suggestionHistory.length > 0 ? (
                  <div className="tf-history-list">
                    {suggestionHistory.map((item) => (
                      <div className="tf-history-item" key={item}>
                        <button
                          type="button"
                          className="tf-history-keyword"
                          onClick={() => handleSearch(item)}
                        >
                          {item}
                        </button>

                        <button
                          type="button"
                          className="tf-history-delete"
                          onClick={() => handleDeleteHistoryItem(item)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tf-empty-text">
                    아직 검색 기록이 없어요. 첫 검색을 시작해보세요.
                  </p>
                )}
              </section>

              <section className="tf-suggest-section ai-block">
                <div className="tf-suggest-head">
                  <div className="tf-suggest-title-wrap">
                    <WandSparkles size={16} />
                    <h3>AI 추천 검색어</h3>
                  </div>
                </div>

                <div className="tf-ai-list">
                  {suggestionAi.map((item) => (
                    <button
                      type="button"
                      className="tf-ai-item"
                      key={item.id}
                      onClick={() => handleSearch(item.label)}
                    >
                      <span className="tf-ai-keyword">{item.label}</span>
                      <span className="tf-ai-reason">{item.reason}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>

      <section className="tf-search-feed-head">
        <div>
          <span className="tf-feed-eyebrow">
            {query ? "SEARCH RESULT" : "RANDOM THUMBNAILS"}
          </span>
          <h3>{query ? `"${query}" 검색 결과` : "랜덤 밈 탐색"}</h3>
        </div>
      </section>

      <div className="tf-search-grid" onClick={() => setShowSuggestPanel(false)}>
        {filteredContents.length > 0 ? (
          filteredContents.map((item, index) => {
            const likeInfo = getLikeInfo(item.CONTENT_ID, Number(item.LIKES) || 0);
            const saved = isSaved(item.CONTENT_ID);

            return (
              <button
                type="button"
                className="tf-search-card"
                key={item.CONTENT_ID || index}
                onClick={() => openVideoModal(item)}
              >
                <video
                  src={getVideoUrl(item.FILE_PATH)}
                  className="tf-search-card-video"
                  muted
                  playsInline
                  preload="metadata"
                />

                <div className="tf-search-card-overlay" />

                <div className="tf-search-card-top">
                  <span className="tf-search-card-badge">
                    {item.PLATFORM_TYPE || "Meme"}
                  </span>
                </div>

                <div className="tf-search-card-bottom">
                  <strong>{item.TITLE || "트렌딩 밈 콘텐츠"}</strong>
                  <span>@{item.USER_ID || "unknown"}</span>
                </div>

                <div className="tf-search-card-stats">
                  <span>
                    <Heart size={13} />
                    {likeInfo.count}
                  </span>
                  <span className={saved ? "saved" : ""}>
                    <Bookmark size={13} />
                    {saved ? "저장" : "보관"}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="tf-search-no-result">
            <p>검색 결과가 없습니다.</p>
            <span>다른 키워드로 다시 검색해보세요.</span>
          </div>
        )}
      </div>

      {selectedVideo && (
        <div className="tf-video-modal-overlay" onClick={closeVideoModal}>
          <div
            className="tf-video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="tf-video-modal-close"
              onClick={closeVideoModal}
            >
              <X size={22} />
            </button>

            <div className="tf-video-modal-player-wrap">
              <video
                src={getVideoUrl(selectedVideo.FILE_PATH)}
                className="tf-video-modal-video"
                controls
                autoPlay
                playsInline
              />

              <div className="tf-video-modal-floating">
                <button
                  type="button"
                  className={`tf-floating-btn ${
                    getLikeInfo(
                      selectedVideo.CONTENT_ID,
                      Number(selectedVideo.LIKES) || 0
                    ).liked
                      ? "liked"
                      : ""
                  }`}
                  onClick={() => toggleLike(selectedVideo)}
                >
                  <Heart
                    size={18}
                    fill={
                      getLikeInfo(
                        selectedVideo.CONTENT_ID,
                        Number(selectedVideo.LIKES) || 0
                      ).liked
                        ? "currentColor"
                        : "none"
                    }
                  />
                  <span>
                    {
                      getLikeInfo(
                        selectedVideo.CONTENT_ID,
                        Number(selectedVideo.LIKES) || 0
                      ).count
                    }
                  </span>
                </button>

                <button
                  type="button"
                  className={`tf-floating-btn ${
                    isSaved(selectedVideo.CONTENT_ID) ? "saved" : ""
                  }`}
                  onClick={() => toggleSave(selectedVideo)}
                >
                  <Bookmark
                    size={18}
                    fill={isSaved(selectedVideo.CONTENT_ID) ? "currentColor" : "none"}
                  />
                  <span>{isSaved(selectedVideo.CONTENT_ID) ? "저장됨" : "저장"}</span>
                </button>
              </div>
            </div>

            <div className="tf-video-modal-info">
              <div className="tf-video-post-header">
                <div className="tf-video-post-user">
                  <div className="tf-video-post-avatar">
                    {(selectedVideo.CREATOR_NAME || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="tf-video-post-user-text">
                    <strong>{selectedVideo.CREATOR_NAME || "unknown"}</strong>
                    <span>{selectedVideo.PLATFORM_TYPE || "platform"}</span>
                  </div>
                </div>

                <div className="tf-video-post-date">
                  {selectedVideo.CREATED_AT || ""}
                </div>
              </div>

              <h3>{selectedVideo.TITLE || "제목 없음"}</h3>
              <p>
                {selectedVideo.PLATFORM_TYPE
                  ? `플랫폼 · ${selectedVideo.PLATFORM_TYPE}`
                  : "플랫폼 정보 없음"}
              </p>

              {(selectedVideo.ORIGINAL_URL || selectedVideo.ORIGINAL_LINK) && (
                <a
                  href={selectedVideo.ORIGINAL_URL || selectedVideo.ORIGINAL_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="tf-original-link"
                >
                  원본 보러가기
                </a>
              )}

              <div className="tf-video-modal-meta-line">
                <span className="tf-modal-chip">
                  <Play size={13} />
                  밈 미리보기
                </span>
                <span className="tf-modal-chip">
                  <Sparkles size={13} />
                  추천 탐색
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;