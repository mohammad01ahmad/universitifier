'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from '@/lib/Database/Firebase'

export const useAuthenticatedUser = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('Student')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        setLoading(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', nextUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserName(
            (typeof data.name === 'string' && data.name) ||
              (typeof data.displayName === 'string' && data.displayName) ||
              nextUser.displayName ||
              'Student'
          )
        } else {
          setUserName(nextUser.displayName || 'Student')
        }
      } catch (error) {
        console.error('Failed to read user profile', error)
        setUserName(nextUser.displayName || 'Student')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    userName,
    loading,
  }
}
