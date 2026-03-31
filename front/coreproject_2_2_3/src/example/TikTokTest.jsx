import React from 'react'
import TikTokCard from '../assets/TikTokCard'

const testVideoId = "7597384100005170439"; 

const TikTokTest = () => {
  return (
    <div style={{ textAlign: 'center', backgroundColor: '#121212', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1>Trendformer TikTok Feed</h1>
      <p>데이터베이스의 ID를 이용한 임베드 테스트</p>
      
      <TikTokCard videoId={testVideoId} />
    </div>
  )
}

export default TikTokTest