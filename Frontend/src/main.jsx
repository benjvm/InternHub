import { createRoot } from 'react-dom/client'
import App from './App'
import { UserProvider } from './services/userService'
import './index.css'
import './assets/styles/home.css'


createRoot(document.getElementById('root')).render(
  <UserProvider>
    <App />
  </UserProvider>,
)
