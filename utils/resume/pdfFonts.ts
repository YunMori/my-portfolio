// react-pdf 한글 폰트 등록 (클라이언트에서 1회)
// - react-pdf(fontkit)는 woff2/가변 폰트를 지원하지 않으므로 static TTF 사용
// - 동일 오리진(public/fonts)에서 서빙되어 CSP 수정 불필요
import { Font } from '@react-pdf/renderer'

let registered = false

export function registerResumeFonts() {
    if (registered) return
    registered = true

    Font.register({
        family: 'NanumGothic',
        fonts: [
            { src: '/fonts/NanumGothic-Regular.ttf', fontWeight: 400 },
            { src: '/fonts/NanumGothic-Bold.ttf', fontWeight: 700 },
        ],
    })

    // 한글은 단어 단위 줄바꿈이 불가능한 경우가 많아 글자 단위 줄바꿈을 허용한다.
    // 라틴 단어는 그대로 유지해 어색한 분절을 막는다.
    Font.registerHyphenationCallback(word =>
        /[ᄀ-ᇿ㄰-㆏가-힯]/.test(word) ? Array.from(word) : [word]
    )
}
