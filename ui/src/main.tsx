import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || '')
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppWithProviders() {
  if (clerkKey) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    )
  }
  return (
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppWithProviders />
    </ErrorBoundary>
  </React.StrictMode>,
)
