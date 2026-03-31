import { useEffect } from "react";

const TikTokCard = ({ videoId }) => {
  useEffect(() => {
    let script = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');

    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.tiktokEmbedLoad) {
      window.tiktokEmbedLoad();
    }

    return () => {};
  }, [videoId]);

  if (!videoId) {
    return <div className="content-video">틱톡 영상을 불러올 수 없습니다.</div>;
  }

  return (
    <div className="tiktok-wrap">
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/v/${videoId}`}
        data-video-id={videoId}
        style={{ maxWidth: "605px", minWidth: "325px", margin: "0 auto" }}
      >
        <section>
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://www.tiktok.com/v/${videoId}`}
          >
            영상을 불러오는 중...
          </a>
        </section>
      </blockquote>
    </div>
  );
};

export default TikTokCard;