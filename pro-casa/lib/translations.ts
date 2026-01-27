export const StrategyTypeLabels: Record<string, string> = {
    MARKET_SALE: "Рыночная продажа",
    URGENT_SALE: "Срочная продажа",
    SALE_TO_PURCHASE: "Альтернативная сделка",
    EXPECTATION_ALIGNMENT: "Коррекция ожиданий",
    LIMITED_ENGAGEMENT: "Тестовый период",
    INVESTMENT_EXIT: "Фиксация прибыли",
    LEGAL_COMPLEX: "Юридически сложный",
    LOW_LIQUIDITY: "Ограниченный спрос",
    ALTERNATIVE_EXIT: "Спец. решение",
    REJECT_OBJECT: "Отказ (Не подходит)",
    HIGH_TICKET_SALE: "Премиум-сегмент",
    PRICE_DISCOVERY: "Оценка спроса",
};

export const PropertyClassLabels: Record<string, string> = {
    OLD_FUND: "Старый фонд",
    ECONOMY: "Эконом",
    COMFORT: "Комфорт",
    COMFORT_PLUS: "Комфорт+",
    BUSINESS: "Бизнес-класс",
};

export const LiquidityLevelLabels: Record<string, string> = {
    HIGH: "Высокая",
    ABOVE_AVERAGE: "Выше средней",
    AVERAGE: "Средняя",
    BELOW_AVERAGE: "Ниже средней",
    LOW: "Низкая",
};

export const RepairStateLabels: Record<string, string> = {
    NONE: "Черновая",
    COSMETIC: "Косметический",
    EURO: "Евроремонт",
    DESIGNER: "Дизайнерский",
    CAPITAL: "Требует ремонта",
};

export const FunnelStageLabels: Record<string, string> = {
    CONTACT: "Контакт",
    INTERVIEW: "Интервью",
    STRATEGY: "Стратегия",
    CONTRACT_SIGNING: "Договор",
    CREATED: "Создан",
    PREPARATION: "Подготовка",
    LEADS: "Лиды",
    SHOWS: "Показы",
    DEAL: "Сделка",
    POST_SERVICE: "Пост-сервис",
};

export const DeadlineLabels: Record<string, string> = {
    URGENT_30_DAYS: "Срочно (до 30 дней)",
    NORMAL_90_DAYS: "1-3 месяца",
    FLEXIBLE_180_DAYS: "Более 3 месяцев",
    NO_RUSH: "Не спешу",
};
