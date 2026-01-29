"use client"

import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/app/Database/Firebase'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { CgWebsite } from "react-icons/cg";

function page() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedType, setSelectedType] = useState('website')
  const [formData, setFormData] = useState<any>('')
  const [generatedReference, setGeneratedReference] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get data from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserName(userData.name || "User")
            setLoading(false)
          } else {
            setUserName(user.displayName || 'User')
            setLoading(false)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setLoading(false)
        }
      } else {
        // no user signedin, redirect to signin page
        router.push('/signin')
      }
    })

    return () => { unsubscribe() }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    console.log("Form Data", formData)
  }

  const generateReference = async () => {
    let reference = ''

    switch (selectedType) {
      case 'website':
        // Author(s) (Year) Title. Available at: URL (Accessed: Date)
        // send data to server
        console.log("Sending data to API", formData)
        const response = await fetch('/api/reference/website', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
        const data = await response.json()

        let title = data.titleElementText
        const author = data.author
        const year = data.year

        console.log("Recieved data from API response", data)
        reference = `${author}. (${year}). ${title}. [online] Available at: ${formData.url} [Accessed: ${new Date().toLocaleDateString()}.]`
        setGeneratedReference(reference)
        console.log("Generated Reference", reference)
        break



      case 'book':
        // Author(s) (Year) Title. Edition. Place: Publisher.
        reference = `${formData.author || 'Author'} (${formData.year || 'Year'}) ${formData.title || 'Title'}. ${formData.edition ? formData.edition + '. ' : ''}${formData.place || 'Place'}: ${formData.publisher || 'Publisher'}.`
        break

      case 'journal':
        // Author(s) (Year) 'Article title', Journal Name, Volume(Issue), pp. pages.
        reference = `${formData.author || 'Author'} (${formData.year || 'Year'}) '${formData.articleTitle || 'Article title'}', ${formData.journalName || 'Journal Name'}, ${formData.volume || 'Volume'}(${formData.issue || 'Issue'}), pp. ${formData.pages || 'pages'}.`
        break

      case 'video':
        // Author/Username (Year) Title. Available at: URL (Accessed: Date)
        reference = `${formData.author || 'Author/Username'} (${formData.year || 'Year'}) ${formData.title || 'Title'} [Video]. Available at: ${formData.url || 'URL'} (Accessed: ${formData.accessDate || 'Date'}).`
        break
    }

    setGeneratedReference(reference)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReference)
    alert('Reference copied to clipboard!')
  }

  const clearForm = () => {
    setFormData({})
    setGeneratedReference('')
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section with Welcome Message */}
      <section className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
            Ready to make your university life easier?
          </p>
          <button className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition-colors animate-fade-in-up animation-delay-400">
            Lets Go!
          </button>
        </div>
      </section>

      {/* Your other profile content can go here */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Harvard Reference Generator</h2>
          <p className="text-gray-600 text-center mb-8">Generate accurate Harvard-style references instantly.</p>

          {/* Source Type Selector */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center">

            {['website', 'book', 'journal', 'video'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setFormData({})
                  setGeneratedReference('')
                }}
                className={`px-6 py-3 rounded-lg font-semibold capitalize transition-colors ${selectedType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
            {selectedType === 'website' && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="url"
                  placeholder="Paste a Website URL (e.g. https://example.com)"
                  value={formData.url || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {selectedType === 'book' && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="author"
                  placeholder="Paste a Book URL (e.g. https://example.com)"
                  value={formData.author || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                />

              </div>
            )}

            {selectedType === 'journal' && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="author"
                  placeholder="Paste a Journal URL (e.g. https://example.com)"
                  value={formData.author || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {selectedType === 'video' && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="author"
                  placeholder="Paste a Video URL (e.g. https://example.com)"
                  value={formData.author || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={generateReference}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Generate Reference
              </button>
              <button
                onClick={clearForm}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Generated Reference Display */}
          {generatedReference && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">Generated Reference:</h3>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                >
                  Copy
                </button>
              </div>
              <p className="text-gray-800 leading-relaxed border-l-4 border-purple-600 pl-4 py-2 bg-purple-50">
                {generatedReference}
              </p>
            </div>
          )}
        </div>
      </section>


      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}
      </style>
    </div>
  )
}

export default page