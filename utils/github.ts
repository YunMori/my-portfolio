// GitHub username: 영숫자와 하이픈만 허용 / repo: 영숫자, '.', '_', '-' 허용
const OWNER_RE = /^[A-Za-z0-9-]+$/
const REPO_RE = /^[A-Za-z0-9._-]+$/

export function parseGithubPath(url: string): { owner: string; repo: string } | null {
    let path = url.trim()
    path = path.replace(/\/+$/, '')
    path = path.replace(/^https?:\/\//, '')
    path = path.replace(/^(www\.)?github\.com\//, '')
    path = path.replace(/\.git$/, '')

    const parts = path.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const [owner, repo] = parts
    if (!OWNER_RE.test(owner)) return null
    if (!REPO_RE.test(repo) || repo === '.' || repo === '..') return null

    return { owner, repo }
}
