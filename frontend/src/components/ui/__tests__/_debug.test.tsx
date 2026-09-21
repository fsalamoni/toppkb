import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonForm } from '../skeleton-form';

describe('debug', () => {
  it('prints html', () => {
    const { container } = render(<SkeletonForm variant="large" />);
    console.log(container.innerHTML);
  });
});
