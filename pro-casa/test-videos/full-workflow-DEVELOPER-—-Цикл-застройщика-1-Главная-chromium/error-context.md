# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e8]
      - generic [ref=e11]: PRO.casa.kz
      - generic [ref=e12]: Войдите в систему для продолжения
    - generic [ref=e15]:
      - group [ref=e16]:
        - generic [ref=e17]: Email
        - textbox "Email" [ref=e18]:
          - /placeholder: email@example.com
      - group [ref=e19]:
        - generic [ref=e20]: Пароль
        - textbox "Пароль" [ref=e21]:
          - /placeholder: ••••••••
      - group [ref=e22]:
        - button "Войти" [ref=e23]
  - region "Notifications (F8)":
    - list
  - generic [ref=e24]:
    - img [ref=e26]
    - button "Open Tanstack query devtools" [ref=e74] [cursor=pointer]:
      - img [ref=e75]
  - button "Open Next.js Dev Tools" [ref=e128] [cursor=pointer]:
    - img [ref=e129]
  - alert [ref=e132]
```