import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isAuthenticated } from '@/utils/auth'
import {
    addResumeItem, updateResumeItem, upsertPersonalDetails,
    toggleResumeItemFlag, reorderResumeItems, deleteResumeItem,
} from '@/app/actions/resume'
import { addProject, updateProject } from '@/app/actions/projects'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/utils/supabase/public', () => ({ createPublicClient: jest.fn() }))
jest.mock('@/utils/auth', () => ({ isAuthenticated: jest.fn() }))

const query = {
    select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn(),
    eq: jest.fn(), limit: jest.fn(), maybeSingle: jest.fn(),
}
const from = jest.fn(() => query)

function form(values: Record<string, string>) {
    const data = new FormData()
    Object.entries(values).forEach(([key, value]) => data.set(key, value))
    // A stale browser may still submit this field after deployment.
    data.set('include_in_resume_default', 'on')
    return data
}

beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(isAuthenticated).mockResolvedValue(true)
    jest.mocked(createClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createClient>>)
    query.select.mockReturnValue({ ...query, count: 2 })
    query.insert.mockResolvedValue({ error: null })
    query.update.mockReturnValue(query)
    query.delete.mockReturnValue(query)
    query.eq.mockResolvedValue({ error: null })
    query.limit.mockReturnValue(query)
    query.maybeSingle.mockResolvedValue({ data: { id: 'existing' } })
})

describe('archive writes after builder removal', () => {
    it.each([addResumeItem, updateResumeItem])('preserves archive fields without the removed column (%#)', async action => {
        expect(await action('educations', form({ id: 'edu-1', school: '학교', tags: '학력, 대학', is_public: 'on' })))
            .toEqual({ success: true })
        const record = (action === addResumeItem ? query.insert : query.update).mock.calls[0][0]
        expect(record).toMatchObject({ school: '학교', tags: ['학력', '대학'], is_public: true })
        expect(record).not.toHaveProperty('include_in_resume_default')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/archive/educations')
        expect(revalidatePath).not.toHaveBeenCalledWith('/admin/resume')
    })

    it.each([false, true])('preserves private details when an existing row is %s', async existing => {
        query.maybeSingle.mockResolvedValue({ data: existing ? { id: 'existing' } : null })
        await upsertPersonalDetails(form({ phone: '010-1234-5678', address: '서울', birth_date: '2000-01-01', military_service: '해당 없음' }))
        expect((existing ? query.update : query.insert).mock.calls[0][0]).toEqual({
            phone: '010-1234-5678', address: '서울', birth_date: '2000-01-01', military_service: '해당 없음',
        })
    })

    it.each([addProject, updateProject])('preserves project role and dates (%#)', async action => {
        expect(await action(form({ id: 'project-1', title: 'Project', stack: 'React, TypeScript', role: '개발자', period_start: '2025.01', period_end: '2025.06' })))
            .toEqual({ success: true })
        const record = (action === addProject ? query.insert : query.update).mock.calls[0][0]
        expect(record).toMatchObject({ role: '개발자', period_start: '2025.01', period_end: '2025.06' })
        expect(record).not.toHaveProperty('include_in_resume_default')
    })

    it('rejects the removed toggle even when sent by a stale or untyped client', async () => {
        const result = await toggleResumeItemFlag('educations', 'edu-1', 'include_in_resume_default' as 'is_public', true)
        expect(result.success).toBe(false)
        expect(from).not.toHaveBeenCalled()
    })

    it('keeps visibility changes and public contribution cache invalidation', async () => {
        expect(await toggleResumeItemFlag('project_contributions', 'contrib-1', 'is_public', false)).toEqual({ success: true })
        expect(query.update).toHaveBeenCalledWith({ is_public: false })
        expect(revalidatePath).toHaveBeenCalledWith('/projects/[slug]', 'page')
    })

    it('keeps sorting and deletion', async () => {
        expect(await reorderResumeItems('educations', ['edu-2', 'edu-1'])).toEqual({ success: true })
        expect(query.update).toHaveBeenNthCalledWith(1, { display_order: 0 })
        expect(query.update).toHaveBeenNthCalledWith(2, { display_order: 1 })
        expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'edu-2')
        expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'edu-1')
        expect(await deleteResumeItem('educations', 'edu-1')).toEqual({ success: true })
        expect(query.delete).toHaveBeenCalled()
    })

    it('still requires authentication for writes', async () => {
        jest.mocked(isAuthenticated).mockResolvedValue(false)
        expect(await addResumeItem('educations', form({ school: '학교' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(await upsertPersonalDetails(form({ phone: 'private' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(await toggleResumeItemFlag('educations', 'edu-1', 'is_public', true)).toEqual({ success: false, error: 'Unauthorized' })
        expect(from).not.toHaveBeenCalled()
    })
})
