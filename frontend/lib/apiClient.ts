// frontend/lib/apiClient.ts

import { signOut } from 'next-auth/react'
import { toast } from 'react-hot-toast'

// This is our new, smart fetch wrapper
export const apiClient = async (
  url: string,
  token: string | undefined, // The session token
  options: RequestInit = {} // Standard fetch options (method, body, etc.)
) => {
  // 1. Prepare the headers, always including the Authorization token
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  // 2. Make the actual API call
  const response = await fetch(url, { ...options, headers })

  // 3. THIS IS THE CRITICAL PART: Check for a 401 error
  if (response.status === 401) {
    // The token is expired or invalid
    toast.error('Your session has expired. Please sign in again.')

    // Use NextAuth's signOut function to log the user out
    // It will redirect them to the login page automatically
    await signOut({ callbackUrl: '/' })

    // We can throw an error here to stop any further code in the component from running
    throw new Error('Session expired')
  }

  // 4. If the response is not 401, return it as normal
  return response
}