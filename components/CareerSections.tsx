'use client';

import { useLanguage } from '@/context/LanguageContext';
import { PublicResumeData } from '@/app/actions/resume';

interface CareerSectionsProps {
    data: PublicResumeData;
}

// 기간 표시: '2024.01 ~ 2025.06' / 종료 없으면 '~ 현재'
function period(start?: string | null, end?: string | null, present?: string) {
    if (!start && !end) return '';
    return `${start ?? ''} ~ ${end || present || ''}`;
}

// 공개(is_public=true) 항목만 서버에서 전달받아 렌더링하는 이력 섹션
export default function CareerSections({ data }: CareerSectionsProps) {
    const { t } = useLanguage();
    const { educations, experiences, certifications, awards, languageActivities, educationCourses } = data;

    const isEmpty =
        educations.length === 0 && experiences.length === 0 && certifications.length === 0 &&
        awards.length === 0 && languageActivities.length === 0 && educationCourses.length === 0;

    // 공개 항목이 하나도 없으면 섹션 자체를 렌더하지 않음
    if (isEmpty) return null;

    const present = t('career.present');

    return (
        <section id="career" className="py-20 relative">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 mb-12 border-b border-stone-900 pb-6 fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                    <div className="text-center md:text-left">
                        <span className="text-green-500 text-xs font-bold uppercase tracking-widest mb-2 block">{t('career.header')}</span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-stone-100">{t('career.title')}</h2>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-10">
                    {/* 좌측: 경력 / 학력 / 교육 이수 (타임라인) */}
                    <div className="lg:col-span-3 space-y-12">
                        {experiences.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-briefcase text-green-500 mr-2"></i>{t('career.experience')}
                                </h3>
                                <div className="space-y-6 border-l border-stone-800 pl-6">
                                    {experiences.map(exp => (
                                        <div key={exp.id} className="relative">
                                            <span className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-green-500"></span>
                                            <div className="flex flex-wrap items-baseline gap-x-3">
                                                <h4 className="font-bold text-stone-200">{exp.company}</h4>
                                                {exp.position && <span className="text-sm text-stone-400">{exp.position}</span>}
                                            </div>
                                            <p className="text-xs text-stone-600 mb-2">{period(exp.start_date, exp.end_date, present)}</p>
                                            {exp.summary && <p className="text-sm text-stone-400 mb-2">{exp.summary}</p>}
                                            {exp.achievements && exp.achievements.length > 0 && (
                                                <ul className="text-sm text-stone-500 space-y-1 list-disc list-inside">
                                                    {exp.achievements.map((a, i) => <li key={i}>{a}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {educations.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-graduation-cap text-green-500 mr-2"></i>{t('career.education')}
                                </h3>
                                <div className="space-y-6 border-l border-stone-800 pl-6">
                                    {educations.map(edu => (
                                        <div key={edu.id} className="relative">
                                            <span className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-stone-600"></span>
                                            <div className="flex flex-wrap items-baseline gap-x-3">
                                                <h4 className="font-bold text-stone-200">{edu.school}</h4>
                                                {edu.major && <span className="text-sm text-stone-400">{edu.major}</span>}
                                                {edu.status && <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">{edu.status}</span>}
                                            </div>
                                            <p className="text-xs text-stone-600">{period(edu.start_date, edu.end_date, present)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {educationCourses.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-chalkboard-user text-green-500 mr-2"></i>{t('career.courses')}
                                </h3>
                                <div className="space-y-6 border-l border-stone-800 pl-6">
                                    {educationCourses.map(course => (
                                        <div key={course.id} className="relative">
                                            <span className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-stone-600"></span>
                                            <div className="flex flex-wrap items-baseline gap-x-3">
                                                <h4 className="font-bold text-stone-200">{course.course_name}</h4>
                                                {course.institution && <span className="text-sm text-stone-400">{course.institution}</span>}
                                            </div>
                                            <p className="text-xs text-stone-600 mb-1">{period(course.start_date, course.end_date, present)}</p>
                                            {course.summary && <p className="text-sm text-stone-500">{course.summary}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 우측: 자격증 / 수상 / 어학·활동 (컴팩트 카드) */}
                    <div className="lg:col-span-2 space-y-12">
                        {certifications.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-certificate text-green-500 mr-2"></i>{t('career.certifications')}
                                </h3>
                                <div className="space-y-3">
                                    {certifications.map(cert => (
                                        <div key={cert.id} className="p-4 rounded-xl bg-surface border border-stone-800 hover:border-stone-600 transition-colors">
                                            <h4 className="font-bold text-sm text-stone-200">{cert.name}</h4>
                                            <p className="text-xs text-stone-500">
                                                {[cert.issuer, cert.acquired_date].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {awards.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-trophy text-green-500 mr-2"></i>{t('career.awards')}
                                </h3>
                                <div className="space-y-3">
                                    {awards.map(award => (
                                        <div key={award.id} className="p-4 rounded-xl bg-surface border border-stone-800 hover:border-stone-600 transition-colors">
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <h4 className="font-bold text-sm text-stone-200">{award.name}</h4>
                                                {award.rank && <span className="text-xs text-green-500 font-bold">{award.rank}</span>}
                                            </div>
                                            <p className="text-xs text-stone-500">{award.awarded_date}</p>
                                            {award.description && <p className="text-xs text-stone-500 mt-1">{award.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {languageActivities.length > 0 && (
                            <div className="fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6">
                                    <i className="fa-solid fa-earth-asia text-green-500 mr-2"></i>{t('career.activities')}
                                </h3>
                                <div className="space-y-3">
                                    {languageActivities.map(activity => (
                                        <div key={activity.id} className="p-4 rounded-xl bg-surface border border-stone-800 hover:border-stone-600 transition-colors">
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <h4 className="font-bold text-sm text-stone-200">{activity.name}</h4>
                                                {activity.score_or_desc && <span className="text-xs text-stone-400">{activity.score_or_desc}</span>}
                                            </div>
                                            <p className="text-xs text-stone-500">{activity.activity_date}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
