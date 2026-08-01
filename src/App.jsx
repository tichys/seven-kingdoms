import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import BackToTop from './components/BackToTop.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Loading from './components/Loading.jsx'

const Character = lazy(() => import('./pages/Character.jsx'))
const Houses = lazy(() => import('./pages/Houses.jsx'))
const HouseDetail = lazy(() => import('./pages/HouseDetail.jsx'))
const Logs = lazy(() => import('./pages/Logs.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Wiki = lazy(() => import('./pages/Wiki.jsx'))
const Compendium = lazy(() => import('./pages/Compendium.jsx'))
const Tools = lazy(() => import('./pages/Tools.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Lore = lazy(() => import('./pages/Lore.jsx'))
const CharacterCreator = lazy(() => import('./pages/CharacterCreator.jsx'))
const War = lazy(() => import('./pages/War.jsx'))
const PvE = lazy(() => import('./pages/PvE.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const Quests = lazy(() => import('./pages/Quests.jsx'))
const Crafting = lazy(() => import('./pages/Crafting.jsx'))
const HouseManagement = lazy(() => import('./pages/HouseManagement.jsx'))
const Trade = lazy(() => import('./pages/Trade.jsx'))
const RP = lazy(() => import('./pages/RP.jsx'))
const ObjectUI = lazy(() => import('./pages/ObjectUI.jsx'))
const Factions = lazy(() => import('./pages/Factions.jsx'))
const Religion = lazy(() => import('./pages/Religion.jsx'))
const World = lazy(() => import('./pages/World.jsx'))
const DiscordCallback = lazy(() => import('./pages/DiscordCallback.jsx'))
const QuestEditor = lazy(() => import('./pages/QuestEditor.jsx'))
const PropEditor = lazy(() => import('./pages/PropEditor.jsx'))
const PropGallery = lazy(() => import('./pages/PropGallery.jsx'))
const HouseCrestEditor = lazy(() => import('./pages/HouseCrestEditor.jsx'))
const Roster = lazy(() => import('./pages/Roster.jsx'))
const Events = lazy(() => import('./pages/Events.jsx'))
const Housing = lazy(() => import('./pages/Housing.jsx'))
const CastleLedger = lazy(() => import('./pages/CastleLedger.jsx'))
const RavenNetwork = lazy(() => import('./pages/RavenNetwork.jsx'))
const Maester = lazy(() => import('./pages/Maester.jsx'))
const CitizenDirectory = lazy(() => import('./pages/CitizenDirectory.jsx'))
const Forms = lazy(() => import('./pages/Forms.jsx'))
const Health = lazy(() => import('./pages/Health.jsx'))

const PageFallback = () => <div className="page-content"><Loading /></div>

export default function App() {
  const location = useLocation()
  const isObjectUI = location.pathname === '/object'

  return (
    <ErrorBoundary>
      <AuthProvider>
        {!isObjectUI && <ScrollProgress />}
        {!isObjectUI && <Navbar />}
        <div className="page-fade">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/discord-callback" element={<DiscordCallback />} />
              <Route path="/quest-editor" element={<ProtectedRoute adminOnly><QuestEditor /></ProtectedRoute>} />
              <Route path="/props" element={<ProtectedRoute><PropGallery /></ProtectedRoute>} />
              <Route path="/props/editor" element={<ProtectedRoute adminOnly><PropEditor /></ProtectedRoute>} />
              <Route path="/house/crest" element={<ProtectedRoute><HouseCrestEditor /></ProtectedRoute>} />
              <Route path="/house/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
              <Route path="/events" element={<Events />} />
              <Route path="/housing" element={<ProtectedRoute><Housing /></ProtectedRoute>} />
              <Route path="/ledger" element={<ProtectedRoute><CastleLedger /></ProtectedRoute>} />
              <Route path="/raven" element={<ProtectedRoute><RavenNetwork /></ProtectedRoute>} />
              <Route path="/maester" element={<ProtectedRoute><Maester /></ProtectedRoute>} />
              <Route path="/directory" element={<ProtectedRoute><CitizenDirectory /></ProtectedRoute>} />
              <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
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
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
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
                path="/activities"
                element={<ProtectedRoute><RP /></ProtectedRoute>}
              />
              <Route
                path="/factions"
                element={<ProtectedRoute><Factions /></ProtectedRoute>}
              />
              <Route
                path="/religion"
                element={<ProtectedRoute><Religion /></ProtectedRoute>}
              />
              <Route
                path="/world"
                element={<ProtectedRoute><World /></ProtectedRoute>}
              />
              <Route path="/object" element={<ObjectUI />} />
              <Route
                path="/admin"
                element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        {!isObjectUI && <BackToTop />}
        {!isObjectUI && <Footer />}
      </AuthProvider>
    </ErrorBoundary>
  )
}
