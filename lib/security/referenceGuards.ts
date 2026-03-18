const PRIVATE_HOST_PATTERNS = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\.0\.0\.0$/,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^\[?::1\]?$/i,
    /^\[?fc/i,
    /^\[?fd/i,
    /^\[?fe80:/i,
]

const INTERNAL_HOST_SUFFIXES = ['.local', '.internal', '.localhost']

const isBlockedHostname = (hostname: string) => {
    const normalizedHost = hostname.trim().toLowerCase()

    if (INTERNAL_HOST_SUFFIXES.some((suffix) => normalizedHost.endsWith(suffix))) {
        return true
    }

    return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalizedHost))
}

export const parseSafeWebsiteUrl = (value: string) => {
    try {
        const parsedUrl = new URL(value)

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return { isValid: false, error: 'Please enter a valid website URL' }
        }

        if (parsedUrl.username || parsedUrl.password) {
            return { isValid: false, error: 'URLs with embedded credentials are not allowed' }
        }

        if (isBlockedHostname(parsedUrl.hostname)) {
            return { isValid: false, error: 'Private or local network URLs are not allowed' }
        }

        return { isValid: true, url: parsedUrl }
    } catch {
        return { isValid: false, error: 'Please enter a valid website URL' }
    }
}

export const extractYouTubeVideoId = (value: string) => {
    try {
        const parsedUrl = new URL(value)
        const hostname = parsedUrl.hostname.toLowerCase()

        if (hostname === 'youtu.be') {
            const videoId = parsedUrl.pathname.replace('/', '').trim()
            return videoId.length === 11 ? videoId : null
        }

        if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
            const videoIdFromSearch = parsedUrl.searchParams.get('v')
            if (videoIdFromSearch?.length === 11) {
                return videoIdFromSearch
            }

            const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
            const embeddedVideoId = pathSegments.at(-1)

            if ((parsedUrl.pathname.startsWith('/embed/') || parsedUrl.pathname.startsWith('/shorts/')) && embeddedVideoId?.length === 11) {
                return embeddedVideoId
            }
        }

        return null
    } catch {
        return null
    }
}
