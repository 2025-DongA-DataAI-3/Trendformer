import { createRoot } from 'react-dom/client'
import './index.css'

import { Route, Routes, BrowserRouter } from 'react-router-dom'
import Home from './example/Home.jsx'
import Trend from './example/Trend.jsx'
import Upload from './example/Upload.jsx'
import Search from './example/Search.jsx'
import Profile from './example/Profile.jsx'
import Layout from './example/Layout.jsx'
import Login from './example/Login.jsx'
import Join from './example/Join.jsx'
import TikTokTest from './example/TikTokTest.jsx'
import CategoryVideos from './example/CategoryVideos.jsx'
import Lifecycle from './example/Lifecycle.jsx'
import RankList from './example/RankList.jsx' // ✅ 랭킹 리스트 컴포넌트 임포트 확인

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout></Layout>}>

        {/* 메인 및 트렌드 관련 */}
        <Route path='/' element={<Home></Home>}></Route>
        <Route path='/trend' element={<Trend></Trend>}></Route>
        <Route path='/category/:categoryId' element={<CategoryVideos></CategoryVideos>}></Route>

        {/* ✅ [추가] 랭킹 리스트 페이지 경로 */}
        <Route path='/ranking' element={<RankList></RankList>}></Route>

        {/* ✅ 생애 주기 분석 페이지 (키워드 상세) */}
        <Route path='/lifecycle' element={<Lifecycle></Lifecycle>}></Route>

        {/* 업로드 및 검색 */}
        <Route path='/upload' element={<Upload></Upload>}></Route>
        <Route path='/search' element={<Search></Search>}></Route>

        {/* 계정 관련 */}
        <Route path='/login' element={<Login></Login>}></Route>
        <Route path='/join' element={<Join></Join>}></Route>
        <Route path='/profile' element={<Profile></Profile>}></Route>

        {/* 테스트용 */}
        <Route path='/tiktok' element={<TikTokTest></TikTokTest>}></Route>

      </Route>
    </Routes>
  </BrowserRouter>
)