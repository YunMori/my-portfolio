export type Language = 'en' | 'ko';

export const translations = {
    en: {
        nav: {
            about: 'About',
            skills: 'Skills',
            projects: 'Projects',
            blog: 'Blog',
            contact: 'Contact',
            login: 'Login',
            admin: 'Admin'
        },
        hero: {
            greeting: 'Hello, I am',
            basedIn: 'Based in Seoul, South Korea.',
            resume: 'View Resume',
            contact: 'Contact Me'
        },
        stats: {
            years: 'Years Exp.',
            projects: 'Projects',
            clients: 'Clients'
        },
        projects: {
            header: 'Selected Works',
            title: 'Recent Projects',
            viewCase: 'View Case Study',
            viewSource: 'View Source',
            noContent: 'No detailed content available for this project yet.',
            filterAll: 'All'
        },
        blog: {
            header: 'Writing',
            title: 'Latest Articles',
            readMore: 'Read Article',
            published: 'Published',
            noContent: 'No blog posts yet.',
            tags: 'Tags'
        },
        footer: {
            rights: 'All rights reserved.',
            backToTop: 'Back to Top'
        }
    },
    ko: {
        nav: {
            about: '소개',
            skills: '기술 스택',
            projects: '프로젝트',
            blog: '블로그',
            contact: '연락처',
            login: '로그인',
            admin: '관리자'
        },
        hero: {
            greeting: '안녕하세요,',
            basedIn: '서울에서 활동하고 있습니다.',
            resume: '이력서 보기',
            contact: '연락하기'
        },
        stats: {
            years: '년차 경력',
            projects: '프로젝트',
            clients: '클라이언트'
        },
        projects: {
            header: '포트폴리오',
            title: '최근 프로젝트',
            viewCase: '자세히 보기',
            viewSource: '소스 코드',
            noContent: '이 프로젝트에 대한 상세 내용이 아직 없습니다.',
            filterAll: '전체'
        },
        blog: {
            header: '글쓰기',
            title: '최근 아티클',
            readMore: '아티클 읽기',
            published: '게시일',
            noContent: '아직 블로그 글이 없습니다.',
            tags: '태그'
        },
        footer: {
            rights: '모든 권리 보유.',
            backToTop: '맨 위로'
        }
    }
};
