'use client'
import React, { useState } from 'react'
import { FaRegCopy } from "react-icons/fa6";
import { MdDone } from "react-icons/md";
import { FaSortAlphaDown } from "react-icons/fa";
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ReferenceType = 'website' | 'book' | 'PDF' | 'video'

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

export const ReferenceGenerator = () => {
    const [refLoading, setRefLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<ReferenceType>('website')
    const [formData, setFormData] = useState<ReferenceFormData>({})
    const [generatedReference, setGeneratedReference] = useState('')
    const [copyButtonText, setCopyButtonText] = useState(false)
    const [copyListButtonText, setCopyListButtonText] = useState(false)
    const [ascendingOrder, setAscendingOrder] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{ url?: string }>({})
    const [formError, setFormError] = useState('')

    const [generateReferenceList, setGenerateReferenceList] = useState<string[]>([])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setFieldErrors((prev) => ({
            ...prev,
            [e.target.name]: undefined,
        }))
        setFormError('')
    }

    const parseApiResponse = async (response: Response) => {
        const data = await response.json() as ApiSuccessResponse & ApiErrorResponse

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate reference')
        }

        return data
    }

    const generateReference = async () => {
        let reference = ''
        const trimmedUrl = formData.url?.trim() || ''
        setRefLoading(true)
        setFieldErrors({})
        setFormError('')

        if ((selectedType === 'website' || selectedType === 'PDF' || selectedType === 'video') && !trimmedUrl) {
            setFieldErrors({ url: 'URL is required' })
            setRefLoading(false)
            return
        }

        try {
            switch (selectedType) {
                case 'website':
                    const response = await fetch('/api/reference/website', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: trimmedUrl })
                    })
                    const data = await parseApiResponse(response)

                    const title = data.title
                    const author = data.author
                    const year = data.year

                    reference = `${author}. (${year}). ${title}. [online] Available at: ${trimmedUrl} [Accessed: ${new Date().toLocaleDateString()}.]`
                    break

                case 'book':
                    reference = `${formData.author || 'Author'} (${formData.year || 'Year'}) ${formData.title || 'Title'}. ${formData.edition ? formData.edition + '. ' : ''}${formData.place || 'Place'}: ${formData.publisher || 'Publisher'}.`
                    break

                case 'PDF':
                    const pdfResponse = await fetch('/api/reference/pdf', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: trimmedUrl })
                    })
                    const pdfData = await parseApiResponse(pdfResponse)

                    reference = `${pdfData.author}. (${pdfData.year}). ${pdfData.title} [PDF]. Available at: ${trimmedUrl} [Accessed: ${pdfData.accessDate}]`
                    break

                case 'video':
                    const responseVideo = await fetch('/api/reference/video', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: trimmedUrl })
                    })
                    const dataVideo = await parseApiResponse(responseVideo)

                    const titleVideo = dataVideo.title
                    const authorVideo = dataVideo.author
                    const yearVideo = dataVideo.year

                    reference = `${authorVideo}. (${yearVideo}). ${titleVideo}. [online] Available at: ${trimmedUrl} [Accessed: ${new Date().toLocaleDateString()}.]`
                    break
            }
            setGeneratedReference(reference)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate reference'

            if (selectedType === 'website' || selectedType === 'PDF' || selectedType === 'video') {
                setFieldErrors({ url: message })
            } else {
                setFormError(message)
            }
        } finally {
            if (reference) {
                setGenerateReferenceList((prev) => [...prev, reference])
            }
            setRefLoading(false)
        }
    }

    const copyToClipboard = (text: string, name: string) => {
        navigator.clipboard.writeText(text)

        if (name === 'reference') {
            setCopyButtonText(true)
            setTimeout(() => {
                setCopyButtonText(false)
            }, 3000)
        }
        if (name === 'referenceList') {
            setCopyListButtonText(true)
            setTimeout(() => {
                setCopyListButtonText(false)
            }, 3000)
        }
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
        setGenerateReferenceList([...generateReferenceList].sort((a, b) => a.localeCompare(b)))

        // Put ascending order for 3000ms
        setTimeout(() => {
            setAscendingOrder(true)
        }, 3000)
        setAscendingOrder(false)
    }

    return (
        <section className="py-20 px-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl font-bold mb-4 text-center">Harvard Reference Generator</h2>
                <p className="text-gray-600 text-center mb-8">Generate accurate Harvard-style references instantly. <br />Authors are not able to be extracted from ScienceDirect.com currently.</p>

                {/* Source Type Selector */}
                <div className="flex gap-2 mb-6 flex-wrap justify-center">
                    {['website', 'book', 'PDF', 'video'].map((type) => (
                        <Button
                            variant="outline"
                            size="lg"
                            key={type}
                            onClick={() => {
                                setSelectedType(type as ReferenceType)
                                setFormData({})
                                setGeneratedReference('')
                                setFieldErrors({})
                                setFormError('')
                            }}
                            className={`px-6 py-5 capitalize transition-colors cursor-pointer border-2 ${selectedType === type
                                ? 'bg-violet-500 text-neutral-50 border-violet-500'
                                : 'border-gray-300 hover:border-violet-500'
                                }`}
                        >
                            {type}
                        </Button>

                    ))}
                </div>

                {/* Form or Generated Reference */}
                {/* Form - Always show when no current reference is being displayed */}
                {!generatedReference && (
                    <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-6 relative ${refLoading ? 'pointer-events-none' : ''}`}>
                        {refLoading && (
                            <div className="backdrop-blur-md absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg z-10">
                                <div className="text-xl font-semibold text-purple-600">Loading...</div>
                            </div>
                        )}

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
                                {fieldErrors.url && (
                                    <p className="text-sm text-red-500">{fieldErrors.url}</p>
                                )}
                            </div>
                        )}

                        {selectedType === 'book' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    name="url"
                                    placeholder="Paste a Book URL (e.g. https://example.com/book.pdf)"
                                    value={formData.url || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                                />
                            </div>
                        )}

                        {selectedType === 'PDF' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    name="url"
                                    placeholder="Paste a PDF URL (e.g. https://example.com/paper.pdf)"
                                    value={formData.url || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                                />
                                {fieldErrors.url && (
                                    <p className="text-sm text-red-500">{fieldErrors.url}</p>
                                )}
                            </div>
                        )}

                        {selectedType === 'video' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    name="url"
                                    placeholder="Paste a Video URL (e.g. https://youtube.com/watch?v=...)"
                                    value={formData.url || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                                />
                                {fieldErrors.url && (
                                    <p className="text-sm text-red-500">{fieldErrors.url}</p>
                                )}
                            </div>
                        )}

                        {formError && (
                            <p className="mt-4 text-sm text-red-500">{formError}</p>
                        )}

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={generateReference}
                                disabled={refLoading}
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 cursor-pointer"
                            >
                                Generate Reference
                            </button>
                        </div>
                    </div>
                )}

                {/* Current Generated Reference */}
                {generatedReference && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={handleAgain}
                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Again
                            </button>
                            <button
                                onClick={() => copyToClipboard(generatedReference, 'reference')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold cursor-pointer"
                            >
                                {copyButtonText ? <MdDone className="w-5 h-6 transition-all duration-300" /> : <FaRegCopy className="w-5 h-6" />}
                            </button>
                        </div>
                        <p className="text-gray-800 leading-relaxed border-l-4 border-purple-600 pl-4 py-2 bg-purple-50 rounded-sm">
                            {generatedReference}
                        </p>
                    </div>
                )}

                {/* References List - Always visible when there are references */}
                {generateReferenceList.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className='flex flex-col'>
                                <h2 className="text-lg font-semibold mb-2">All References</h2>
                                <p className="text-gray-600 text-sm">Don&apos;t worry. All your references will stay here until you clear them.</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(generateReferenceList.join('\n'), 'referenceList')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold cursor-pointer"
                            >
                                {copyListButtonText ? <MdDone className="w-5 h-6 transition-all duration-300" /> : <FaRegCopy className="w-5 h-6" />}
                            </button>
                        </div>
                        <ul className="pl-4 pt-2 pb-2 bg-purple-50 rounded-sm">
                            {generateReferenceList.map((references: string, index: number) => (
                                <li key={index} className="flex items-center justify-between pt-4 pb-2">
                                    <span className="text-gray-800">{index + 1}. {references}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={handleClear}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold cursor-pointer"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleAscendingOrder}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold cursor-pointer"
                            >
                                {ascendingOrder ? <FaSortAlphaDown className="w-5 h-6 transition-all duration-300" /> : <MdDone className="w-5 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
