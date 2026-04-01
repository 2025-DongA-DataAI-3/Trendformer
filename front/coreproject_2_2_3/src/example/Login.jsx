import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    pw: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFilled = useMemo(() => {
    return form.id.trim() && form.pw.trim();
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3002/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id.trim(),
          pw: form.pw,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/profile");
      } else {
        setErrors({
          common: data.message || "로그인에 실패했습니다.",
        });
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      setErrors({
        common: "서버와 통신 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-overlay" />

      <div className="login-floating-card">
        <div className="login-floating-chip">
          <Sparkles size={14} />
          MEMBER ACCESS
        </div>

        <h1 className="login-title">TrendFormer</h1>
        <p className="login-subtitle">
          실시간 밈과 숏폼 트렌드를 더 빠르게 탐색하려면 로그인하세요
        </p>

        <div className="login-highlight-row">
          <div className="login-highlight-item">
            <ShieldCheck size={15} />
            저장한 영상 동기화
          </div>
          <div className="login-highlight-item">
            <Sparkles size={15} />
            맞춤 추천 반영
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-group">
            <label className="login-label">아이디</label>
            <div className="login-input-wrap">
              <UserRound size={18} className="login-input-icon" />
              <input
                type="text"
                name="id"
                placeholder="아이디를 입력하세요"
                value={form.id}
                onChange={handleChange}
                className="login-input"
                autoComplete="username"
              />
            </div>
            {errors.id && <p className="login-error-text">{errors.id}</p>}
          </div>

          <div className="login-input-group">
            <label className="login-label">비밀번호</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} className="login-input-icon" />
              <input
                type="password"
                name="pw"
                placeholder="비밀번호를 입력하세요"
                value={form.pw}
                onChange={handleChange}
                className="login-input"
                autoComplete="current-password"
              />
            </div>
            {errors.pw && <p className="login-error-text">{errors.pw}</p>}
          </div>

          {errors.common && <div className="login-error-box">{errors.common}</div>}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={!isFilled || isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="login-divider" />

        <div className="login-bottom">
          <p className="login-bottom-text">아직 회원이 아니신가요?</p>
          <button
            type="button"
            className="login-join-btn"
            onClick={() => navigate("/join")}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;