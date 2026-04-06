import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  Heart,
  History,
  Bookmark,
} from "lucide-react";
import "./Search.css";

const STORAGE_KEY = "searchHistory";
const LIKE_STORAGE_KEY = "postLikes";
const SAVED_POSTS_KEY = "savedPosts";

const LIMIT = 10;

const shuffleArray = (array) => {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

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
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const savedLikes = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};
    const storedSavedPosts = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];
    setHistory(savedHistory);
    setLikeState(savedLikes);
    setSavedPosts(storedSavedPosts);
  }, []);

  useEffect(() => {
    if (location.state?.reset) {
      const content = document.querySelector(".tf-content");
      if (content) {
        content.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [location]);

  const getLoginUserId = () => {
    const storedLoginUser = localStorage.getItem("user");
    const loginUser = storedLoginUser ? JSON.parse(storedLoginUser) : null;
    return loginUser?.USER_ID || loginUser?.id || null;
  };

  const getSearchApiUrl = (userId, keyword, currentPage) => {
    const baseUrl = userId
      ? `http://localhost:3002/search-content/${userId}`
      : "http://localhost:3002/search-content";

    const url = new URL(baseUrl);
    url.searchParams.set("limit", LIMIT);
    url.searchParams.set("offset", currentPage * LIMIT);

    if (keyword.trim()) {
      url.searchParams.set("keyword", keyword.trim());
    }

    return url;
  };

  const loadContents = async ({ keyword = "", currentPage = 0, isFirst = false }) => {
    const userId = getLoginUserId();

    setLoading(true);

    try {
      const url = getSearchApiUrl(userId, keyword, currentPage);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);

      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];
      const displayData = shuffleArray(safeData);

      if (isFirst) {
        setContents(displayData);
        setFilteredContents(displayData);
      } else {
        setContents((prev) => {
          const merged = [...prev, ...displayData];
          setFilteredContents(merged);
          return merged;
        });
      }

      setHasMore(safeData.length === LIMIT);
    } catch (err) {
      console.error("콘텐츠 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents({ keyword: "", currentPage: 0, isFirst: true });
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
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith("/")) return `http://localhost:3002${filePath}`;
    return `http://localhost:3002/uploads/${filePath}`;
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

  const saveHistory = (keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveSearchLogToServer = async (keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return false;

    try {
      const storedLoginUser = localStorage.getItem("user");
      const loginUser = storedLoginUser ? JSON.parse(storedLoginUser) : null;

      if (!loginUser || !(loginUser.USER_ID || loginUser.id)) {
        return false;
      }

      const res = await fetch("http://localhost:3002/search/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: loginUser.USER_ID || loginUser.id,
          keyword_id: null,
          search_word: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("검색 로그 저장 실패:", data);
        return false;
      }

      return true;
    } catch (err) {
      console.error("검색 로그 저장 실패:", err);
      return false;
    }
  };

  const handleSearch = async (keyword = query) => {
    const trimmed = keyword.trim();
    setShowSuggestPanel(false);
    setQuery(trimmed);
    setHasMore(true);
    setPage(0);

    if (!trimmed) {
      await loadContents({ keyword: "", currentPage: 0, isFirst: true });
      return;
    }

    saveHistory(trimmed);
    await saveSearchLogToServer(trimmed);
    await loadContents({ keyword: trimmed, currentPage: 0, isFirst: true });
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

  const handleResetSearch = async () => {
    setQuery("");
    setShowSuggestPanel(false);
    setHasMore(true);
    setPage(0);
    await loadContents({ keyword: "", currentPage: 0, isFirst: true });
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await loadContents({ keyword: query, currentPage: nextPage, isFirst: false });
  };

  const handleAutoCompleteClick = async (keyword) => {
    setQuery(keyword);
    await handleSearch(keyword);
  };

  const openVideoModal = (item) => {
    setSelectedVideo(item);
    setShowSuggestPanel(false);
  };

  const closeVideoModal = () => setSelectedVideo(null);

  const getLikeInfo = (postId, baseLikes = 0) => {
    const saved = likeState[postId];
    if (!saved) return { count: Number(baseLikes) || 0, liked: false };
    return saved;
  };

  const isSaved = (postId) => savedPosts.some((item) => item.id === postId);

  const createSavedPost = (post, nextCount) => ({
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
  });

  const toggleLike = async (post) => {
    const userId = getLoginUserId();
    const postId = post.CONTENT_ID;

    if (!userId || !postId) return;

    const current = getLikeInfo(postId, Number(post.LIKES) || 0);

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

      const updatedLikes = { ...likeState, [postId]: next };
      setLikeState(updatedLikes);
      localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(updatedLikes));
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  const toggleSave = async (post) => {
    const userId = getLoginUserId();
    const postId = post.CONTENT_ID;

    if (!userId || !postId) return;

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

      const currentSaved = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];
      const likeInfo = getLikeInfo(postId, Number(post.LIKES) || 0);

      const nextSaved = saved
        ? currentSaved.filter((item) => item.id !== postId)
        : [createSavedPost(post, likeInfo.count), ...currentSaved.filter((item) => item.id !== postId)];

      setSavedPosts(nextSaved);
      localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextSaved));
    } catch (error) {
      console.error("보관 처리 실패:", error);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    const userId = getLoginUserId();

    if (!trimmed) {
      setAutoCompleteSuggestions([]);
      return;
    }

    const baseUrl = userId
      ? `http://localhost:3002/search-content/${userId}`
      : "http://localhost:3002/search-content";

    const url = new URL(baseUrl);
    url.searchParams.set("limit", 8);
    url.searchParams.set("offset", 0);
    url.searchParams.set("keyword", trimmed);

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        const titles = [...new Set(safeData.map((item) => item.TITLE).filter(Boolean))];
        setAutoCompleteSuggestions(titles.slice(0, 5));
      })
      .catch(() => setAutoCompleteSuggestions([]));
  }, [query]);

  useEffect(() => {
    const fetchInteractionStates = async () => {
      const userId = getLoginUserId();
      if (!userId || filteredContents.length === 0) return;

      try {
        const likeMap = {};
        const savedList = [];

        for (const item of filteredContents) {
          const contentId = item.CONTENT_ID;
          if (!contentId) continue;

          const [likeRes, bookmarkRes] = await Promise.all([
            fetch(
              `http://localhost:3002/interaction/like-status?user_id=${encodeURIComponent(
                userId
              )}&content_id=${encodeURIComponent(contentId)}`
            ),
            fetch(
              `http://localhost:3002/interaction/bookmark-status?user_id=${encodeURIComponent(
                userId
              )}&content_id=${encodeURIComponent(contentId)}`
            ),
          ]);

          const likeData = await likeRes.json();
          const bookmarkData = await bookmarkRes.json();

          likeMap[contentId] = {
            liked: likeData.success ? likeData.liked : false,
            count: Number(item.LIKES) || 0,
          };

          if (bookmarkData.success && bookmarkData.bookmarked) {
            savedList.push(createSavedPost(item, Number(item.LIKES) || 0));
          }
        }

        setLikeState((prev) => {
          const merged = { ...prev, ...likeMap };
          localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });

        setSavedPosts(savedList);
        localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedList));
      } catch (error) {
        console.error("좋아요/북마크 상태 조회 실패:", error);
      }
    };

    fetchInteractionStates();
  }, [filteredContents]);

  const suggestionHistory = history.slice(0, 10);

  return (
    <div className="tf-search-page">
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
            {query.trim() && autoCompleteSuggestions.length > 0 && (
              <div className="tf-autocomplete-list">
                {autoCompleteSuggestions.map((item, index) => (
                  <button
                    type="button"
                    className="tf-autocomplete-item"
                    key={`${item}-${index}`}
                    onClick={() => handleAutoCompleteClick(item)}
                  >
                    <SearchIcon size={14} className="tf-autocomplete-icon" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="tf-suggest-grid single-column">
              <section className="tf-suggest-section history-block full-width">
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
                  <div className="tf-history-list full-width-list">
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
                  <p className="tf-empty-text">아직 검색 기록이 없어요.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </section>

      <section className="tf-search-feed-head">
        <div>
          <span className="tf-feed-eyebrow">{query ? "SEARCH RESULT" : "RANDOM THUMBNAILS"}</span>
          <h3>{query ? `"${query}" 검색 결과` : "랜덤 밈 탐색"}</h3>
        </div>
      </section>

      <div className="tf-search-grid" onClick={() => setShowSuggestPanel(false)}>
        {filteredContents.length > 0 ? (
          filteredContents.map((item, index) => {
            const likeInfo = getLikeInfo(item.CONTENT_ID, Number(item.LIKES) || 0);
            const saved = isSaved(item.CONTENT_ID);

            return (
              <div
                className="tf-search-card"
                key={item.CONTENT_ID || index}
                onClick={() => openVideoModal(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openVideoModal(item);
                  }
                }}
              >
                {item.PLATFORM_TYPE?.toLowerCase() === "instagram" ? (
                  <iframe
                    src={getInstagramEmbedUrl(item.ORIGINAL_URL || item.ORIGINAL_LINK || item.FILE_PATH)}
                    className="tf-search-card-video instagram-card-frame"
                    title={item.TITLE || "instagram card"}
                    allowFullScreen
                  />
                ) : item.PLATFORM_TYPE?.toLowerCase() === "tiktok" ? (
                  getTikTokEmbedUrl(item.ORIGINAL_LINK || item.ORIGINAL_URL || item.FILE_PATH) ? (
                    <iframe
                      src={getTikTokEmbedUrl(item.ORIGINAL_LINK || item.ORIGINAL_URL || item.FILE_PATH)}
                      className="tf-search-card-video tiktok-card-frame"
                      title={item.TITLE || "tiktok card"}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="tf-search-card-video tf-search-card-empty">
                      틱톡 주소 없음
                    </div>
                  )
                ) : (
                  <video
                    src={getVideoUrl(item.FILE_PATH)}
                    className="tf-search-card-video"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}

                <div className="tf-search-card-overlay" />

                <div className="tf-search-card-top">
                  <span className="tf-search-card-badge">{item.PLATFORM_TYPE || "Meme"}</span>
                </div>

                <div className="tf-search-card-bottom">
                  <strong>
                    {(item.TITLE || "트렌딩 밈 콘텐츠").slice(0, 15)}
                    {(item.TITLE || "").length > 15 ? "..." : ""}
                  </strong>
                  <span>@{(item.USER_ID || "unknown").slice(0, 10)}</span>
                </div>

                <div className="tf-search-card-stats">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item);
                    }}
                    style={{ cursor: getLoginUserId() ? "pointer" : "default" }}
                  >
                    <Heart size={13} fill={likeInfo.liked ? "currentColor" : "none"} />
                    {likeInfo.count}
                  </span>

                  <span
                    className={saved ? "saved" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(item);
                    }}
                    style={{ cursor: getLoginUserId() ? "pointer" : "default" }}
                  >
                    <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
                    {saved ? "저장" : "보관"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="tf-search-no-result">
            <p>검색 결과가 없습니다.</p>
            <span>다른 키워드로 다시 검색해보세요.</span>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="tf-load-more-wrap">
          <button
            type="button"
            className="tf-load-more-btn"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "더보기"}
          </button>
        </div>
      )}

      {selectedVideo && (
        <div className="tf-video-modal-overlay" onClick={closeVideoModal}>
          <div className="tf-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tf-video-modal-close" onClick={closeVideoModal}>
              <X size={22} />
            </button>

            <div
              className={`tf-video-modal-player-wrap ${selectedVideo.PLATFORM_TYPE?.toLowerCase() === "instagram"
                ? "instagram-modal"
                : selectedVideo.PLATFORM_TYPE?.toLowerCase() === "tiktok"
                  ? "tiktok-modal"
                  : ""
                }`}
            >
              {selectedVideo.PLATFORM_TYPE?.toLowerCase() === "instagram" ? (
                <iframe
                  src={getInstagramEmbedUrl(
                    selectedVideo.ORIGINAL_URL || selectedVideo.ORIGINAL_LINK || selectedVideo.FILE_PATH
                  )}
                  className="tf-video-modal-video instagram-modal-frame"
                  title="instagram modal"
                  allowFullScreen
                />
              ) : selectedVideo.PLATFORM_TYPE?.toLowerCase() === "tiktok" ? (
                getTikTokEmbedUrl(
                  selectedVideo.ORIGINAL_LINK || selectedVideo.ORIGINAL_URL || selectedVideo.FILE_PATH
                ) ? (
                  <iframe
                    src={getTikTokEmbedUrl(
                      selectedVideo.ORIGINAL_LINK || selectedVideo.ORIGINAL_URL || selectedVideo.FILE_PATH
                    )}
                    className="tf-video-modal-video tiktok-modal-frame"
                    title="tiktok modal"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="tf-video-modal-video tf-search-card-empty">
                    틱톡 주소 없음
                  </div>
                )
              ) : (
                <video
                  src={getVideoUrl(selectedVideo.FILE_PATH)}
                  className="tf-video-modal-video"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>

            <div className="tf-video-modal-info">
              <div className="tf-video-modal-floating">
                <button
                  type="button"
                  className={`tf-floating-btn ${getLikeInfo(selectedVideo.CONTENT_ID, Number(selectedVideo.LIKES) || 0).liked
                    ? "liked"
                    : ""
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(selectedVideo);
                  }}
                >
                  <Heart
                    size={18}
                    fill={
                      getLikeInfo(selectedVideo.CONTENT_ID, Number(selectedVideo.LIKES) || 0).liked
                        ? "currentColor"
                        : "none"
                    }
                  />
                  <span>
                    {getLikeInfo(selectedVideo.CONTENT_ID, Number(selectedVideo.LIKES) || 0).count}
                  </span>
                </button>

                <button
                  type="button"
                  className={`tf-floating-btn ${isSaved(selectedVideo.CONTENT_ID) ? "saved" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(selectedVideo);
                  }}
                >
                  <Bookmark
                    size={18}
                    fill={isSaved(selectedVideo.CONTENT_ID) ? "currentColor" : "none"}
                  />
                  <span>{isSaved(selectedVideo.CONTENT_ID) ? "저장됨" : "저장"}</span>
                </button>
              </div>

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
                <div className="tf-video-post-date">{selectedVideo.CREATED_AT || ""}</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;