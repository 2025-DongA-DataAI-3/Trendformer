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

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout></Layout>}>
        <Route path='/' element={<Home></Home>}></Route>
        <Route path='/trend' element={<Trend></Trend>}></Route>
        <Route path='/category/:categoryId' element={<CategoryVideos></CategoryVideos>}></Route>
        <Route path='/upload' element={<Upload></Upload>}></Route>
        <Route path='/search' element={<Search></Search>}></Route>
        <Route path='/login' element={<Login></Login>}></Route>
        <Route path='/join' element={<Join></Join>}></Route>
        <Route path='/profile' element={<Profile></Profile>}></Route>
        <Route path='/tiktok' element={<TikTokTest></TikTokTest>}></Route>
      </Route>
    </Routes>
  </BrowserRouter>
)