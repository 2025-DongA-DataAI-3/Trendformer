import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
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
    nick: "",
    email: "",
    team: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFilled = useMemo(() => {
    return (
      form.id.trim() &&
      form.pw.trim() &&
      form.nick.trim() &&
      form.email.trim() &&
      form.team.trim()
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
    if (!form.nick.trim()) nextErrors.nick = "닉네임을 입력해주세요.";

    if (!form.email.trim()) {
      nextErrors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    if (!form.team.trim()) nextErrors.team = "소속 / 팀명을 입력해주세요.";

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
          nick: form.nick.trim(),
          email: form.email.trim(),
          team: form.team.trim(),
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
      console.error("회원가입 실패:", error);
      setErrors({
        common: "서버와 통신 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-phone-frame">
        <main className="join-card">
          <div className="join-copy-box">
            <p className="join-copy-main">
              실시간 인기 밈을 가장 직관적으로 탐색하는 숏폼 플랫폼
            </p>
            <p className="join-copy-sub">
              트렌드포머에서 저장, 추천, 업로드 기능을 더 편하게 사용해보세요
            </p>
          </div>

          <div className="join-chip-row">
            <div className="join-chip">
              <Sparkles size={14} />
              개인화 추천 시작
            </div>
            <div className="join-chip">
              <Sparkles size={14} />
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
                  autoComplete="username"
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
                  autoComplete="new-password"
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
                  name="nick"
                  placeholder="닉네임을 입력하세요"
                  value={form.nick}
                  onChange={handleChange}
                  className="join-input"
                />
              </div>
              {errors.nick && <p className="join-error-text">{errors.nick}</p>}
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
                  autoComplete="email"
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
                  name="team"
                  placeholder="예: TrendFormer Team"
                  value={form.team}
                  onChange={handleChange}
                  className="join-input"
                />
              </div>
              {errors.team && <p className="join-error-text">{errors.team}</p>}
            </div>

            {errors.common && <div className="join-error-box">{errors.common}</div>}

            <button
              type="submit"
              className="join-submit-btn"
              disabled={!isFilled || isSubmitting}
            >
              {isSubmitting ? "회원가입 처리 중..." : "회원가입 완료"}
            </button>
          </form>

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
        </main>
      </div>
    </div>
  );
};

export default Join;