import * as React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'default' | 'warning' | 'destructive' | 'success';

export function Alert({
    className,
    variant = 'default',
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
    const styles: Record<AlertVariant, string> = {
        default: 'border-gray-200 bg-gray-50 text-gray-800',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        destructive: 'border-red-200 bg-red-50 text-red-800',
        success: 'border-green-200 bg-green-50 text-green-800',
    };
    return <div className={cn('rounded-lg border p-4', styles[variant], className)} role="alert" {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h5 className={cn('mb-1 text-sm font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}
