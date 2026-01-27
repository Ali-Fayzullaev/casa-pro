export enum SellerFunnelStage {
    CONTACT = 'CONTACT',
    INTERVIEW = 'INTERVIEW',
    STRATEGY = 'STRATEGY',
    CONTRACT_SIGNING = 'CONTRACT_SIGNING',
}

export enum PropertyFunnelStage {
    CREATED = 'CREATED',
    PREPARATION = 'PREPARATION',
    LEADS = 'LEADS',
    SHOWS = 'SHOWS',
    DEAL = 'DEAL',
    POST_SERVICE = 'POST_SERVICE',
}

export enum PropertyClass {
    OLD_FUND = 'OLD_FUND',
    ECONOMY = 'ECONOMY',
    COMFORT = 'COMFORT',
    COMFORT_PLUS = 'COMFORT_PLUS',
    BUSINESS = 'BUSINESS',
}

export enum StrategyType {
    MARKET_SALE = 'MARKET_SALE',
    URGENT_SALE = 'URGENT_SALE',
    SALE_TO_PURCHASE = 'SALE_TO_PURCHASE',
    EXPECTATION_ALIGNMENT = 'EXPECTATION_ALIGNMENT',
    LIMITED_ENGAGEMENT = 'LIMITED_ENGAGEMENT',
    INVESTMENT_EXIT = 'INVESTMENT_EXIT',
    LEGAL_COMPLEX = 'LEGAL_COMPLEX',
    LOW_LIQUIDITY = 'LOW_LIQUIDITY',
    ALTERNATIVE_EXIT = 'ALTERNATIVE_EXIT',
    REJECT_OBJECT = 'REJECT_OBJECT',
    HIGH_TICKET_SALE = 'HIGH_TICKET_SALE',
    PRICE_DISCOVERY = 'PRICE_DISCOVERY',
}

export enum LiquidityLevel {
    HIGH = 'HIGH',
    ABOVE_AVERAGE = 'ABOVE_AVERAGE',
    AVERAGE = 'AVERAGE',
    BELOW_AVERAGE = 'BELOW_AVERAGE',
    LOW = 'LOW',
}

export interface Seller {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    trustLevel: number;
    funnelStage: SellerFunnelStage;
    updatedAt: string;
    createdAt: string; // Added for filtering
    // Strategy fields
    managerComment?: string;
    reason?: string;
    deadline?: string;
    plansToPurchase?: boolean; // NEW
    strategyConfirmed?: boolean;
    source?: string;
    city?: string;
    broker?: {
        firstName: string;
        lastName: string;
    };
    properties?: {
        id: string;
        residentialComplex: string;
        price: string;
        funnelStage: PropertyFunnelStage;
        repairState?: string;
        ceilingHeight?: string;
        parkingType?: string;
    }[];
    _count?: {
        properties: number;
    };
}

export interface CrmProperty {
    id: string;
    residentialComplex: string;
    address?: string;
    rooms?: number;
    price: string; // Decimal comes as string
    area: string;
    imageUrl?: string;

    // Physical specs
    floor?: number;
    totalFloors?: number;
    yearBuilt?: number;
    repairState?: string;
    ceilingHeight?: number; // Changed to number based on likely usage, or string if that's how it comes from DB. Let's check DB schema? DB usually float. But frontend might expect string/number.
    // wait, SummaryDialog expects ceilingHeight to be printed.
    parkingType?: string;
    financeType?: string;

    // Calculated strategy fields
    calculatedClass?: PropertyClass;
    activeStrategy?: StrategyType;
    liquidityLevel?: LiquidityLevel;
    liquidityScore: number;

    // Checklists
    isMortgaged?: boolean; // NEW
    documentsVerified?: boolean; // NEW

    funnelStage: PropertyFunnelStage;
    updatedAt: string;
    createdAt: string; // Added for filtering
    strategyExplanation?: string;
    aiRecommendation?: string; // Added Phase 5
    images?: string[]; // Added Phase 2
    notes?: string;

    seller?: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string;
        trustLevel?: number;
    };
}
