/**
 * Design Tokens for Casa PRO v1.2
 * Based on provided mockups and design requirements
 */

export const designTokens = {
    // Colors from v1.2 design
    colors: {
        // Primary brand colors
        primary: {
            main: 'hsl(222, 47%, 11%)', // Dark blue-black from mockups
            light: 'hsl(222, 47%, 20%)',
            dark: 'hsl(222, 47%, 5%)',
        },
        // Accent colors
        accent: {
            blue: 'hsl(217, 91%, 60%)', // Bright blue for CTAs
            green: 'hsl(142, 76%, 36%)', // Success green
            orange: 'hsl(24, 100%, 50%)', // Warning/highlight orange
            red: 'hsl(0, 84%, 60%)', // Error/danger red
        },
        // Status colors
        status: {
            new: 'hsl(217, 91%, 60%)',
            inProgress: 'hsl(45, 93%, 47%)',
            completed: 'hsl(142, 76%, 36%)',
            cancelled: 'hsl(0, 84%, 60%)',
        },
        // Neutral colors
        neutral: {
            50: 'hsl(220, 13%, 95%)',
            100: 'hsl(220, 13%, 91%)',
            200: 'hsl(220, 13%, 81%)',
            300: 'hsl(220, 13%, 69%)',
            400: 'hsl(220, 13%, 57%)',
            500: 'hsl(220, 13%, 45%)',
            600: 'hsl(220, 13%, 33%)',
            700: 'hsl(220, 13%, 21%)',
            800: 'hsl(220, 13%, 13%)',
            900: 'hsl(220, 13%, 9%)',
        },
    },

    // Typography
    typography: {
        fontFamily: {
            sans: 'var(--font-geist-sans)',
            mono: 'var(--font-geist-mono)',
        },
        fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            base: '1rem',     // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            '2xl': '1.5rem',  // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem',  // 36px
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },

    // Spacing (8px grid)
    spacing: {
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
    },

    // Border radius
    borderRadius: {
        none: '0',
        sm: '0.375rem',   // 6px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        full: '9999px',
    },

    // Shadows
    shadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },

    // Animation durations
    animation: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
    },
} as const;

// Status badge colors helper
export const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
        NEW: designTokens.colors.status.new,
        IN_PROGRESS: designTokens.colors.status.inProgress,
        COMPLETED: designTokens.colors.status.completed,
        CANCELLED: designTokens.colors.status.cancelled,
        PENDING: designTokens.colors.status.inProgress,
        CONFIRMED: designTokens.colors.status.completed,
        EXPIRED: designTokens.colors.status.cancelled,
        DEAL_CLOSED: designTokens.colors.status.completed,
        REJECTED: designTokens.colors.status.cancelled,
    };
    return statusMap[status] || designTokens.colors.neutral[500];
};

// Client type colors
export const getClientTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
        BUYER: designTokens.colors.accent.blue,
        SELLER: designTokens.colors.accent.orange,
        NEW_BUILDING: designTokens.colors.accent.green,
    };
    return typeMap[type] || designTokens.colors.neutral[500];
};
