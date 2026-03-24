'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FaRegCopy } from 'react-icons/fa6'
import { FaSortAlphaDown } from 'react-icons/fa'
import { MdDone } from 'react-icons/md'

import { Button } from '@/components/ui/button'

type ReferenceType = 'website' | 'book' | 'video'

type ReferenceFormData = {
  url?: string
  author?: string
  year?: string
  title?: string
  edition?: string
  place?: string
  publisher?: string
}

type ApiSuccessResponse = {
  title: string
  author: string
  year: string
  accessDate?: string
}

type ApiErrorResponse = {
  error?: string
}

type ReferenceGeneratorProps = {
  embedded?: boolean
  title?: string
  description?: string
  references?: string[]
  onAddReference?: (reference: string) => void
}

const sourceTypes: ReferenceType[] = ['website', 'book', 'video']

export const ReferenceGenerator = ({
  embedded = false,
  title = 'Harvard Reference Generator',
  description = 'Generate accurate Harvard-style references instantly.',
  references,
  onAddReference,
}: ReferenceGeneratorProps) => {
  const [refLoading, setRefLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<ReferenceType>('website')
  const [formData, setFormData] = useState<ReferenceFormData>({})
  const [generatedReference, setGeneratedReference] = useState('')
  const [copyButtonText, setCopyButtonText] = useState(false)
  const [copyListButtonText, setCopyListButtonText] = useState(false)
  const [ascendingOrder, setAscendingOrder] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ url?: string }>({})
  const [formError, setFormError] = useState('')
  const [generateReferenceList, setGenerateReferenceList] = useState<string[]>(references ?? [])

  useEffect(() => {
    if (references) {
      setGenerateReferenceList(references)
    }
  }, [references])

  const sectionClassName = useMemo(
    () =>
      embedded
        ? 'space-y-5'
        : 'py-20 px-6 bg-gray-50',
    [embedded]
  )

  const containerClassName = useMemo(
    () =>
      embedded
        ? 'space-y-5'
        : 'max-w-4xl mx-auto',
    [embedded]
  )

  const parseApiResponse = async (response: Response) => {
    const data = (await response.json()) as ApiSuccessResponse & ApiErrorResponse

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate reference')
    }

    return data
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
    setFieldErrors((prev) => ({
      ...prev,
      [event.target.name]: undefined,
    }))
    setFormError('')
  }

  const pushReference = (reference: string) => {
    const nextReferences = [...generateReferenceList, reference]
    setGenerateReferenceList(nextReferences)
    onAddReference?.(reference)
  }

  const generateReference = async () => {
    let reference = ''
    const trimmedUrl = formData.url?.trim() || ''
    setRefLoading(true)
    setFieldErrors({})
    setFormError('')

    if ((selectedType === 'website' || selectedType === 'video') && !trimmedUrl) {
      setFieldErrors({ url: 'URL is required' })
      setRefLoading(false)
      return
    }

    try {
      switch (selectedType) {
        case 'website': {
          const response = await fetch('/api/v1/reference/website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trimmedUrl }),
          })
          const data = await parseApiResponse(response)
          reference = `${data.author}. (${data.year}). ${data.title}. [online] Available at: ${trimmedUrl} [Accessed: ${new Date().toLocaleDateString()}.]`
          break
        }
        case 'book':
          reference = `${formData.author || 'Author'} (${formData.year || 'Year'}) ${formData.title || 'Title'}. ${formData.edition ? `${formData.edition}. ` : ''}${formData.place || 'Place'}: ${formData.publisher || 'Publisher'}.`
          break
        case 'video': {
          const response = await fetch('/api/v1/reference/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trimmedUrl }),
          })
          const data = await parseApiResponse(response)
          reference = `${data.author}. (${data.year}). ${data.title}. [online] Available at: ${trimmedUrl} [Accessed: ${new Date().toLocaleDateString()}.]`
          break
        }
      }

      setGeneratedReference(reference)
      pushReference(reference)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate reference'
      if (selectedType === 'website' || selectedType === 'video') {
        setFieldErrors({ url: message })
      } else {
        setFormError(message)
      }
    } finally {
      setRefLoading(false)
    }
  }

  const copyToClipboard = async (text: string, name: 'reference' | 'referenceList') => {
    await navigator.clipboard.writeText(text)

    if (name === 'reference') {
      setCopyButtonText(true)
      window.setTimeout(() => setCopyButtonText(false), 3000)
      return
    }

    setCopyListButtonText(true)
    window.setTimeout(() => setCopyListButtonText(false), 3000)
  }

  const handleAgain = () => {
    setGeneratedReference('')
    setFormData({})
    setFieldErrors({})
    setFormError('')
  }

  const handleClear = () => {
    setGenerateReferenceList([])
  }

  const handleAscendingOrder = () => {
    setGenerateReferenceList((current) => [...current].sort((a, b) => a.localeCompare(b)))
    setAscendingOrder(true)
    window.setTimeout(() => setAscendingOrder(false), 3000)
  }

  return (
    <section className={sectionClassName}>
      <div className={containerClassName}>
        <div>
          <h2 className={`${embedded ? 'text-xl' : 'text-4xl text-center'} font-bold`}>{title}</h2>
          <p className={`${embedded ? 'mt-2 text-sm leading-6 text-slate-500' : 'text-gray-600 text-center mt-4 mb-8'}`}>
            {description}
            {!embedded ? (
              <>
                <br />
                Authors are not able to be extracted from ScienceDirect.com currently.
              </>
            ) : null}
          </p>
        </div>

        <div className={`flex gap-2 flex-wrap ${embedded ? '' : 'justify-center mb-6'}`}>
          {sourceTypes.map((type) => (
            <Button
              variant="outline"
              size={embedded ? 'sm' : 'lg'}
              key={type}
              onClick={() => {
                setSelectedType(type)
                setFormData({})
                setGeneratedReference('')
                setFieldErrors({})
                setFormError('')
              }}
              className={`capitalize border-2 ${selectedType === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 hover:border-emerald-500'}`}
            >
              {type}
            </Button>
          ))}
        </div>

        {!generatedReference ? (
          <div className={`relative rounded-[1.4rem] border border-gray-200 bg-white ${embedded ? 'p-0 shadow-none border-none' : 'mb-6 p-8 shadow-sm'} ${refLoading ? 'pointer-events-none' : ''}`}>
            {refLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.4rem] bg-white/75 backdrop-blur-sm">
                <div className="text-sm font-semibold text-emerald-700">Generating reference...</div>
              </div>
            ) : null}

            {selectedType === 'website' || selectedType === 'video' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  name="url"
                  placeholder={
                    selectedType === 'website'
                      ? 'Paste a Website URL'
                      : 'Paste a YouTube URL'
                  }
                  value={formData.url || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
                {fieldErrors.url ? <p className="text-sm text-red-500">{fieldErrors.url}</p> : null}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  name="author"
                  placeholder="Author"
                  value={formData.author || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
                <input
                  type="text"
                  name="year"
                  placeholder="Year"
                  value={formData.year || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
                <input
                  type="text"
                  name="title"
                  placeholder="Book title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 sm:col-span-2"
                />
                <input
                  type="text"
                  name="edition"
                  placeholder="Edition"
                  value={formData.edition || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
                <input
                  type="text"
                  name="place"
                  placeholder="Place"
                  value={formData.place || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
                <input
                  type="text"
                  name="publisher"
                  placeholder="Publisher"
                  value={formData.publisher || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 sm:col-span-2"
                />
              </div>
            )}

            {formError ? <p className="mt-4 text-sm text-red-500">{formError}</p> : null}

            <div className={`${embedded ? 'mt-4' : 'mt-6'} flex gap-3`}>
              <Button
                onClick={generateReference}
                disabled={refLoading}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Generate Reference
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={handleAgain}>
                Again
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => void copyToClipboard(generatedReference, 'reference')}
              >
                {copyButtonText ? <MdDone className="h-5 w-5" /> : <FaRegCopy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {generatedReference}
            </p>
          </div>
        )}

        {generateReferenceList.length > 0 ? (
          <div className="rounded-[1.4rem] border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Saved references</h3>
                <p className="mt-1 text-sm text-slate-500">
                  These references stay attached to the assignment until you remove them.
                </p>
              </div>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => void copyToClipboard(generateReferenceList.join('\n'), 'referenceList')}
              >
                {copyListButtonText ? <MdDone className="h-5 w-5" /> : <FaRegCopy className="h-4 w-4" />}
              </Button>
            </div>

            <ul className="space-y-2 rounded-2xl bg-slate-50 p-3">
              {generateReferenceList.map((reference, index) => (
                <li key={`${reference}-${index}`} className="text-sm leading-6 text-slate-700">
                  {index + 1}. {reference}
                </li>
              ))}
            </ul>

            {!embedded ? (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
                <Button variant="outline" onClick={handleAscendingOrder}>
                  {ascendingOrder ? <MdDone className="h-5 w-5" /> : <FaSortAlphaDown className="h-4 w-4" />}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
