import { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  BANNER_SLOTS,
  getBannerUrlFresh,
  getBannerUrl,
  uploadBanner,
  deleteBanner,
} from "./cloudinary";
import "./app.css";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="Oneway" className="login-logo-img" />
          <span className="logo-sub">banner admin</span>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 입력" required />
          </div>
          <div className="field">
            <label>비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BannerCard({ slot }) {
  const [previewUrl, setPreviewUrl] = useState(getBannerUrlFresh(slot.id));
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [imgError, setImgError] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [imgSize, setImgSize] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("PNG, JPG, WEBP, GIF 파일만 업로드 가능해요.");
      setStatus("error");
      return;
    }

    const kb = (file.size / 1024).toFixed(0);
    const tempImg = new Image();
    const objectUrl = URL.createObjectURL(file);
    tempImg.onload = () => {
      setImgSize({ width: tempImg.naturalWidth, height: tempImg.naturalHeight, kb });
      URL.revokeObjectURL(objectUrl);
    };
    tempImg.src = objectUrl;

setStatus("uploading");
    setErrorMsg("");
    try {
      await uploadBanner(slot.id, file);
      setTimeout(() => {
        setImgError(false);
        setPreviewUrl(getBannerUrlFresh(slot.id));
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2500);
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleDelete = async () => {
    if (!confirm(slot.label + "을 삭제할까요?")) return;
    setStatus("deleting");
    setImgSize(null);
    try {
      await deleteBanner(slot.id);
      setPreviewUrl(getBannerUrlFresh(slot.id));
      setImgError(false);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const isLoading = status === "uploading" || status === "deleting";

  return (
    <div className={"banner-card" + (dragging ? " dragging" : "")}>
      <div className="banner-label-row">
        <span className="banner-label">{slot.label}</span>
        {imgSize && (
          <span className="img-size-badge">
            {imgSize.width} x {imgSize.height}px &nbsp;·&nbsp;
            {imgSize.kb >= 1024 ? (imgSize.kb / 1024).toFixed(1) + "MB" : imgSize.kb + "KB"}
          </span>
        )}
      </div>

      <div
        className="preview-area"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {imgError ? (
          <div className="preview-empty">
            <span className="empty-icon">+</span>
            <span className="empty-text">이미지 없음</span>
            <span className="empty-hint">여기에 드래그하거나 아래 버튼으로 업로드</span>
          </div>
        ) : (
        <img src={previewUrl} alt={slot.label} className="preview-img" onLoad={() => setImgError(false)} onError={() => setImgError(true)} />        )}
        {isLoading && (
          <div className="preview-overlay">
            <div className="spinner" />
            <span>{status === "uploading" ? "업로드 중..." : "삭제 중..."}</span>
          </div>
        )}
        {status === "success" && (
          <div className="preview-overlay success">
            <span className="check">✓</span>
            <span>업로드 완료!</span>
          </div>
        )}
      </div>

      <div className="url-box">
        <span className="url-label">고정 URL</span>
        <div className="url-row">
          <span className="url-text">{getBannerUrl(slot.id)}</span>
          <button className="btn-copy" onClick={() => navigator.clipboard.writeText(getBannerUrl(slot.id))}>복사</button>
        </div>
      </div>

      {status === "error" && <p className="card-error">{errorMsg}</p>}

      <div className="card-actions">
        <label className="btn-upload" aria-disabled={isLoading}>
          {isLoading ? "처리 중..." : "이미지 교체"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleInputChange} disabled={isLoading} style={{ display: "none" }} />
        </label>
        <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>삭제</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="header-logo">
  <img src="/logo.png" alt="Oneway" className="header-logo-img" />
          <span className="logo-sub">banner admin</span>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={() => signOut(auth)}>로그아웃</button>
        </div>
      </header>
      <main className="admin-main">
        <div className="page-title">
          <h1>배너 관리</h1>
          <p>이미지를 교체하면 스마트스토어 html이 심어진 모든 상품 상세페이지에 즉시 반영돼요.</p>
        </div>
        <div className="banner-grid">
          {BANNER_SLOTS.map((slot) => (
            <BannerCard key={slot.id} slot={slot} />
          ))}
        </div>
      </main>
    </div>
  );
}
