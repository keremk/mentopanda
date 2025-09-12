'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

// Keep this component simple and stable to avoid remounts/flicker.
// We avoid useMemo here; React handles diffing efficiently and
// Streamdown should not be remounted unless necessary.
export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        // Avoid forcing height:100% to prevent layout thrash in flowing content
        'w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
      {...props}
    />
  ),
  // Only re-render when the streamed text actually changes
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
