import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'
import { VersionChecker } from '@/components/shared/VersionChecker'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <VersionChecker />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
