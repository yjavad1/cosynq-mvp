import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Cosynq
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your premier coworking platform solution
        </p>
        
        {isAuthenticated ? (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-gray-700 mb-6">
              Ready to manage your coworking experience?
            </p>
            <Link
              to="/dashboard"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-700 mb-6">
              Join thousands of professionals in our coworking community
            </p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="block w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage