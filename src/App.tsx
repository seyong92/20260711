import { InvitationPage } from './components/InvitationPage'
import { appConfig } from './config/appConfig'
import { GamePage } from './game/ui/GamePage'
import { isRouteMatch } from './lib/routes'

function App() {
  if (isRouteMatch(window.location.pathname, appConfig.gamePath)) {
    return <GamePage />
  }

  return <InvitationPage />
}

export default App
