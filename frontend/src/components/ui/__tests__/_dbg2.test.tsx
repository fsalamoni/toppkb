import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonForm } from '../skeleton-form';

describe('debug2', () => {
  it('prints full html', () => {
    const { container } = render(<SkeletonForm variant="large" />);
    console.log(container.innerHTML);
    console.log('---');
    console.log('h-10 count:', container.querySelectorAll('[class*="h-10"]').length);
    console.log('h-24 count:', container.querySelectorAll('[class*="h-24"]').length);
  });
});
