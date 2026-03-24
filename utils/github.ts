export function parseGithubPath(url: string): { owner: string; repo: string } | null {
    let path = url.trim()
    path = path.replace(/\/+$/, '')
    path = path.replace(/^https?:\/\//, '')
    path = path.replace(/^(www\.)?github\.com\//, '')
    path = path.replace(/\.git$/, '')

    const parts = path.split('/').filter(Boolean)
    if (parts.length < 2) return null

    return { owner: parts[0], repo: parts[1] }
}
