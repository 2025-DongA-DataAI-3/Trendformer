import React, { useEffect } from 'react';

const TikTokCard = ({ videoId }) => {
  useEffect(() => {
    // 틱톡 임베드 전용 스크립트 로드
    const script = document.createElement('script');
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // 컴포넌트 제거 시 스크립트도 정리
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [videoId]);

  return (
    <div style={{ margin: '20px auto', display: 'flex', justifyContent: 'center' }}>
      <blockquote 
        className="tiktok-embed" 
        cite={`https://www.tiktok.com/v/${videoId}`} 
        data-video-id={videoId} 
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a target="_blank" rel="noreferrer" href={`https://www.tiktok.com/v/${videoId}`}>
            영상을 불러오는 중...
          </a>
        </section>
      </blockquote>
    </div>
  );
};

export default TikTokCard;