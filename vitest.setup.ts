import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount after every test so effects (timers, observers) are cleaned up.
afterEach(() => {
  cleanup();
});
