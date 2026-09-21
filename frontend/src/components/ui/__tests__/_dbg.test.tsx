import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonForm } from '../skeleton-form';

describe('debug', () => {
  it('prints html for large', () => {
    const { container } = render(<SkeletonForm variant="large" />);
    const textareas = container.querySelectorAll('[class*="h-24"]');
    console.log('h-24 count:', textareas.length);
    console.log(container.innerHTML.substring(0, 500));
  });
});
