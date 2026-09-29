import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isAuthenticated } from '@/utils/auth'
import {
    addResumeItem, updateResumeItem, upsertPersonalDetails,
    updateBasicInfo, getResumeItemsAdmin, deleteResumeItem,
} from '@/app/actions/resume'
import { addProject, updateProject } from '@/app/actions/projects'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/utils/supabase/public', () => ({ createPublicClient: jest.fn() }))
jest.mock('@/utils/auth', () => ({ isAuthenticated: jest.fn() }))

const query = {
    select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn(),
    eq: jest.fn(), order: jest.fn(), limit: jest.fn(), maybeSingle: jest.fn(),
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
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.insert.mockResolvedValue({ error: null })
    query.update.mockReturnValue(query)
    query.delete.mockReturnValue(query)
    query.eq.mockResolvedValue({ error: null })
    query.limit.mockReturnValue(query)
    query.maybeSingle.mockResolvedValue({ data: { id: 'existing', display_order: 7 }, error: null })
})

describe('archive writes after builder removal', () => {
    it('appends new private items after the maximum order, ignoring stale metadata inputs', async () => {
        expect(await addResumeItem('educations', form({
            school: '학교', tags: '학력', is_public: 'on', display_order: '0',
        }))).toEqual({ success: true })
        const record = query.insert.mock.calls[0][0]
        expect(record).toMatchObject({ school: '학교', is_public: false, display_order: 8 })
        expect(record).not.toHaveProperty('tags')
        expect(record).not.toHaveProperty('include_in_resume_default')
        expect(query.order).toHaveBeenCalledWith('display_order', { ascending: false })
        expect(revalidatePath).toHaveBeenCalledWith('/admin/archive/educations')
        expect(revalidatePath).not.toHaveBeenCalledWith('/admin/resume')
    })

    it('starts an empty archive at order zero', async () => {
        query.maybeSingle.mockResolvedValue({ data: null, error: null })
        await addResumeItem('educations', form({ school: '학교' }))
        expect(query.insert.mock.calls[0][0]).toMatchObject({ display_order: 0, is_public: false })
    })

    it('does not insert when the last order cannot be read', async () => {
        query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'read failed' } })
        expect(await addResumeItem('educations', form({ school: '학교' })))
            .toEqual({ success: false, error: 'read failed' })
        expect(query.insert).not.toHaveBeenCalled()
    })

    it('updates content without overwriting stored metadata, even from a stale form', async () => {
        expect(await updateResumeItem('educations', form({
            id: 'edu-1', school: '수정한 학교', tags: '', is_public: 'false', display_order: '0',
        }))).toEqual({ success: true })
        const record = query.update.mock.calls[0][0]
        const existing = { tags: ['원래 태그'], is_public: true, display_order: 7 }
        expect({ ...existing, ...record }).toMatchObject({ ...existing, school: '수정한 학교' })
        for (const field of ['tags', 'is_public', 'display_order', 'include_in_resume_default']) {
            expect(record).not.toHaveProperty(field)
        }
        expect(query.eq).toHaveBeenCalledWith('id', 'edu-1')
    })

    it('retains archive read ordering', async () => {
        query.order.mockReturnValueOnce(query).mockResolvedValueOnce({ data: [{ id: 'edu-1' }], error: null })
        expect(await getResumeItemsAdmin('educations')).toEqual([{ id: 'edu-1' }])
        expect(query.order).toHaveBeenNthCalledWith(1, 'display_order', { ascending: true })
        expect(query.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false })
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

    it('keeps deletion', async () => {
        expect(await deleteResumeItem('educations', 'edu-1')).toEqual({ success: true })
        expect(query.delete).toHaveBeenCalled()
        expect(query.eq).toHaveBeenCalledWith('id', 'edu-1')
    })

    it('keeps basic profile editing', async () => {
        expect(await updateBasicInfo(form({ name: '이름', bio: '소개', email: 'test@example.com' })))
            .toEqual({ success: true })
        expect(query.update.mock.calls[0][0]).toMatchObject({ name: '이름', bio: '소개', email: 'test@example.com' })
        expect(revalidatePath).toHaveBeenCalledWith('/admin/archive/basic')
        expect(revalidatePath).not.toHaveBeenCalledWith('/admin/resume')
    })

    it('rejects unknown categories before accessing the database', async () => {
        expect(await addResumeItem('daily_stats', form({ school: '학교' })))
            .toEqual({ success: false, error: 'Unknown category' })
        expect(from).not.toHaveBeenCalled()
    })

    it('still requires authentication for writes', async () => {
        jest.mocked(isAuthenticated).mockResolvedValue(false)
        expect(await addResumeItem('educations', form({ school: '학교' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(await upsertPersonalDetails(form({ phone: 'private' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(await updateResumeItem('educations', form({ id: 'edu-1', school: '학교' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(await deleteResumeItem('educations', 'edu-1')).toEqual({ success: false, error: 'Unauthorized' })
        expect(await updateBasicInfo(form({ name: '이름' }))).toEqual({ success: false, error: 'Unauthorized' })
        expect(from).not.toHaveBeenCalled()
    })
})
