import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));
