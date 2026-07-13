'use client'

// 이력서 고정 템플릿 (1종) — @react-pdf/renderer
// 미리보기(<PDFViewer>)와 PDF export가 이 컴포넌트 하나를 공유한다.
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { ResumeData } from '@/utils/resume/buildResumeData'

const styles = StyleSheet.create({
    page: {
        fontFamily: 'NanumGothic',
        fontSize: 9,
        color: '#1c1917',
        paddingTop: 40,
        paddingBottom: 48,
        paddingHorizontal: 44,
        lineHeight: 1.5,
    },
    // 헤더
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    name: { fontSize: 22, fontWeight: 700 },
    role: { fontSize: 10, color: '#57534e', marginTop: 2 },
    oneLiner: { fontSize: 9, color: '#44403c', marginTop: 6 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    contactItem: { fontSize: 8, color: '#57534e', marginRight: 12 },
    photo: { width: 68, height: 88, objectFit: 'cover', borderRadius: 2 },
    // 섹션
    section: { marginTop: 14 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        paddingBottom: 3,
        borderBottomWidth: 1.2,
        borderBottomColor: '#292524',
        marginBottom: 8,
    },
    // 공통 행
    row: { flexDirection: 'row', marginBottom: 7 },
    dateCol: { width: 92, fontSize: 8, color: '#78716c', paddingTop: 1 },
    bodyCol: { flex: 1 },
    itemTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
    itemTitle: { fontSize: 10, fontWeight: 700 },
    itemSub: { fontSize: 8.5, color: '#57534e', marginLeft: 6 },
    itemBadge: { fontSize: 8, color: '#78716c', marginLeft: 6 },
    itemDesc: { fontSize: 8.5, color: '#44403c', marginTop: 2 },
    bullet: { flexDirection: 'row', marginTop: 1.5 },
    bulletDot: { width: 10, fontSize: 8.5, color: '#78716c' },
    bulletText: { flex: 1, fontSize: 8.5, color: '#44403c' },
    stack: { fontSize: 8, color: '#78716c', marginTop: 2 },
    link: { fontSize: 8, color: '#1d4ed8', marginTop: 1 },
    // 인적사항 표
    personalRow: { flexDirection: 'row', marginBottom: 3 },
    personalLabel: { width: 60, fontSize: 8.5, color: '#78716c' },
    personalValue: { flex: 1, fontSize: 8.5 },
})

function periodText(start?: string | null, end?: string | null) {
    if (!start && !end) return ''
    return `${start ?? ''} ~ ${end || '현재'}`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    )
}

export default function ResumePdfDocument({ data }: { data: ResumeData }) {
    const { contacts, personal } = data
    const hasPersonal = !!(personal.birthDate || personal.address || personal.militaryService)
    const contactItems = [
        contacts.email && `✉ ${contacts.email}`,
        contacts.phone && `☎ ${contacts.phone}`,
        contacts.github && `GitHub ${contacts.github}`,
        contacts.blog && `Blog ${contacts.blog}`,
    ].filter(Boolean) as string[]

    return (
        <Document title={`${data.name} 이력서`} author={data.name}>
            <Page size="A4" style={styles.page}>
                {/* 헤더: 이름/직무/한줄소개/연락처 + 사진 */}
                <View style={styles.header}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={styles.name}>{data.name}</Text>
                        {data.role ? <Text style={styles.role}>{data.role}</Text> : null}
                        {data.oneLiner ? <Text style={styles.oneLiner}>{data.oneLiner}</Text> : null}
                        {contactItems.length > 0 && (
                            <View style={styles.contactRow}>
                                {contactItems.map((c, i) => (
                                    <Text key={i} style={styles.contactItem}>{c}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    {data.photoUrl ? <Image style={styles.photo} src={data.photoUrl} /> : null}
                </View>

                {/* 인적 사항 (선택된 필드만) */}
                {hasPersonal && (
                    <Section title="인적 사항">
                        {personal.birthDate ? (
                            <View style={styles.personalRow}>
                                <Text style={styles.personalLabel}>생년월일</Text>
                                <Text style={styles.personalValue}>{personal.birthDate}</Text>
                            </View>
                        ) : null}
                        {personal.address ? (
                            <View style={styles.personalRow}>
                                <Text style={styles.personalLabel}>주소</Text>
                                <Text style={styles.personalValue}>{personal.address}</Text>
                            </View>
                        ) : null}
                        {personal.militaryService ? (
                            <View style={styles.personalRow}>
                                <Text style={styles.personalLabel}>병역</Text>
                                <Text style={styles.personalValue}>{personal.militaryService}</Text>
                            </View>
                        ) : null}
                    </Section>
                )}

                {/* 학력 */}
                {data.educations.length > 0 && (
                    <Section title="학력 사항">
                        {data.educations.map(edu => (
                            <View key={edu.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{periodText(edu.start_date, edu.end_date)}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{edu.school}</Text>
                                        {edu.major ? <Text style={styles.itemSub}>{edu.major}</Text> : null}
                                        {edu.degree ? <Text style={styles.itemBadge}>{edu.degree}</Text> : null}
                                        {edu.status ? <Text style={styles.itemBadge}>({edu.status})</Text> : null}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 경력 */}
                {data.experiences.length > 0 && (
                    <Section title="경력 사항">
                        {data.experiences.map(exp => (
                            <View key={exp.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{periodText(exp.start_date, exp.end_date)}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{exp.company}</Text>
                                        {exp.position ? <Text style={styles.itemSub}>{exp.position}</Text> : null}
                                    </View>
                                    {exp.summary ? <Text style={styles.itemDesc}>{exp.summary}</Text> : null}
                                    {exp.achievements?.map((a, i) => (
                                        <View key={i} style={styles.bullet}>
                                            <Text style={styles.bulletDot}>•</Text>
                                            <Text style={styles.bulletText}>{a}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 프로젝트 */}
                {data.projects.length > 0 && (
                    <Section title="프로젝트">
                        {data.projects.map(project => (
                            <View key={project.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>
                                    {periodText(project.period_start, project.period_end) || project.date}
                                </Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{project.title}</Text>
                                        {project.role ? <Text style={styles.itemSub}>{project.role}</Text> : null}
                                    </View>
                                    {project.description ? <Text style={styles.itemDesc}>{project.description}</Text> : null}
                                    {project.stack?.length > 0 && (
                                        <Text style={styles.stack}>기술 스택: {project.stack.join(', ')}</Text>
                                    )}
                                    {project.github_link ? <Text style={styles.link}>{project.github_link}</Text> : null}
                                    {project.link ? <Text style={styles.link}>{project.link}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 자격증 */}
                {data.certifications.length > 0 && (
                    <Section title="자격증">
                        {data.certifications.map(cert => (
                            <View key={cert.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{cert.acquired_date ?? ''}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{cert.name}</Text>
                                        {cert.issuer ? <Text style={styles.itemSub}>{cert.issuer}</Text> : null}
                                        {cert.cert_number ? <Text style={styles.itemBadge}>({cert.cert_number})</Text> : null}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 어학 / 활동 */}
                {data.languageActivities.length > 0 && (
                    <Section title="어학 / 활동">
                        {data.languageActivities.map(activity => (
                            <View key={activity.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{activity.activity_date ?? ''}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{activity.name}</Text>
                                        {activity.score_or_desc ? <Text style={styles.itemSub}>{activity.score_or_desc}</Text> : null}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 교육 이수 */}
                {data.educationCourses.length > 0 && (
                    <Section title="교육 이수 사항">
                        {data.educationCourses.map(course => (
                            <View key={course.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{periodText(course.start_date, course.end_date)}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{course.course_name}</Text>
                                        {course.institution ? <Text style={styles.itemSub}>{course.institution}</Text> : null}
                                    </View>
                                    {course.summary ? <Text style={styles.itemDesc}>{course.summary}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 수상 */}
                {data.awards.length > 0 && (
                    <Section title="수상 경력">
                        {data.awards.map(award => (
                            <View key={award.id} style={styles.row} wrap={false}>
                                <Text style={styles.dateCol}>{award.awarded_date ?? ''}</Text>
                                <View style={styles.bodyCol}>
                                    <View style={styles.itemTitleRow}>
                                        <Text style={styles.itemTitle}>{award.name}</Text>
                                        {award.rank ? <Text style={styles.itemSub}>{award.rank}</Text> : null}
                                    </View>
                                    {award.description ? <Text style={styles.itemDesc}>{award.description}</Text> : null}
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* 포트폴리오 상세 (링크/산출물 목록) */}
                {data.portfolioItems.length > 0 && (
                    <Section title="포트폴리오">
                        {data.portfolioItems.map(item => {
                            const url = item.video_url || item.image_url
                            return (
                                <View key={item.id} style={styles.row} wrap={false}>
                                    <Text style={styles.dateCol}>
                                        {item.item_type === 'image' ? '이미지' : item.item_type === 'code' ? '코드' : item.item_type === 'video' ? '영상' : ''}
                                    </Text>
                                    <View style={styles.bodyCol}>
                                        <Text style={styles.itemTitle}>{item.title ?? '(제목 없음)'}</Text>
                                        {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                                        {url ? <Text style={styles.link}>{url}</Text> : null}
                                    </View>
                                </View>
                            )
                        })}
                    </Section>
                )}

                {/* 자기소개서 */}
                {data.coverLetters.length > 0 && (
                    <Section title="자기소개서">
                        {data.coverLetters.map(letter => (
                            <View key={letter.id} style={{ marginBottom: 10 }}>
                                {letter.question ? (
                                    <Text style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 3 }}>Q. {letter.question}</Text>
                                ) : (
                                    <Text style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 3 }}>{letter.title}</Text>
                                )}
                                {letter.answer ? <Text style={{ fontSize: 8.5, color: '#44403c' }}>{letter.answer}</Text> : null}
                            </View>
                        ))}
                    </Section>
                )}
            </Page>
        </Document>
    )
}
