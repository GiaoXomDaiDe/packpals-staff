import { useEffect, useState } from 'react'
import { Login } from './components/Login'
import Dashboard from './pages/Dashboard'

interface User {
  id: string
  username: string
  fullName: string
  email: string
  role: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in when app starts
  useEffect(() => {
    const token = localStorage.getItem('staff_token')
    const userData = localStorage.getItem('staff_user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        // Clear invalid data
        localStorage.removeItem('staff_token')
        localStorage.removeItem('staff_user')
      }
    }
    
    setIsLoading(false)
  }, [])

  const handleLogin = async (userData: User, _token: string) => {
    setUser(userData)
    // Token and user data are already stored in localStorage by Login component
  }

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('staff_user')
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
