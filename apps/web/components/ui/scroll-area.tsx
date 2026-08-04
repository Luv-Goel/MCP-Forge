'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function ScrollArea({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('relative overflow-y-auto overflow-x-hidden scrollbar-thin', className)}
            {...props}
        >
            {children}
        </div>
    );
}
