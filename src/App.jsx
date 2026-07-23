import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import BackToTop from './components/BackToTop.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Character from './pages/Character.jsx'
import Houses from './pages/Houses.jsx'
import HouseDetail from './pages/HouseDetail.jsx'
import Logs from './pages/Logs.jsx'
import Admin from './pages/Admin.jsx'
import Wiki from './pages/Wiki.jsx'
import Compendium from './pages/Compendium.jsx'
import Tools from './pages/Tools.jsx'
import Profile from './pages/Profile.jsx'
import Lore from './pages/Lore.jsx'
import CharacterCreator from './pages/CharacterCreator.jsx'
import War from './pages/War.jsx'
import PvE from './pages/PvE.jsx'
import Community from './pages/Community.jsx'
import Quests from './pages/Quests.jsx'
import Crafting from './pages/Crafting.jsx'
import HouseManagement from './pages/HouseManagement.jsx'
import Trade from './pages/Trade.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ScrollProgress />
        <Navbar />
        <div className="page-fade">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/:id" element={<HouseDetail />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/compendium" element={<Compendium />} />
            <Route path="/lore" element={<Lore />} />
            <Route path="/tools" element={<Tools />} />
            <Route
              path="/profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="/character"
              element={<ProtectedRoute><Character /></ProtectedRoute>}
            />
            <Route
              path="/character-creator"
              element={<ProtectedRoute allowUnapproved><CharacterCreator /></ProtectedRoute>}
            />
            <Route
              path="/logs"
              element={<ProtectedRoute><Logs /></ProtectedRoute>}
            />
            <Route
              path="/war"
              element={<ProtectedRoute><War /></ProtectedRoute>}
            />
            <Route
              path="/pve"
              element={<ProtectedRoute><PvE /></ProtectedRoute>}
            />
            <Route
              path="/community"
              element={<ProtectedRoute><Community /></ProtectedRoute>}
            />
            <Route
              path="/quests"
              element={<ProtectedRoute><Quests /></ProtectedRoute>}
            />
            <Route
              path="/crafting"
              element={<ProtectedRoute><Crafting /></ProtectedRoute>}
            />
            <Route
              path="/house"
              element={<ProtectedRoute><HouseManagement /></ProtectedRoute>}
            />
            <Route
              path="/trade"
              element={<ProtectedRoute><Trade /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <BackToTop />
        <Footer />
      </AuthProvider>
    </ErrorBoundary>
  )
}
