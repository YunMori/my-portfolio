'use client'

/*
 * 실시간 PDF 미리보기.
 *
 * react-pdf가 제공하는 <PDFViewer>를 쓰지 않고 그 내부 훅인 usePDF를 직접 쓴다.
 * <PDFViewer>는 렌더가 실패하면 console.error 한 줄만 남기고 <iframe src={null}>을
 * 그리기 때문에, 폰트 fetch 실패든 이미지 포맷 오류든 레이아웃 예외든 화면에는 똑같이
 * "빈 회색 박스"로만 나타난다. 원인을 화면에서 바로 알 수 없어 디버깅이 불가능했다.
 * usePDF를 직접 쓰면 { url, loading, error }를 우리가 읽어 상태를 그릴 수 있다.
 */
import { Component, useEffect, type ReactElement, type ReactNode } from 'react'
import { usePDF, type DocumentProps } from '@react-pdf/renderer'

type PdfDocument = ReactElement<DocumentProps>

// usePDF의 타입 선언은 error를 string으로 적어두었지만 런타임에는 Error 객체가 들어온다.
function errorText(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return String(error)
}

const frameStyle = { width: '100%', height: 'calc(100vh - 180px)', border: 'none' } as const
const boxClass = 'flex flex-col items-center justify-center gap-3 text-center px-8'

function PreviewError({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className={boxClass} style={frameStyle}>
            <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500/70"></i>
            <p className="text-sm text-stone-300 font-bold">미리보기를 만들지 못했습니다</p>
            {/* 관리자 전용 화면이므로 원문 메시지를 그대로 노출한다 */}
            <p className="text-xs text-stone-500 font-mono break-all max-w-md">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-1 text-xs px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                >
                    <i className="fa-solid fa-rotate-right mr-1"></i>다시 시도
                </button>
            )}
        </div>
    )
}

/*
 * usePDF는 렌더 파이프라인이 reject할 때만 error 상태를 세운다. 문서 컴포넌트 자체가
 * 렌더 단계에서 throw하면 그건 훅 바깥이라 잡히지 않으므로 바운더리로 한 번 더 감싼다.
 */
class PreviewBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state: { error: Error | null } = { error: null }

    static getDerivedStateFromError(error: Error) {
        return { error }
    }

    componentDidCatch(error: Error) {
        console.error('Resume preview crashed:', error)
    }

    render() {
        if (this.state.error) {
            return (
                <PreviewError
                    message={this.state.error.message}
                    onRetry={() => this.setState({ error: null })}
                />
            )
        }
        return this.props.children
    }
}

function PreviewFrame({ document }: { document: PdfDocument }) {
    const [instance, update] = usePDF()

    // document는 호출부에서 useMemo로 고정된 element다. 여기서 identity가 흔들리면
    // 관계없는 상태 변경마다 PDF 전체가 재생성된다 (ResumeBuilder 주석 참고).
    useEffect(() => {
        update(document)
    }, [document, update])

    if (instance.error) return <PreviewError message={errorText(instance.error)} />

    // usePDF는 document 없이 시작하므로 loading이 false인 채로 url이 비어 있는 구간이 있다.
    // 첫 렌더에서는 한글 TTF(약 4MB) 다운로드가 끝나야 url이 생긴다.
    if (!instance.url) {
        return (
            <div className={boxClass} style={frameStyle}>
                <i className="fa-solid fa-spinner fa-spin text-2xl text-stone-600"></i>
                <p className="text-sm text-stone-500">미리보기를 생성하는 중...</p>
            </div>
        )
    }

    return <iframe src={`${instance.url}#toolbar=1`} title="이력서 미리보기" style={frameStyle} />
}

export default function ResumePreview({ document }: { document: PdfDocument }) {
    return (
        <PreviewBoundary>
            <PreviewFrame document={document} />
        </PreviewBoundary>
    )
}
