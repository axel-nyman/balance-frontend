# Changelog

## [1.2.0](https://github.com/axel-nyman/balance-frontend/compare/balance-frontend-v1.1.1...balance-frontend-v1.2.0) (2026-01-09)


### Features

* implement multi-platform Docker build support for ARM64 and amd64 ([cbcff9e](https://github.com/axel-nyman/balance-frontend/commit/cbcff9e66dc598e695f77ade5b35aa2dd737d781))

## [1.1.1](https://github.com/axel-nyman/balance-frontend/compare/balance-frontend-v1.1.0...balance-frontend-v1.1.1) (2026-01-08)


### Bug Fixes

* **ci:** correct semver pattern values in Docker metadata action ([c453127](https://github.com/axel-nyman/balance-frontend/commit/c4531275219a220641d40956c52a2285ee6d3c0c))

## [1.1.0](https://github.com/axel-nyman/balance-frontend/compare/balance-frontend-v1.0.0...balance-frontend-v1.1.0) (2026-01-08)


### Features

* add API client with TypeScript types ([f109901](https://github.com/axel-nyman/balance-frontend/commit/f1099019524d23edad438c62e0a2d9d130a1fa6f))
* add BudgetActions component for lock/unlock/delete budget ([860e380](https://github.com/axel-nyman/balance-frontend/commit/860e380d8665fc2c512b3e718c9fbe5f8e095702))
* add BudgetSection component with collapsible income/expenses/savings sections ([b73f681](https://github.com/axel-nyman/balance-frontend/commit/b73f681078100f74e3157e11bb978ea891d87aec))
* add BudgetSummary component with income/expenses/savings/balance display ([746c733](https://github.com/axel-nyman/balance-frontend/commit/746c733c67a551a42cde4493daea78bcebf442c4))
* add commit slash command and thoughts directory structure ([94aad2d](https://github.com/axel-nyman/balance-frontend/commit/94aad2d6b3dd65c243ab42d8740ed3c807816389))
* add DeleteItemDialog component for budget item deletion ([b3e7925](https://github.com/axel-nyman/balance-frontend/commit/b3e792526308a6f68454fe7760c701336f8cbc97))
* add detailed implementation plans for all frontend stories ([8f04ad0](https://github.com/axel-nyman/balance-frontend/commit/8f04ad03300dc907e8293a70dff5eee4500b64b4))
* add Docker development environment ([896070f](https://github.com/axel-nyman/balance-frontend/commit/896070ff37f2f811b7cd5ea65a1b47558e7d2ab9))
* add duplicate budget warning to month/year wizard step ([1310733](https://github.com/axel-nyman/balance-frontend/commit/131073333b6eecb14eb0b145bb89b8077c03fa6a))
* add ExpenseItemModal with create/edit/delete functionality ([bf9ef9b](https://github.com/axel-nyman/balance-frontend/commit/bf9ef9b59d31dcb438be7ae7ec0b8fe4603cfcf4))
* add IncomeItemModal with create/edit/delete functionality ([8aa1959](https://github.com/axel-nyman/balance-frontend/commit/8aa1959521bfcb4327250db6c1f5256799d414cd))
* add layout shell with sidebar navigation ([9a5fe33](https://github.com/axel-nyman/balance-frontend/commit/9a5fe331b0e31872c71ca7677206d7a442bbae57))
* Add new agents and commands for enhanced research and planning capabilities ([b56fb14](https://github.com/axel-nyman/balance-frontend/commit/b56fb14e307f25866bb313c2f937c872b8088fae))
* add production Docker deployment with nginx ([2cbedbf](https://github.com/axel-nyman/balance-frontend/commit/2cbedbf12dbd9abfc7501bdb846255150f4bc621))
* add React Query setup with custom hooks ([7597240](https://github.com/axel-nyman/balance-frontend/commit/7597240f70ada11b3ff7b940c05b09c0e60e57b5))
* add routing setup with React Router v7 ([2f0b98a](https://github.com/axel-nyman/balance-frontend/commit/2f0b98a4b8694bfa85b153eb8fcc66fda663ab32))
* add SavingsItemModal with create/edit/delete functionality ([ef65f9d](https://github.com/axel-nyman/balance-frontend/commit/ef65f9dbb934724961042db5ceced91a01497ed8))
* add shadcn/ui components and shared UI components ([aee84f9](https://github.com/axel-nyman/balance-frontend/commit/aee84f95dd7ae37754957fe8bba69f63c869e856))
* add utility functions for currency and budget calculations ([96391d7](https://github.com/axel-nyman/balance-frontend/commit/96391d721d5d549e35aa73b133675dee57ef94f8))
* add validation utilities and hook for budget wizard ([003be36](https://github.com/axel-nyman/balance-frontend/commit/003be36651c17e87f941ddfb23b81a8a85da6b82))
* enhance TodoProgress with shadcn progress bar and tests ([20354f3](https://github.com/axel-nyman/balance-frontend/commit/20354f3bfd95f0063e923b1310aea2a6699d1942))
* fix budget wizard accordion animation and progress bar calculation ([612afc5](https://github.com/axel-nyman/balance-frontend/commit/612afc595e933c29d6595b7edc52160831e15c13))
* implement accounts list with summary, table/card views, and loading states ([2fcb3f4](https://github.com/axel-nyman/balance-frontend/commit/2fcb3f4c7465733476f05b0e524c0ee2470b94a4))
* implement AccountsPage with header and new account button, add tests for rendering ([065440e](https://github.com/axel-nyman/balance-frontend/commit/065440e60e182399fd22a1df960c57eae9b50659))
* implement balance history drawer with infinite scroll ([d09e44b](https://github.com/axel-nyman/balance-frontend/commit/d09e44b41fb0cc0f419b307883b1737c0665ac2d))
* implement budget card grid with responsive layout ([6c93466](https://github.com/axel-nyman/balance-frontend/commit/6c934665b72d170d616529060eb4b99f47c45d2c))
* implement budget detail page shell with status badge ([80a3034](https://github.com/axel-nyman/balance-frontend/commit/80a30344a21106bd3928e5e89bcd26972058ef89))
* implement budget wizard expenses step with quick-add ([83e728e](https://github.com/axel-nyman/balance-frontend/commit/83e728e7730181d6ff2faddaf25b63d53da32ea9))
* implement budget wizard income step with copy functionality ([ef65adf](https://github.com/axel-nyman/balance-frontend/commit/ef65adfbeadfe9d282ec8c955895462686ed85ce))
* implement budget wizard review step with save functionality ([3c7281b](https://github.com/axel-nyman/balance-frontend/commit/3c7281b8680e2a4e59f9c1c8898e98616ef336c0))
* implement budget wizard savings step with account selection ([fa185c2](https://github.com/axel-nyman/balance-frontend/commit/fa185c245d4286e87ed930b4ddf18386e1d56467))
* implement budget wizard shell with step navigation ([a540d83](https://github.com/axel-nyman/balance-frontend/commit/a540d838a075dc13cca6e40ab8f3cf693e6fc3a8))
* implement budgets page shell with header and button ([eb482ca](https://github.com/axel-nyman/balance-frontend/commit/eb482caf19f9b29c5d3535fdeca4baac1be90b38))
* implement create account modal with validation ([7292679](https://github.com/axel-nyman/balance-frontend/commit/72926791f62cc2ef0469bc45d701a2933dc91aaf))
* implement create recurring expense modal ([99cdf52](https://github.com/axel-nyman/balance-frontend/commit/99cdf523fca808ba70321a964a90716a0fbd4905))
* implement delete account confirmation dialog ([93b3e16](https://github.com/axel-nyman/balance-frontend/commit/93b3e168e7a94513787e438d4d2faf9de4e0a7d5))
* implement delete recurring expense dialog ([99003ca](https://github.com/axel-nyman/balance-frontend/commit/99003ca773d99329cf60ec8687f095476e1bc8b2))
* implement edit account modal with validation ([0ebfee2](https://github.com/axel-nyman/balance-frontend/commit/0ebfee2371f7b6fd715c02f231466ca7f8cc4342))
* implement edit recurring expense modal ([c327b7d](https://github.com/axel-nyman/balance-frontend/commit/c327b7db8924380e0ad0173226ec3b5fe585c9ce))
* implement recurring expenses list with responsive cards ([a400c4a](https://github.com/axel-nyman/balance-frontend/commit/a400c4a83a0b58c6dfd04daa554a8b88dae3a74b))
* implement recurring expenses page shell with header and button ([2198645](https://github.com/axel-nyman/balance-frontend/commit/2198645cddacee1c0eb9645caca8a0247968705e))
* implement Todo List page shell with progress tracking ([ea17941](https://github.com/axel-nyman/balance-frontend/commit/ea1794162cefdae7e2b210d09ec880806601e333))
* implement TodoItemRow with toggle and type grouping ([bc121c0](https://github.com/axel-nyman/balance-frontend/commit/bc121c01cec52653efd0a85d888bff0f71772528))
* implement update balance modal in balance history drawer ([fd77306](https://github.com/axel-nyman/balance-frontend/commit/fd77306c34632216fa80a95310ff90a2e14c8217))
* replace income copy modal with inline copy functionality ([b7c8863](https://github.com/axel-nyman/balance-frontend/commit/b7c88639fdfb7a22f2582350d47dfe3c7f101e16))
* replace Load More button with infinite scroll in balance history ([5ab94c1](https://github.com/axel-nyman/balance-frontend/commit/5ab94c1a733c53b21d9a5bdda007fecd787aae55))
* scaffold React project with Vite, Tailwind v4, and Vitest ([5cf6b7c](https://github.com/axel-nyman/balance-frontend/commit/5cf6b7c2e17ef201783a10788f1d5b9fca8b2c7f))
* update permissions to allow git add and commit commands ([e65ed73](https://github.com/axel-nyman/balance-frontend/commit/e65ed73a8f28c655e2588830739b84f192805b95))


### Bug Fixes

* correct recurring expense field names and budget lock HTTP method ([0b165c8](https://github.com/axel-nyman/balance-frontend/commit/0b165c8ac4b11cb9b56927e9f63d89b0742908b7))
* edited and moved agents and commands ([e0a6e09](https://github.com/axel-nyman/balance-frontend/commit/e0a6e09f25873b9adb156a2e3b96b8945e6e5759))
* improved consistency over planning files ([ea89098](https://github.com/axel-nyman/balance-frontend/commit/ea89098b64a054232ad514ac8f878f0a71d8c4f2))
* move project overview and todo list flow documents to the correct places ([bf66e52](https://github.com/axel-nyman/balance-frontend/commit/bf66e52aac35e6bb12d297ae21d7258ded6caf4f))
* moved agents and commands ([84278ff](https://github.com/axel-nyman/balance-frontend/commit/84278ff54c9954dad9c229d7d15a95b5237c58ae))
* remove outdated todo item files and corrected inconsistencies across planning files ([1e96e1d](https://github.com/axel-nyman/balance-frontend/commit/1e96e1dc2386128c5535ac3f196dedc6eaa871b2))
* resolve lint errors and update StepIncome tests to match inline implementation ([a20a428](https://github.com/axel-nyman/balance-frontend/commit/a20a42891ce749318a3e8fcc819954e3c397d4c4))
* resolve lint errors in test setup and components ([a3d1b23](https://github.com/axel-nyman/balance-frontend/commit/a3d1b234b43d2599052ab387c548d4cd22e60730))
* resolve react-router module mismatch in tests ([7fb10fb](https://github.com/axel-nyman/balance-frontend/commit/7fb10fb0cecedd8b08b678f1db1efb1d2d743135))


### Code Refactoring

* reorganize documentation into .claude/thoughts structure ([9ca5347](https://github.com/axel-nyman/balance-frontend/commit/9ca53476cebfb626dcb4bf263c4848c24670b1a9))
