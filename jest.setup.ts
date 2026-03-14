import '@testing-library/jest-dom';

// Mock IntersectionObserver (not available in jsdom)
const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn((el: Element) => {
        // Immediately trigger intersection for all observed elements
        callback([{ isIntersecting: true, target: el }]);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
});
