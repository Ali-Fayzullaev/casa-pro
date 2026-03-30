# План реализации: UI для трёх бизнес-фич Pro Casa

## Обзор

Реализация трёх UI-фич фронтенда Pro Casa на TypeScript (Next.js App Router, shadcn/ui, TanStack Query, Axios). Бэкенд уже реализован. Задачи организованы по фичам с инкрементальной интеграцией.

## Задачи

- [x] 1. Фича «Подписки» — страница администратора
  - [x] 1.1 Создать компонент `SubscriptionsTable` (`pro-casa/components/admin/SubscriptionsTable.tsx`)
    - Реализовать таблицу на основе `<Table>` (shadcn/ui) с колонками: пользователь (имя + email), роль, план (Badge с цветом), статус (Badge с цветом), дата начала, дата окончания, сумма
    - Цвета бейджей плана: FREE — серый, BASIC — синий, PRO — жёлтый, ENTERPRISE — зелёный
    - Цвета бейджей статуса: ACTIVE — зелёный, EXPIRED — красный, CANCELLED — серый
    - Принимает пропс `subscriptions: Subscription[]`
    - _Требования: 1.2, 1.8, 1.9_

  - [x] 1.2 Создать компонент `SubscriptionForm` (`pro-casa/components/admin/SubscriptionForm.tsx`)
    - Реализовать Dialog (shadcn/ui) с полями: выбор пользователя (Select с данными из `GET /api/users`), план (Select: FREE/BASIC/PRO/ENTERPRISE), дата окончания (Input date), сумма (Input number)
    - Мутация `POST /api/subscriptions` через `useMutation`, `invalidateQueries(["subscriptions"])` при успехе
    - Toast-уведомления: успех — «Подписка назначена», ошибка — текст из ответа API
    - _Требования: 1.3, 1.4, 1.5_

  - [x] 1.3 Создать страницу подписок (`pro-casa/app/dashboard/admin/subscriptions/page.tsx`)
    - Клиентский компонент (`"use client"`)
    - `useQuery({ queryKey: ["subscriptions"], queryFn: ... })` для загрузки данных через `GET /api/subscriptions`
    - Кнопка «Назначить подписку» открывает `SubscriptionForm`
    - Скелетон-заглушки при `isLoading`
    - Подключить `SubscriptionsTable` и `SubscriptionForm`
    - _Требования: 1.1, 1.3, 1.7_

  - [x] 1.4 Добавить пункт «Подписки» в боковое меню (`pro-casa/components/app-sidebar.tsx`)
    - Добавить `{ title: "Подписки", url: "/dashboard/admin/subscriptions", icon: CreditCard }` в `adminMenuItem.subItems`
    - Импортировать иконку `CreditCard` из `lucide-react`
    - _Требования: 1.6_

- [x] 2. Контрольная точка — Фича «Подписки»
  - Убедиться, что страница подписок рендерится без ошибок, таблица отображает данные, форма создания работает, пункт меню виден для ADMIN. Спросить пользователя, если возникнут вопросы.

- [x] 3. Фича «Заявки в банки» — страница брокера
  - [x] 3.1 Создать компонент `MortgageApplicationsTable` (`pro-casa/components/mortgage/MortgageApplicationsTable.tsx`)
    - Таблица `<Table>` (shadcn/ui) с колонками: клиент (имя + телефон), банк, программа, сумма кредита, срок (мес.), ставка (%), статус (Badge), дата создания
    - Цвета бейджей статуса: DRAFT — серый, SUBMITTED — синий, REVIEWING — жёлтый, APPROVED — зелёный, REJECTED — красный, CANCELLED — серый
    - По клику на строку — вызов `onRowClick(application)` для открытия диалога смены статуса
    - _Требования: 2.2, 2.6, 2.7_

  - [x] 3.2 Создать компонент `MortgageApplicationForm` (`pro-casa/components/mortgage/MortgageApplicationForm.tsx`)
    - Dialog с полями: выбор клиента (Select из `GET /api/clients`), название банка (Input text, обязательное), название программы (Input text), сумма кредита (Input number, обязательное, > 0), срок в месяцах (Input number, обязательное, > 0), процентная ставка (Input number)
    - Клиентская валидация: clientId, bankName, loanAmount, termMonths — обязательные
    - Мутация `POST /api/mortgage-applications`, `invalidateQueries(["mortgage-applications"])` при успехе
    - _Требования: 2.3, 2.4, 2.5_

  - [x] 3.3 Создать компонент `StatusChangeDialog` (`pro-casa/components/mortgage/StatusChangeDialog.tsx`)
    - Dialog для изменения статуса заявки: Select со статусами (DRAFT, SUBMITTED, REVIEWING, APPROVED, REJECTED, CANCELLED), Textarea для responseNotes
    - Мутация `PUT /api/mortgage-applications/:id/status`
    - _Требования: 2.7_

  - [x] 3.4 Создать страницу заявок (`pro-casa/app/dashboard/mortgage-applications/page.tsx`)
    - Клиентский компонент (`"use client"`)
    - `useQuery({ queryKey: ["mortgage-applications"], queryFn: ... })` для загрузки через `GET /api/mortgage-applications`
    - Кнопка «Новая заявка» открывает `MortgageApplicationForm`
    - Клик по строке открывает `StatusChangeDialog`
    - Скелетон-заглушки при `isLoading`
    - _Требования: 2.1, 2.9_

  - [x] 3.5 Добавить пункт «Заявки в банки» в боковое меню (`pro-casa/components/app-sidebar.tsx`)
    - Добавить новый элемент в массив `menuItems` после пункта «Ипотека»: `{ title: "Заявки в банки", icon: FileText, url: "/dashboard/mortgage-applications", roles: ["ADMIN", "BROKER", "REALTOR"] }`
    - _Требования: 2.8_

- [x] 4. Контрольная точка — Фича «Заявки в банки»
  - Убедиться, что страница заявок рендерится, таблица отображает данные, форма создания и диалог смены статуса работают, пункт меню виден для ADMIN/BROKER/REALTOR. Спросить пользователя, если возникнут вопросы.

- [x] 5. Фича «TradeIn» — кнопка и форма в карточке объекта CRM
  - [x] 5.1 Создать компонент `TradeInForm` (`pro-casa/components/crm/forms/TradeInForm.tsx`)
    - Dialog с полями: выбор ЖК/проекта (Select из `GET /api/projects`, с индикатором загрузки), цена новой квартиры (Input number, обязательное), процент комиссии (Input number, по умолчанию 1.5), выбор клиента (Select из `GET /api/clients`, опциональное), комментарий (Textarea, опциональное)
    - Автоматически подставляемые скрытые поля: `oldPropertyId` = `property.id`, `sellerId` = `property.sellerId`
    - Расчёт комиссии в реальном времени: комиссия = цена × процент / 100, Casa Fee = комиссия × 20% — отображать как информационный блок под полями
    - Валидация: цена новой квартиры обязательна и > 0
    - Мутация `POST /api/deals/tradein`, toast «TradeIn сделка создана» при успехе
    - _Требования: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 5.2 Создать компонент `TradeInButton` (`pro-casa/components/crm/TradeInButton.tsx`)
    - Компактная кнопка с иконкой `ArrowLeftRight` (lucide-react)
    - Принимает пропс `property: CrmProperty`
    - По клику открывает `TradeInForm`
    - _Требования: 3.1, 3.2_

  - [x] 5.3 Интегрировать `TradeInButton` в `PropertyCardBase` (`pro-casa/components/crm/PropertyCard.tsx`)
    - Добавить `TradeInButton` в секцию действий `<div className="flex gap-1 z-20">` рядом с кнопками Eye и AI
    - Импортировать `TradeInButton` из `./TradeInButton`
    - _Требования: 3.1_

- [x] 6. Финальная контрольная точка
  - Убедиться, что все три фичи работают без ошибок: страница подписок, страница заявок, кнопка и форма TradeIn в карточке объекта. Спросить пользователя, если возникнут вопросы.

## Примечания

- Все компоненты следуют существующим паттернам проекта: `useQuery`/`useMutation` для данных, `api` (Axios) для запросов, `toast` (sonner) для уведомлений
- Формы реализуются как Dialog (shadcn/ui) с контролируемыми состояниями React (без react-hook-form)
- Бэкенд API уже реализован, задачи касаются только фронтенда
- Каждая задача ссылается на конкретные требования из requirements.md
