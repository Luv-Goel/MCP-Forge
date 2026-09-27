import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

export function Badge({
    className,
    variant = 'default',
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
    const styles: Record<BadgeVariant, string> = {
        default: 'bg-navy text-white',
        secondary: 'bg-gray-100 text-gray-700',
        destructive: 'bg-red-100 text-red-700 border border-red-200',
        success: 'bg-green-100 text-green-700 border border-green-200',
        outline: 'border border-gray-300 text-gray-600',
    };
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                styles[variant],
                className,
            )}
            {...props}
        />
    );
}
