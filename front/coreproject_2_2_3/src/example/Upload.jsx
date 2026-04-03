import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileImage,
  FileVideo,
  Save,
  Sparkles,
  Tag,
  UploadCloud,
} from "lucide-react";

const Upload = () => {
  const fileInputRef = useRef(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    keywords: "",
    file: null,
  });

  const [errors, setErrors] = useState({});
  const [savedResult, setSavedResult] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/category")
      .then((res) => res.json())
      .then((data) => setCategoryOptions(data))
      .catch((err) => console.error("카테고리 로드 실패:", err));
  }, []);

  const createdAtPreview = useMemo(() => {
    return new Date().toLocaleString("ko-KR");
  }, []);

  const fileInfo = useMemo(() => {
    if (!form.file) return null;
    const isVideo = form.file.type.startsWith("video/");
    return {
      name: form.file.name,
      size: `${(form.file.size / 1024 / 1024).toFixed(2)} MB`,
      type: isVideo ? "video" : "image",
    };
  }, [form.file]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.file) nextErrors.file = "영상 또는 이미지를 첨부해주세요.";
    if (!form.title.trim()) nextErrors.title = "제목은 필수입니다.";
    if (!form.category) nextErrors.category = "카테고리를 선택해주세요.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const formData = new FormData();
      formData.append("file", form.file);
      formData.append("userId", user?.id || "");
      formData.append("title", form.title.trim());
      formData.append("category", form.category);
      formData.append("content", form.content.trim());
      formData.append("keywords", form.keywords);

      const response = await fetch("http://localhost:3002/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSavedResult({
          title: form.title.trim(),
          category: form.category,
          createdAt: new Date().toLocaleString("ko-KR"),
          keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          fileName: form.file?.name || "",
        });

        alert("업로드가 완료되었습니다.");
        setForm({ title: "", category: "", content: "", keywords: "", file: null });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setErrors({});
      } else {
        alert(data.message || "업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("업로드 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.heroCard}>
        <div style={styles.heroBadge}>
          <Sparkles size={14} />
          CREATOR UPLOAD
        </div>
        <h2 style={styles.heroTitle}>영상이나 이미지를 쉽고 정확하게 업로드할 수 있어야 합니다</h2>
        <p style={styles.heroDesc}>
          제목, 카테고리, 파일 첨부는 필수로 두고 나머지는 선택사항으로 분리해서
          사용자가 빠르게 등록할 수 있게 설계한 업로드 화면입니다.
        </p>
      </section>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.sectionHead}>
          <div>
            <span style={styles.eyebrow}>UPLOAD FORM</span>
            <h3 style={styles.sectionTitle}>콘텐츠 등록</h3>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>파일 첨부 *</label>
          <button type="button" style={styles.fileBox} onClick={() => fileInputRef.current?.click()}>
            <div style={styles.fileBoxIcon}><UploadCloud size={22} /></div>
            <div style={styles.fileBoxText}>
              <strong>영상 또는 이미지를 첨부하세요</strong>
              <span>클릭해서 파일 선택</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="video/*,image/*" onChange={handleFileChange} style={{ display: "none" }} />
          {errors.file && <p style={styles.errorText}>{errors.file}</p>}
          {fileInfo && (
            <div style={styles.fileInfoCard}>
              <div style={styles.fileInfoLeft}>
                {fileInfo.type === "video" ? <FileVideo size={18} color="#7ef3ea" /> : <FileImage size={18} color="#7ef3ea" />}
                <div>
                  <strong style={styles.fileInfoName}>{fileInfo.name}</strong>
                  <p style={styles.fileInfoMeta}>{fileInfo.type === "video" ? "영상 파일" : "이미지 파일"} · {fileInfo.size}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="title" style={styles.label}>제목 *</label>
          <input id="title" name="title" type="text" value={form.title} onChange={handleChange} placeholder="예: 오늘 가장 뜨는 유행어 밈" style={styles.input} />
          {errors.title && <p style={styles.errorText}>{errors.title}</p>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="category" style={styles.label}>카테고리 *</label>
          <select id="category" name="category" value={form.category} onChange={handleChange} style={styles.select}>
            <option value="">카테고리를 선택하세요</option>
            {categoryOptions.map((cat) => (
              <option key={cat.CATEGORY_ID} value={cat.CATEGORY_NAME}>
                {cat.CATEGORY_NAME}
              </option>
            ))}
          </select>
          {errors.category && <p style={styles.errorText}>{errors.category}</p>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="content" style={styles.label}>본문</label>
          <textarea id="content" name="content" value={form.content} onChange={handleChange} placeholder="영상이나 이미지에 대한 설명을 적어주세요" style={styles.textarea} />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="keywords" style={styles.label}>키워드</label>
          <input id="keywords" name="keywords" type="text" value={form.keywords} onChange={handleChange} placeholder="예: 밈, 유행어, 챌린지" style={styles.input} />
          <p style={styles.helperText}>쉼표(,)로 구분해서 입력하면 됩니다.</p>
        </div>

        <div style={styles.previewGrid}>
          <div style={styles.previewItem}>
            <div style={styles.previewLabel}><CalendarDays size={14} />작성일시</div><br />
            <strong style={styles.previewValue}>{createdAtPreview}</strong>
          </div>
          <div style={styles.previewItem}>
            <div style={styles.previewLabel}><Tag size={14} />현재 선택</div><br></br>
            <strong style={styles.previewValue}>{form.category || "카테고리 미선택"}</strong>
          </div>
        </div>

        <button type="submit" style={styles.submitButton}>
          <Save size={18} />
          저장하기
        </button>
      </form>

      {savedResult && (
        <section style={styles.resultCard}>
          <div style={styles.resultBadge}><CheckCircle2 size={15} />SAVE PREVIEW</div>
          <h3 style={styles.resultTitle}>저장 결과 미리보기</h3>
          <div style={styles.resultList}>
            <div style={styles.resultRow}><span style={styles.resultKey}>제목</span><strong style={styles.resultValue}>{savedResult.title}</strong></div>
            <div style={styles.resultRow}><span style={styles.resultKey}>카테고리</span><strong style={styles.resultValue}>{savedResult.category}</strong></div>
            <div style={styles.resultRow}><span style={styles.resultKey}>파일명</span><strong style={styles.resultValue}>{savedResult.fileName}</strong></div>
            <div style={styles.resultRow}><span style={styles.resultKey}>작성일시</span><strong style={styles.resultValue}>{savedResult.createdAt}</strong></div>
            <div style={styles.resultRow}>
              <span style={styles.resultKey}>키워드</span>
              <strong style={styles.resultValue}>{savedResult.keywords.length ? savedResult.keywords.join(", ") : "없음"}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const baseField = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "16px",
  border: "1px solid rgba(17, 38, 52, 0.10)",
  background: "rgba(255, 255, 255, 0.96)",
  color: "#12202b",
  padding: "14px 16px",
  outline: "none",
  fontSize: "14px",
  boxShadow: "inset 0 1px 2px rgba(31, 52, 67, 0.04)",
};

const styles = {
  page: {
    padding: "0 16px 28px",
    color: "#12202b",
    boxSizing: "border-box",
  },

  heroCard: {
    padding: "20px",
    borderRadius: "26px",
    marginBottom: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,250,252,0.98) 100%)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    boxShadow:
      "0 16px 36px rgba(31, 52, 67, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    color: "#1f8a8a",
    background: "rgba(63, 208, 201, 0.12)",
    border: "1px solid rgba(63, 208, 201, 0.18)",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "14px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.22,
    letterSpacing: "-0.04em",
    color: "#12202b",
  },

  heroDesc: {
    margin: "10px 0 0",
    color: "#68808e",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  formCard: {
    padding: "18px",
    borderRadius: "26px",
    marginBottom: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,250,252,0.98) 100%)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    boxShadow:
      "0 16px 36px rgba(31, 52, 67, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  sectionHead: {
    marginBottom: "14px",
  },

  eyebrow: {
    display: "inline-block",
    marginBottom: "4px",
    color: "#1c9da0",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  sectionTitle: {
    margin: 0,
    color: "#12202b",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#243b4a",
    fontSize: "14px",
    fontWeight: 700,
  },

  fileBox: {
    width: "100%",
    borderRadius: "18px",
    border: "1px dashed rgba(63, 208, 201, 0.26)",
    background: "rgba(255, 255, 255, 0.92)",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 8px 18px rgba(31, 52, 67, 0.05)",
  },

  fileBoxIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "rgba(63, 208, 201, 0.12)",
    color: "#1f8a8a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  fileBoxText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
    color: "#12202b",
  },

  fileInfoCard: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    boxShadow: "0 8px 18px rgba(31, 52, 67, 0.05)",
  },

  fileInfoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  fileInfoName: {
    color: "#12202b",
    fontSize: "14px",
  },

  fileInfoMeta: {
    margin: "4px 0 0",
    color: "#6b818e",
    fontSize: "12px",
  },

  input: baseField,

  select: {
    ...baseField,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    color: "#12202b",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },

  textarea: {
    ...baseField,
    minHeight: "120px",
    resize: "vertical",
  },

  helperText: {
    margin: "8px 0 0",
    color: "#7a909c",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  errorText: {
    margin: "8px 0 0",
    color: "#e25b77",
    fontSize: "12px",
    fontWeight: 700,
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },

  previewItem: {
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    boxShadow: "0 8px 18px rgba(31, 52, 67, 0.05)",
  },

  previewLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#6b818e",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },

  previewValue: {
    color: "#12202b",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  submitButton: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "16px",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 800,
    color: "#ffffff",
    background: "linear-gradient(135deg, #16767b 0%, #239da0 48%, #6be4da 100%)",
    boxShadow: "0 10px 20px rgba(35,157,160,0.22)",
  },

  resultCard: {
    padding: "18px",
    borderRadius: "26px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,250,252,0.98) 100%)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    boxShadow:
      "0 16px 36px rgba(31, 52, 67, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  },

  resultBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    color: "#1f8a8a",
    background: "rgba(63, 208, 201, 0.12)",
    border: "1px solid rgba(63, 208, 201, 0.18)",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "14px",
  },

  resultTitle: {
    margin: 0,
    color: "#12202b",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },

  resultList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "16px",
  },

  resultRow: {
    padding: "13px 14px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(17, 38, 52, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxShadow: "0 8px 18px rgba(31, 52, 67, 0.05)",
  },

  resultKey: {
    color: "#6b818e",
    fontSize: "13px",
    fontWeight: 700,
    flexShrink: 0,
  },

  resultValue: {
    color: "#12202b",
    fontSize: "13px",
    textAlign: "right",
    lineHeight: 1.5,
  },
};

export default Upload;