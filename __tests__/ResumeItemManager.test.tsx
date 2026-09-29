import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResumeItemManager from '@/components/admin/resume/ResumeItemManager'
import LegacyResumePage from '@/app/admin/resume/page'
import { CATEGORY_MAP } from '@/utils/resume/config'
import { updateResumeItem, deleteResumeItem } from '@/app/actions/resume'
import { redirect } from 'next/navigation'

jest.mock('@/app/actions/resume', () => ({
    addResumeItem: jest.fn(),
    updateResumeItem: jest.fn(),
    deleteResumeItem: jest.fn(),
}))
jest.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: jest.fn() }),
    redirect: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const item = {
    id: 'edu-1', school: '기존 학교', major: '전공',
    is_public: true, tags: ['기존 태그'], display_order: 7,
}

beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(updateResumeItem).mockResolvedValue({ success: true })
    jest.mocked(deleteResumeItem).mockResolvedValue({ success: true })
})

it('keeps editing while removing metadata controls and drag handles', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResumeItemManager category={CATEGORY_MAP.educations} initialItems={[item]} />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '드래그하여 순서 변경' })).not.toBeInTheDocument()
    expect(container.querySelector('input[name="tags"]')).toBeNull()

    await user.click(screen.getByRole('button', { name: '수정' }))
    const school = screen.getByDisplayValue('기존 학교')
    await user.clear(school)
    await user.type(school, '수정한 학교')
    await user.click(screen.getByRole('button', { name: '수정 저장' }))
    await waitFor(() => expect(updateResumeItem).toHaveBeenCalledTimes(1))
    const [category, form] = jest.mocked(updateResumeItem).mock.calls[0]
    expect(category).toBe('educations')
    expect(form.get('id')).toBe('edu-1')
    expect(form.get('school')).toBe('수정한 학교')
    for (const field of ['tags', 'is_public', 'display_order', 'include_in_resume_default']) {
        expect(form.has(field)).toBe(false)
    }
})

it('keeps confirmed deletion and updates the visible list', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ResumeItemManager category={CATEGORY_MAP.educations} initialItems={[item]} />)
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(screen.getByText('등록된 항목이 없습니다.')).toBeInTheDocument())
    expect(deleteResumeItem).toHaveBeenCalledWith('educations', 'edu-1')
    confirm.mockRestore()
})

it('redirects the retired builder to the archive', () => {
    LegacyResumePage()
    expect(redirect).toHaveBeenCalledWith('/admin/archive')
})
