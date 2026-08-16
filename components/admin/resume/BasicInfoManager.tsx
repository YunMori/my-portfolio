'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateBasicInfo, upsertPersonalDetails } from '@/app/actions/resume'
import { Profile, PersonalDetails } from '@/types/database.types'

interface BasicInfoManagerProps {
    initialProfile: Profile | null
    initialPersonalDetails: PersonalDetails | null
}

// 기본 정보(profile) + 인적 사항(personal_details) 싱글턴 편집 폼
export default function BasicInfoManager({ initialProfile, initialPersonalDetails }: BasicInfoManagerProps) {
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingDetails, setSavingDetails] = useState(false)

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const result = await updateBasicInfo(new FormData(e.currentTarget))
            if (result.success) toast.success('기본 정보가 저장되었습니다')
            else toast.error(result.error || '저장에 실패했습니다')
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        } finally {
            setSavingProfile(false)
        }
    }

    const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSavingDetails(true)
        try {
            const result = await upsertPersonalDetails(new FormData(e.currentTarget))
            if (result.success) toast.success('인적 사항이 저장되었습니다')
            else toast.error(result.error || '저장에 실패했습니다')
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        } finally {
            setSavingDetails(false)
        }
    }

    const inputClass = 'w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none'
    const labelClass = 'block text-xs uppercase tracking-wider text-stone-500 mb-1'

    return (
        <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* 기본 정보 (공개 가능) */}
            <section className="bg-surface p-8 rounded-2xl border border-stone-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-id-card text-stone-500"></i> 기본 정보
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className={labelClass}>이름</label>
                            <input name="name" type="text" required defaultValue={initialProfile?.name ?? ''} className={inputClass} />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>직무 (Role)</label>
                            <input name="role" type="text" defaultValue={initialProfile?.role ?? ''} placeholder="Backend Developer" className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>한 줄 소개</label>
                        <input name="one_liner" type="text" defaultValue={initialProfile?.one_liner ?? ''} placeholder="문제를 구조로 푸는 백엔드 개발자" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>소개 (Bio)</label>
                        <textarea name="bio" rows={3} defaultValue={initialProfile?.bio ?? ''} className={inputClass} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className={labelClass}>이메일</label>
                            <input name="email" type="email" defaultValue={initialProfile?.email ?? ''} className={inputClass} />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>블로그 URL</label>
                            <input name="blog_url" type="text" defaultValue={initialProfile?.blog_url ?? ''} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>사진 URL (avatar)</label>
                        <input name="avatar_url" type="text" defaultValue={initialProfile?.avatar_url ?? ''} className={inputClass} />
                    </div>

                    <button
                        type="submit" disabled={savingProfile}
                        className="w-full font-bold py-3 rounded transition-colors mt-2 bg-stone-700 hover:bg-stone-600 text-white disabled:opacity-50"
                    >
                        {savingProfile ? <i className="fa-solid fa-spinner fa-spin"></i> : '기본 정보 저장'}
                    </button>
                </form>
            </section>

            {/* 인적 사항 (비공개) */}
            <section className="bg-surface p-8 rounded-2xl border border-stone-800">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-user-shield text-stone-500"></i> 인적 사항
                </h2>
                <p className="mb-6 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded p-3">
                    <i className="fa-solid fa-lock mr-1"></i> 비공개 데이터 — 웹에 노출되지 않으며, 이력서 빌더에서도 기본적으로 제외(토글 OFF)됩니다.
                </p>

                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className={labelClass}>생년월일</label>
                            <input name="birth_date" type="date" defaultValue={initialPersonalDetails?.birth_date ?? ''} className={inputClass} />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>전화번호</label>
                            <input name="phone" type="tel" defaultValue={initialPersonalDetails?.phone ?? ''} placeholder="010-0000-0000" className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>주소</label>
                        <input name="address" type="text" defaultValue={initialPersonalDetails?.address ?? ''} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>병역</label>
                        <input name="military_service" type="text" defaultValue={initialPersonalDetails?.military_service ?? ''} placeholder="육군 병장 만기전역 (2020.01 ~ 2021.07)" className={inputClass} />
                    </div>

                    {/* 이 토글이 빌더의 민감 필드 초기 상태를 정한다 (defaultSelections의 sensitiveOn).
                        체크박스가 폼에 없으면 저장할 때마다 false로 되돌아가므로 반드시 함께 보낸다. */}
                    <label className="flex items-center gap-2 text-sm text-stone-400 cursor-pointer pt-2">
                        <input
                            name="include_in_resume_default"
                            type="checkbox"
                            defaultChecked={initialPersonalDetails?.include_in_resume_default ?? false}
                            className="accent-green-500"
                        />
                        이력서 빌더에서 민감 필드를 기본 포함
                    </label>

                    <button
                        type="submit" disabled={savingDetails}
                        className="w-full font-bold py-3 rounded transition-colors mt-2 bg-stone-700 hover:bg-stone-600 text-white disabled:opacity-50"
                    >
                        {savingDetails ? <i className="fa-solid fa-spinner fa-spin"></i> : '인적 사항 저장'}
                    </button>
                </form>
            </section>
        </div>
    )
}
