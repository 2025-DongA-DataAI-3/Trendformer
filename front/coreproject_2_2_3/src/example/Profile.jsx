import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Bookmark,
  Heart,
  PencilLine,
  KeyRound,
  LogOut,
  Trash2,
  X,
  Sparkles,
  Play,
  CalendarDays,
  Grid3X3,
} from "lucide-react";

const SAVED_POSTS_KEY = "savedPosts";
const LIKE_STORAGE_KEY = "postLikes";
const DEFAULT_BIO = "실시간 밈과 숏폼 트렌드를 탐색하고 저장하는 TrendFormer 사용자입니다.";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("saved");
  const [savedPosts, setSavedPosts] = useState([]);
  const [likeState, setLikeState] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPwOpen, setIsPwOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [toast, setToast] = useState("");

  const [editForm, setEditForm] = useState({
    nickname: "",
    email: "",
    bio: "",
    filtering: "",
  });

  const [pwForm, setPwForm] = useState({
    currentPw: "",
    newPw: "",
    confirmPw: "",
  });

  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    const isLogin = localStorage.getItem("isLogin") === "true";
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!isLogin || !storedUser) {
      navigate("/login");
      return;
    }

    const cleanedBio =
      storedUser.bio && storedUser.bio !== DEFAULT_BIO ? storedUser.bio : "";

    const cleanedUser =
      storedUser.bio === cleanedBio
        ? storedUser
        : { ...storedUser, bio: cleanedBio };

    if (storedUser.bio !== cleanedBio) {
      localStorage.setItem("user", JSON.stringify(cleanedUser));
    }

    setUser(cleanedUser);
    setEditForm({
      nickname: cleanedUser.nickname || "",
      email: cleanedUser.email || "",
      bio: cleanedBio,
      filtering: Array.isArray(cleanedUser.filtering)
        ? cleanedUser.filtering.join(", ")
        : "",
    });

    const storedSavedPosts = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY)) || [];
    const storedLikes = JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY)) || {};

    setSavedPosts(storedSavedPosts);
    setLikeState(storedLikes);
  }, [navigate]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToast("");
    }, 2200);
  };

  const avatarLetter = useMemo(() => {
    if (!user) return "T";
    return (user.nickname || user.id || "T").charAt(0).toUpperCase();
  }, [user]);

  const likedPosts = useMemo(() => {
    if (!savedPosts.length) return [];
    return savedPosts
      .filter((item) => {
        const liked = likeState[item.id];
        return liked?.liked;
      })
      .map((item) => ({
        ...item,
        saves: likeState[item.id]?.count ?? item.saves ?? 0,
      }));
  }, [savedPosts, likeState]);

  const currentData = tab === "saved" ? savedPosts : likedPosts;

  const stats = useMemo(() => {
    const totalSaved = savedPosts.length;
    const totalLiked = Object.values(likeState).filter((item) => item?.liked).length;
    const totalUploads = Number(user?.uploadCount) || 0;
    return [
      { label: "저장한 밈", value: totalSaved },
      { label: "좋아요", value: totalLiked },
      { label: "업로드", value: totalUploads },
    ];
  }, [savedPosts, likeState, user]);

  const openEditModal = () => {
    if (!user) return;
    setEditForm({
      nickname: user.nickname || "",
      email: user.email || "",
      bio: user.bio && user.bio !== DEFAULT_BIO ? user.bio : "",
      filtering: Array.isArray(user.filtering) ? user.filtering.join(", ") : "",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => setIsEditOpen(false);

  const openPwModal = () => {
    setPwForm({ currentPw: "", newPw: "", confirmPw: "" });
    setIsPwOpen(true);
  };

  const closePwModal = () => setIsPwOpen(false);

  const openDeleteModal = () => {
    setDeleteText("");
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteText("");
    setIsDeleteOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!editForm.nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (!editForm.email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const keywords = [...new Set(
      editForm.filtering
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
    )];

    const cleanedBio = editForm.bio.trim();

    const updatedUser = {
      ...user,
      nickname: editForm.nickname.trim(),
      email: editForm.email.trim(),
      bio: cleanedBio === DEFAULT_BIO ? "" : cleanedBio,
      filtering: keywords,
    };

    try {
      await fetch("http://localhost:3002/user/filter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          keywords,
        }),
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditOpen(false);
      showToast("프로필 정보가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert("필터 저장 중 오류가 발생했습니다.");
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (!pwForm.currentPw.trim()) { alert("현재 비밀번호를 입력해주세요."); return; }
    if (!pwForm.newPw.trim()) { alert("새 비밀번호를 입력해주세요."); return; }
    if (pwForm.newPw.length < 4) { alert("비밀번호는 4자 이상으로 입력해주세요."); return; }
    if (pwForm.newPw !== pwForm.confirmPw) { alert("새 비밀번호 확인이 일치하지 않습니다."); return; }

    try {
      const response = await fetch("http://localhost:3002/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          currentPw: pwForm.currentPw,
          newPw: pwForm.newPw,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, pw: pwForm.newPw };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPwForm({ currentPw: "", newPw: "", confirmPw: "" });
        setIsPwOpen(false);
        showToast("비밀번호가 변경되었습니다.");
      } else {
        alert(data.message || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      alert("비밀번호 변경에 실패했습니다.");
    }
  };

  const handleClickPhotoChange = () => fileInputRef.current?.click();

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드할 수 있습니다."); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const updatedUser = { ...user, profileImage: reader.result };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast("프로필 사진이 변경되었습니다.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "회원탈퇴") { alert("회원탈퇴를 정확히 입력해주세요."); return; }

    try {
      const response = await fetch("http://localhost:3002/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("isLogin");
        localStorage.removeItem("searchHistory");
        localStorage.removeItem("savedPosts");
        localStorage.removeItem("postLikes");
        alert("회원 탈퇴가 완료되었습니다.");
        navigate("/join");
      } else {
        alert(data.message || "회원탈퇴에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const removeSavedItem = (postId) => {
    const updated = savedPosts.filter((item) => item.id !== postId);
    setSavedPosts(updated);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(updated));
    if (selectedItem?.id === postId) setSelectedItem(null);
    showToast("보관함에서 제거되었습니다.");
  };

  const toggleLikeFromProfile = (item) => {
    const current = likeState[item.id] || { liked: false, count: Number(item.saves) || 0 };
    const willLike = !current.liked;
    const updatedLikes = {
      ...likeState,
      [item.id]: {
        liked: willLike,
        count: willLike ? current.count + 1 : Math.max(current.count - 1, 0),
      },
    };
    setLikeState(updatedLikes);
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(updatedLikes));

    const updatedSavedPosts = savedPosts.map((post) =>
      post.id === item.id ? { ...post, saves: updatedLikes[item.id].count } : post
    );
    setSavedPosts(updatedSavedPosts);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(updatedSavedPosts));
  };

  const getTikTokEmbedUrl = (url) => {
    if (!url) return "";

    const cleanUrl = String(url).trim();
    const match = cleanUrl.match(/\/video\/(\d+)/);

    if (!match) return "";

    const videoId = match[1];
    return `https://www.tiktok.com/embed/v3/${videoId}`;
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

  const openDetailModal = (item) => setSelectedItem(item);
  const closeDetailModal = () => setSelectedItem(null);

  if (!user) return null;

  return (
    <div style={styles.page}>
      <section style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatarOuter}>
              {user.profileImage ? (
                <img src={user.profileImage} alt="프로필" style={styles.avatarImage} />
              ) : (
                <div style={styles.avatar}>{avatarLetter}</div>
              )}
              <button type="button" style={styles.avatarEditBtn} onClick={handleClickPhotoChange}>
                <Camera size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImageChange} />
            </div>
          </div>

          <div style={styles.profileMain}>
            <div style={styles.nameRow}>
              <h2 style={styles.name}>{user.nickname || "닉네임없음"}</h2>
              <span style={styles.badge}>
                <Sparkles size={13} />
                trendformer
              </span>
            </div>
            <p style={styles.handle}>@{user.id || "user"}</p>
            {user.bio ? <p style={styles.bio}>{user.bio}</p> : null}

            <div style={styles.userInfoBox}>
              <div style={styles.userInfoItem}>
                <span style={styles.userInfoLabel}>이메일</span>
                <span style={styles.userInfoValue}>{user.email || "-"}</span>
              </div>
              
            </div>
          </div>
        </div>

        <div style={styles.statGrid}>
          {stats.map((item) => (
            <div key={item.label} style={styles.statCard}>
              <span style={styles.statLabel}>{item.label}</span>
              <strong style={styles.statValue}>{item.value}</strong>
            </div>
          ))}
        </div>

        <div style={styles.actionRow}>
          <button type="button" style={styles.primaryActionBtn} onClick={openEditModal}>
            <PencilLine size={16} />회원 정보 수정
          </button>
          <button type="button" style={styles.secondaryActionBtn} onClick={openPwModal}>
            <KeyRound size={16} />비밀번호 변경
          </button>
        </div>

        <div style={styles.actionRow}>
          <button type="button" style={styles.ghostActionBtn} onClick={handleLogout}>
            <LogOut size={16} />로그아웃
          </button>
          <button type="button" style={styles.dangerActionBtn} onClick={openDeleteModal}>
            <Trash2 size={16} />회원 탈퇴
          </button>
        </div>
      </section>

      <section style={styles.tabSection}>
        <button type="button" onClick={() => setTab("saved")} style={{ ...styles.tab, ...(tab === "saved" ? styles.tabActive : {}) }}>
          <Bookmark size={16} />저장한 영상
        </button>
        <button type="button" onClick={() => setTab("liked")} style={{ ...styles.tab, ...(tab === "liked" ? styles.tabActive : {}) }}>
          <Heart size={16} />좋아요한 영상
        </button>
      </section>

      <section style={styles.sectionHead}>
        <h3 style={styles.sectionTitle}>{tab === "saved" ? "내 보관함" : "좋아요한 콘텐츠"}</h3>
        <p style={styles.sectionSub}>
          {tab === "saved" ? "검색과 홈에서 저장한 밈 영상을 모아볼 수 있어요" : "좋아요를 누른 콘텐츠를 다시 확인할 수 있어요"}
        </p>
      </section>

      <section style={styles.cardGrid}>
        {currentData.length > 0 ? (
          currentData.map((item) => {
            const currentLike = likeState[item.id] || { liked: false, count: Number(item.saves) || 0 };
            return (
              <article key={item.id} style={styles.card}>
                <button type="button" style={styles.cardMediaButton} onClick={() => openDetailModal(item)}>
                  {item.isVideo ? (
                    item.originalUrl?.includes("tiktok") ? (
                      <iframe
                        src={getTikTokEmbedUrl(item.originalUrl)}
                        style={styles.cardImage}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={item.filePath || item.img}
                        style={styles.cardImage}
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <img src={item.img} alt={item.title} style={styles.cardImage} />
                  )}
                  <span style={styles.cardBadge}>{item.category || "Meme"}</span>
                  <span style={styles.cardPlayBadge}><Play size={12} />보기</span>
                </button>

                <div style={styles.cardBody}>
                  <h4 style={styles.cardTitle}>{item.title}</h4>
                  <p style={styles.cardDesc}>{item.desc || `${item.userId || "unknown"}님의 저장 콘텐츠`}</p>
                  <div style={styles.tagWrap}>
                    {(item.tags || []).map((tag) => <span key={tag} style={styles.tag}>{tag}</span>)}
                  </div>
                  <div style={styles.metaRow}>
                    <button type="button" style={{ ...styles.metaButton, ...(currentLike.liked ? styles.metaButtonLiked : {}) }} onClick={() => toggleLikeFromProfile(item)}>
                      <Heart size={14} fill={currentLike.liked ? "currentColor" : "none"} />
                      좋아요 {currentLike.count}
                    </button>
                    {tab === "saved" ? (
                      <button type="button" style={styles.metaButton} onClick={() => removeSavedItem(item.id)}>
                        <Bookmark size={14} />제거
                      </button>
                    ) : (
                      <span style={styles.metaText}>TrendFormer Archive</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIconWrap}>
              {tab === "saved" ? <Bookmark size={22} /> : <Grid3X3 size={22} />}
            </div>
            <p style={styles.emptyTitle}>{tab === "saved" ? "아직 저장한 영상이 없습니다." : "아직 좋아요한 영상이 없습니다."}</p>
            <p style={styles.emptyDesc}>{tab === "saved" ? "홈이나 검색 화면에서 저장 버튼을 누르면 여기에 모입니다." : "홈이나 검색 화면에서 좋아요를 누르면 여기에 반영됩니다."}</p>
          </div>
        )}
      </section>

      {isEditOpen && (
        <div style={styles.modalOverlay} onClick={closeEditModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>회원 정보 수정</h3>
              <button type="button" style={styles.modalCloseBtn} onClick={closeEditModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>아이디</label>
                <input type="text" value={user.id || ""} disabled style={{ ...styles.input, ...styles.disabledInput }} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>닉네임</label>
                <input type="text" name="nickname" value={editForm.nickname} onChange={handleEditChange} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>이메일</label>
                <input type="email" name="email" value={editForm.email} onChange={handleEditChange} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>소개</label>
                <textarea name="bio" value={editForm.bio} onChange={handleEditChange} style={styles.textarea} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>필터링</label>
                <input type="text" name="filtering" value={editForm.filtering} onChange={handleEditChange} placeholder="예: 고양이, 먹방, 챌린지" style={styles.input} />
              </div>
              <div style={styles.modalActionRow}>
                <button type="button" style={styles.cancelBtn} onClick={closeEditModal}>취소</button>
                <button type="submit" style={styles.saveBtn}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPwOpen && (
        <div style={styles.modalOverlay} onClick={closePwModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>비밀번호 변경</h3>
              <button type="button" style={styles.modalCloseBtn} onClick={closePwModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>현재 비밀번호</label>
                <input type="password" name="currentPw" value={pwForm.currentPw} onChange={handlePwChange} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>새 비밀번호</label>
                <input type="password" name="newPw" value={pwForm.newPw} onChange={handlePwChange} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>새 비밀번호 확인</label>
                <input type="password" name="confirmPw" value={pwForm.confirmPw} onChange={handlePwChange} style={styles.input} />
              </div>
              <div style={styles.modalActionRow}>
                <button type="button" style={styles.cancelBtn} onClick={closePwModal}>취소</button>
                <button type="submit" style={styles.saveBtn}>변경</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>회원 탈퇴</h3>
              <button type="button" style={styles.modalCloseBtn} onClick={closeDeleteModal}><X size={20} /></button>
            </div>
            <div style={styles.deleteNoticeBox}>
              <p style={styles.deleteTitle}>정말로 탈퇴하시겠습니까?</p>
              <p style={styles.deleteDesc}>탈퇴를 진행하려면 아래 입력칸에 <strong>회원탈퇴</strong>를 정확히 입력해주세요.</p>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>확인 문구 입력</label>
              <input type="text" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="회원탈퇴" style={styles.input} />
            </div>
            <div style={styles.modalActionRow}>
              <button type="button" style={styles.cancelBtn} onClick={closeDeleteModal}>취소</button>
              <button type="button" onClick={handleDeleteAccount} disabled={deleteText !== "회원탈퇴"} style={{ ...styles.deleteConfirmBtn, ...(deleteText !== "회원탈퇴" ? styles.deleteConfirmBtnDisabled : {}) }}>
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div style={styles.modalOverlay} onClick={closeDetailModal}>
          <div style={styles.detailModalBox} onClick={(e) => e.stopPropagation()}>
            <button type="button" style={styles.modalCloseFloatingBtn} onClick={closeDetailModal}><X size={20} /></button>
            <div style={styles.detailMediaWrap}>
              {selectedItem.isVideo ? (
                selectedItem.originalUrl?.includes("tiktok") ? (
                  getTikTokEmbedUrl(selectedItem.originalUrl) ? (
                    <iframe
                      src={getTikTokEmbedUrl(selectedItem.originalUrl)}
                      style={styles.detailMedia}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div style={{ ...styles.detailMedia, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      틱톡 영상 없음
                    </div>
                  )
                ) : isPlayableVideoUrl(selectedItem.filePath || selectedItem.img) ? (
                  <video
                    src={selectedItem.filePath || selectedItem.img}
                    style={styles.detailMedia}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div style={{ ...styles.detailMedia, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    영상 주소가 없습니다.
                  </div>
                )
              ) : (
                <img src={selectedItem.img} alt={selectedItem.title} style={styles.detailMedia} />
              )}
            </div>
            <div style={styles.detailInfoBox}>
              <div style={styles.detailHeaderRow}>
                <div style={styles.detailUserBlock}>
                  <div style={styles.detailAvatar}>
                    {(selectedItem.nickname || selectedItem.userId || "T").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={styles.detailUserName}>{selectedItem.nickname || selectedItem.userId || "unknown"}</strong>
                    <p style={styles.detailSubText}>{selectedItem.category || "Meme"}</p>
                  </div>
                </div>
                <span style={styles.detailDate}><CalendarDays size={14} />{selectedItem.date || "작성일 없음"}</span>
              </div>
              <h3 style={styles.detailTitle}>{selectedItem.title}</h3>
              <p style={styles.detailDesc}>{selectedItem.desc || "저장된 콘텐츠입니다."}</p>
              <div style={styles.tagWrap}>
                {(selectedItem.tags || []).map((tag) => <span key={tag} style={styles.tag}>{tag}</span>)}
              </div>
              <div style={styles.detailActionRow}>
                <button type="button" style={{ ...styles.primaryActionBtn, ...(likeState[selectedItem.id]?.liked ? styles.primaryActionBtnLiked : {}) }} onClick={() => toggleLikeFromProfile(selectedItem)}>
                  <Heart size={16} fill={likeState[selectedItem.id]?.liked ? "currentColor" : "none"} />
                  좋아요 {likeState[selectedItem.id]?.count ?? selectedItem.saves ?? 0}
                </button>
                <button type="button" style={styles.secondaryActionBtn} onClick={() => removeSavedItem(selectedItem.id)}>
                  <Bookmark size={16} />저장 해제
                </button>
              </div>
              {selectedItem.originalUrl && (
                <a href={selectedItem.originalUrl} target="_blank" rel="noreferrer" style={styles.originalLink}>원본 보러가기</a>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
};

const styles = {
  page: { padding: "0 16px 28px", color: "#12202b", boxSizing: "border-box" },
  heroCard: { position: "relative", overflow: "hidden", padding: 18, borderRadius: 26, marginBottom: 18, background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,250,252,0.98) 100%)", border: "1px solid rgba(17, 38, 52, 0.08)", boxShadow: "0 16px 36px rgba(31,52,67,0.08), inset 0 1px 0 rgba(255,255,255,0.95)" },
  heroTop: { display: "flex", gap: 14, alignItems: "flex-start" },
  avatarWrap: { flexShrink: 0 },
  avatarOuter: { position: "relative", width: 84, height: 84, borderRadius: 26, overflow: "hidden", boxShadow: "0 10px 24px rgba(35,157,160,0.18)" },
  avatar: { width: "100%", height: "100%", background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 36, fontWeight: 800 },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  avatarEditBtn: { position: "absolute", right: 6, bottom: 6, width: 28, height: 28, borderRadius: 999, border: "1px solid rgba(17, 38, 52, 0.08)", background: "rgba(255,255,255,0.88)", color: "#12202b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  profileMain: { minWidth: 0, flex: 1 },
  nameRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6 },
  name: { margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", color: "#12202b" },
  badge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 999, background: "rgba(63,208,201,0.12)", color: "#1f8a8a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(63,208,201,0.16)" },
  handle: { margin: "0 0 8px", color: "#6f8892", fontSize: 14 },
  bio: { margin: 0, color: "#5f7785", fontSize: 14, lineHeight: 1.6 },
  userInfoBox: { marginTop: 12, display: "grid", gap: 8 },
  userInfoItem: { display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(17,38,52,0.06)" },
  userInfoLabel: { color: "#6f8892", fontSize: 12, fontWeight: 700 },
  userInfoValue: { color: "#12202b", fontSize: 12, fontWeight: 700, textAlign: "right", wordBreak: "break-all" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 16 },
  statCard: { padding: "14px 10px", borderRadius: 18, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(17,38,52,0.06)", textAlign: "center", boxShadow: "0 8px 18px rgba(31,52,67,0.05)" },
  statLabel: { display: "block", color: "#6f8892", fontSize: 12, fontWeight: 700, marginBottom: 6 },
  statValue: { color: "#12202b", fontSize: 20, fontWeight: 800 },
  actionRow: { display: "flex", gap: 10, marginTop: 12 },
  primaryActionBtn: { flex: 1, height: 46, border: "none", borderRadius: 15, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#ffffff", background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)", boxShadow: "0 10px 20px rgba(35,157,160,0.22)" },
  primaryActionBtnLiked: { color: "#ffffff", background: "linear-gradient(135deg, #de6483 0%, #ff7e9d 100%)" },
  secondaryActionBtn: { flex: 1, height: 46, borderRadius: 15, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#12202b", background: "rgba(255,255,255,0.96)", border: "1px solid rgba(17,38,52,0.08)" },
  ghostActionBtn: { flex: 1, height: 44, borderRadius: 15, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#12202b", background: "rgba(255,255,255,0.96)", border: "1px solid rgba(17,38,52,0.08)" },
  dangerActionBtn: { flex: 1, height: 44, borderRadius: 15, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#d94c6a", background: "rgba(255, 106, 137, 0.08)", border: "1px solid rgba(255, 106, 137, 0.18)" },
  tabSection: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  tab: { height: 46, borderRadius: 16, border: "1px solid rgba(17,38,52,0.08)", background: "rgba(255,255,255,0.78)", color: "#7a909c", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 800 },
  tabActive: { color: "#1f8a8a", background: "rgba(63,208,201,0.12)", border: "1px solid rgba(63,208,201,0.18)" },
  sectionHead: { marginBottom: 12 },
  sectionTitle: { margin: 0, color: "#12202b", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" },
  sectionSub: { margin: "6px 0 0", color: "#6f8892", fontSize: 13, lineHeight: 1.6 },
  cardGrid: { display: "grid", gap: 14 },
  card: { overflow: "hidden", borderRadius: 22, background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,250,252,0.98) 100%)", border: "1px solid rgba(17,38,52,0.08)", boxShadow: "0 16px 36px rgba(31,52,67,0.08)" },
  cardMediaButton: { position: "relative", width: "100%", height: 220, border: "none", padding: 0, background: "#dfe8ed", cursor: "pointer", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#dfe8ed" },
  cardBadge: { position: "absolute", top: 12, left: 12, height: 28, padding: "0 10px", borderRadius: 999, display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.84)", border: "1px solid rgba(63,208,201,0.16)", color: "#1f8a8a", fontSize: 11, fontWeight: 800 },
  cardPlayBadge: { position: "absolute", right: 12, bottom: 12, height: 30, padding: "0 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6, color: "#12202b", fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(17,38,52,0.08)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" },
  cardBody: { padding: 16 },
  cardTitle: { margin: 0, color: "#12202b", fontSize: 17, fontWeight: 800, lineHeight: 1.4 },
  cardDesc: { margin: "8px 0 0", color: "#6f8892", fontSize: 13, lineHeight: 1.6 },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: { height: 28, padding: "0 10px", borderRadius: 999, display: "inline-flex", alignItems: "center", color: "#1f8a8a", background: "rgba(63,208,201,0.08)", border: "1px solid rgba(63,208,201,0.14)", fontSize: 12, fontWeight: 700 },
  metaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 },
  metaButton: { height: 36, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(17,38,52,0.08)", background: "rgba(255,255,255,0.96)", color: "#12202b", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 800 },
  metaButtonLiked: { color: "#d95a78", border: "1px solid rgba(255,127,157,0.22)", background: "rgba(255,127,157,0.08)" },
  metaText: { color: "#6f8892", fontSize: 12, fontWeight: 700 },
  emptyBox: { padding: "34px 18px", borderRadius: 22, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(17,38,52,0.06)", textAlign: "center" },
  emptyIconWrap: { width: 54, height: 54, margin: "0 auto 14px", borderRadius: 18, background: "rgba(63,208,201,0.1)", color: "#1f8a8a", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle: { margin: 0, color: "#12202b", fontSize: 18, fontWeight: 800 },
  emptyDesc: { margin: "8px 0 0", color: "#6f8892", fontSize: 13, lineHeight: 1.6 },
  modalOverlay: { position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,24,32,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" },
  modalBox: { width: "100%", maxWidth: 520, borderRadius: 22, padding: 18, background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(244,249,251,1) 100%)", border: "1px solid rgba(17,38,52,0.08)", boxSizing: "border-box", boxShadow: "0 18px 40px rgba(31,52,67,0.14)" },
  detailModalBox: { position: "relative", width: "100%", maxWidth: 520, borderRadius: 22, overflow: "hidden", background: "#ffffff", border: "1px solid rgba(17,38,52,0.08)", boxShadow: "0 18px 40px rgba(31,52,67,0.14)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  modalTitle: { margin: 0, color: "#12202b", fontSize: 20, fontWeight: 800 },
  modalCloseBtn: { width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(17,38,52,0.08)", background: "rgba(255,255,255,0.84)", color: "#12202b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  modalCloseFloatingBtn: { position: "absolute", top: 10, right: 10, zIndex: 5, width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(17,38,52,0.08)", background: "rgba(255,255,255,0.88)", color: "#12202b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  form: { display: "grid", gap: 14 },
  inputGroup: { display: "grid", gap: 8 },
  label: { color: "#243b4a", fontSize: 13, fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(17,38,52,0.10)", background: "rgba(255,255,255,0.96)", color: "#12202b", padding: "14px 16px", outline: "none", fontSize: 14 },
  disabledInput: { color: "#7a909c", background: "rgba(244,249,251,0.92)" },
  textarea: { width: "100%", minHeight: 120, resize: "vertical", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(17,38,52,0.10)", background: "rgba(255,255,255,0.96)", color: "#12202b", padding: "14px 16px", outline: "none", fontSize: 14 },
  modalActionRow: { display: "flex", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 15, border: "1px solid rgba(17,38,52,0.08)", background: "rgba(255,255,255,0.96)", color: "#12202b", cursor: "pointer", fontSize: 14, fontWeight: 800 },
  saveBtn: { flex: 1, height: 46, border: "none", borderRadius: 15, background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800 },
  deleteNoticeBox: { padding: 14, borderRadius: 18, marginBottom: 14, background: "rgba(255, 106, 137, 0.08)", border: "1px solid rgba(255, 106, 137, 0.16)" },
  deleteTitle: { margin: 0, color: "#c84d6a", fontSize: 16, fontWeight: 800 },
  deleteDesc: { margin: "8px 0 0", color: "#a45d70", fontSize: 13, lineHeight: 1.6 },
  deleteConfirmBtn: { flex: 1, height: 46, border: "none", borderRadius: 15, background: "linear-gradient(135deg, #b93d5a 0%, #ff5f7d 100%)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800 },
  deleteConfirmBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  detailMediaWrap: { background: "#dfe8ed" },
  detailMedia: { width: "100%", maxHeight: "72vh", objectFit: "contain", display: "block", background: "#dfe8ed" },
  detailInfoBox: { padding: 20 },
  detailHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  detailUserBlock: { display: "flex", alignItems: "center", gap: 10 },
  detailAvatar: { width: 42, height: 42, borderRadius: 999, background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 },
  detailUserName: { display: "block", color: "#12202b", fontSize: 15 },
  detailSubText: { margin: "2px 0 0", color: "#6f8892", fontSize: 12 },
  detailDate: { color: "#6f8892", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  detailTitle: { margin: 0, color: "#12202b", fontSize: 20, lineHeight: 1.35 },
  detailDesc: { margin: "8px 0 0", color: "#6f8892", fontSize: 13, lineHeight: 1.7 },
  detailActionRow: { display: "flex", gap: 10, marginTop: 16 },
  originalLink: { display: "inline-block", marginTop: 14, color: "#1f8a8a", textDecoration: "none", fontSize: 13, fontWeight: 700 },
  toast: { position: "fixed", left: "50%", bottom: 104, transform: "translateX(-50%)", zIndex: 1200, padding: "12px 16px", borderRadius: 999, color: "#12202b", background: "rgba(255,255,255,0.94)", border: "1px solid rgba(17,38,52,0.08)", fontSize: 13, fontWeight: 800, boxShadow: "0 10px 24px rgba(31,52,67,0.14)" },
};

export default Profile;