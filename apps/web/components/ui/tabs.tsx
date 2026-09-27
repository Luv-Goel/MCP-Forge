'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = { value: string; setValue: (v: string) => void };
const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
    value,
    onValueChange,
    className,
    children,
}: {
    value: string;
    onValueChange: (v: string) => void;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <TabsContext.Provider value={{ value, setValue: onValueChange }}>
            <div className={cn('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1', className)}
            {...props}
        />
    );
}

export function TabsTrigger({
    value,
    className,
    children,
}: {
    value: string;
    className?: string;
    children: React.ReactNode;
}) {
    const ctx = React.useContext(TabsContext);
    const active = ctx?.value === value;
    return (
        <button
            type="button"
            onClick={() => ctx?.setValue(value)}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({
    value,
    className,
    children,
}: {
    value: string;
    className?: string;
    children: React.ReactNode;
}) {
    const ctx = React.useContext(TabsContext);
    if (ctx?.value !== value) return null;
    return <div className={cn('mt-2', className)}>{children}</div>;
}
