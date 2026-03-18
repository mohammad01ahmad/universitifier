type RateLimitEntry = {
    count: number
    resetAt: number
}

type RateLimitOptions = {
    key: string
    limit: number
    windowMs: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const getClientIp = (request: Request) => {
    const forwardedFor = request.headers.get('x-forwarded-for')

    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim() || 'unknown'
    }

    return request.headers.get('x-real-ip') || 'unknown'
}

export const checkRateLimit = (request: Request, options: RateLimitOptions) => {
    const now = Date.now()
    const clientIp = getClientIp(request)
    const rateLimitKey = `${options.key}:${clientIp}`
    const existingEntry = rateLimitStore.get(rateLimitKey)

    if (!existingEntry || existingEntry.resetAt <= now) {
        rateLimitStore.set(rateLimitKey, {
            count: 1,
            resetAt: now + options.windowMs,
        })

        return {
            allowed: true,
            remaining: options.limit - 1,
            retryAfterSeconds: Math.ceil(options.windowMs / 1000),
        }
    }

    if (existingEntry.count >= options.limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
        }
    }

    existingEntry.count += 1
    rateLimitStore.set(rateLimitKey, existingEntry)

    return {
        allowed: true,
        remaining: options.limit - existingEntry.count,
        retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
    }
}
