import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./Join.css";

const Join = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    pw: "",
    nickname: "",
    email: "",
    company: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReady = useMemo(() => {
    return (
      form.id.trim() &&
      form.pw.trim() &&
      form.nickname.trim() &&
      form.email.trim() &&
      form.company.trim()
    );
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      common: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.id.trim()) nextErrors.id = "아이디를 입력해주세요.";
    if (!form.pw.trim()) nextErrors.pw = "비밀번호를 입력해주세요.";
    if (form.pw.trim() && form.pw.length < 4) {
      nextErrors.pw = "비밀번호는 4자 이상이어야 합니다.";
    }
    if (!form.nickname.trim()) nextErrors.nickname = "닉네임을 입력해주세요.";
    if (!form.email.trim()) nextErrors.email = "이메일을 입력해주세요.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "이메일 형식을 확인해주세요.";
    }
    if (!form.company.trim()) nextErrors.company = "소속 또는 팀명을 입력해주세요.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleJoin = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3002/user/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id.trim(),
          pw: form.pw,
          nickname: form.nickname.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("회원가입이 완료되었습니다.");
        navigate("/login");
      } else {
        setErrors({
          common: data.message || "회원가입에 실패했습니다.",
        });
      }
    } catch (error) {
      console.error("회원가입 요청 실패:", error);
      setErrors({
        common: "서버와 통신 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-bg" />
      <div className="join-overlay" />

      <div className="join-panel">
        <div className="join-badge">
          <Sparkles size={14} />
          CREATE YOUR ACCOUNT
        </div>

        <h1 className="join-title">회원가입</h1>
        <p className="join-subtitle">
          트렌드포머에서 저장, 추천, 업로드 기능을 더 편하게 사용해보세요
        </p>

        <div className="join-highlight-row">
          <div className="join-highlight-item">
            <BadgeCheck size={15} />
            개인화 추천 시작
          </div>
          <div className="join-highlight-item">
            <Sparkles size={15} />
            저장 목록 관리
          </div>
        </div>

        <form className="join-form" onSubmit={handleJoin}>
          <div className="join-input-group">
            <label className="join-label">아이디</label>
            <div className="join-input-wrap">
              <AtSign size={18} className="join-input-icon" />
              <input
                type="text"
                name="id"
                placeholder="아이디를 입력하세요"
                value={form.id}
                onChange={handleChange}
                className="join-input"
              />
            </div>
            {errors.id && <p className="join-error-text">{errors.id}</p>}
          </div>

          <div className="join-input-group">
            <label className="join-label">비밀번호</label>
            <div className="join-input-wrap">
              <LockKeyhole size={18} className="join-input-icon" />
              <input
                type="password"
                name="pw"
                placeholder="비밀번호를 입력하세요"
                value={form.pw}
                onChange={handleChange}
                className="join-input"
              />
            </div>
            {errors.pw && <p className="join-error-text">{errors.pw}</p>}
          </div>

          <div className="join-input-group">
            <label className="join-label">닉네임</label>
            <div className="join-input-wrap">
              <UserRound size={18} className="join-input-icon" />
              <input
                type="text"
                name="nickname"
                placeholder="닉네임을 입력하세요"
                value={form.nickname}
                onChange={handleChange}
                className="join-input"
              />
            </div>
            {errors.nickname && <p className="join-error-text">{errors.nickname}</p>}
          </div>

          <div className="join-input-group">
            <label className="join-label">이메일</label>
            <div className="join-input-wrap">
              <Mail size={18} className="join-input-icon" />
              <input
                type="email"
                name="email"
                placeholder="이메일을 입력하세요"
                value={form.email}
                onChange={handleChange}
                className="join-input"
              />
            </div>
            {errors.email && <p className="join-error-text">{errors.email}</p>}
          </div>

          <div className="join-input-group">
            <label className="join-label">소속 / 팀명</label>
            <div className="join-input-wrap">
              <BriefcaseBusiness size={18} className="join-input-icon" />
              <input
                type="text"
                name="company"
                placeholder="예: TrendFormer Team"
                value={form.company}
                onChange={handleChange}
                className="join-input"
              />
            </div>
            {errors.company && <p className="join-error-text">{errors.company}</p>}
          </div>

          {errors.common && <div className="join-error-box">{errors.common}</div>}

          <button
            type="submit"
            className="join-submit-btn"
            disabled={!isReady || isSubmitting}
          >
            {isSubmitting ? "가입 처리 중..." : "회원가입 완료"}
          </button>
        </form>

        <div className="join-divider" />

        <div className="join-bottom">
          <p className="join-bottom-text">이미 계정이 있으신가요?</p>
          <button
            type="button"
            className="join-login-btn"
            onClick={() => navigate("/login")}
          >
            로그인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default Join;