# [6.4.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v6.3.0...v6.4.0) (2025-07-05)


### Features

* 🎸 add /clear to interactive ([221973d](https://github.com/PrajnaAvidya/prompt-shaper/commit/221973ddd406ddad57dc89589587934ce4f7faed))
* 🎸 add /compact command ([c71756e](https://github.com/PrajnaAvidya/prompt-shaper/commit/c71756e554e189cd5573567af9a2ec51570b53ab))
* 🎸 add /cost function ([2828365](https://github.com/PrajnaAvidya/prompt-shaper/commit/282836587fb93f3d7336e5d43bb6083051767ab6))
* 🎸 add /help command to interactive ([81c46b3](https://github.com/PrajnaAvidya/prompt-shaper/commit/81c46b3818cc2b9bb50f57c71f72df126c436dee))
* 🎸 add /model command ([4408f00](https://github.com/PrajnaAvidya/prompt-shaper/commit/4408f002dd93c5531ace663ce25e063555a86b9c))
* 🎸 add /retry command ([24338e5](https://github.com/PrajnaAvidya/prompt-shaper/commit/24338e593a0cf199385ac1d55ef0c6d1b2d3b2b7))
* 🎸 add /system command to update system prompt ([cdbfac8](https://github.com/PrajnaAvidya/prompt-shaper/commit/cdbfac8c0beb044555b943ffa3c6be0da604d75a))
* 🎸 add /tokens command ([c5e87f6](https://github.com/PrajnaAvidya/prompt-shaper/commit/c5e87f6f276735449b774a3d755b1f5bdb618eea))
* 🎸 better pricing data for llm apis ([4c90e51](https://github.com/PrajnaAvidya/prompt-shaper/commit/4c90e513e2aaf5cc712a700bec02ecb12cabf457))

# [6.3.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v6.2.0...v6.3.0) (2025-07-05)


### Features

* 🎸 add support for /exit command ([473d67e](https://github.com/PrajnaAvidya/prompt-shaper/commit/473d67e6e9dfc1ca3fdc7c6f4a3f5977d16819cb)), closes [#63](https://github.com/PrajnaAvidya/prompt-shaper/issues/63)
* 🎸 add support for anthropic api ([6351ab0](https://github.com/PrajnaAvidya/prompt-shaper/commit/6351ab0df65a900a79549756f98716362db5f8fd)), closes [#54](https://github.com/PrajnaAvidya/prompt-shaper/issues/54)
* 🎸 add support for gemini ([ad17c9e](https://github.com/PrajnaAvidya/prompt-shaper/commit/ad17c9e4b530da8ed6fe8bf6bb6a9b5066ccceb9)), closes [#55](https://github.com/PrajnaAvidya/prompt-shaper/issues/55)

# [6.2.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v6.1.0...v6.2.0) (2025-07-04)


### Bug Fixes

* 🐛 fix bug in sample testing ([0e9dc33](https://github.com/PrajnaAvidya/prompt-shaper/commit/0e9dc336eaef3b512e6f5407b74c161fd0322e75))


### Features

* 🎸 profiles feature ([63ddb92](https://github.com/PrajnaAvidya/prompt-shaper/commit/63ddb92563392357cad4c751a327065dfc4ead8c))

# [6.1.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v6.0.0...v6.1.0) (2025-07-04)


### Features

* 🎸 add /rewind command to interactive mode ([9cc661e](https://github.com/PrajnaAvidya/prompt-shaper/commit/9cc661ec27e4a6c69397e830673fb755f747f7d2)), closes [#52](https://github.com/PrajnaAvidya/prompt-shaper/issues/52)

# [6.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v5.0.1...v6.0.0) (2025-07-04)


### Bug Fixes

* 🐛 fix test error on github ([143679c](https://github.com/PrajnaAvidya/prompt-shaper/commit/143679c7e87c02b08bd3064ac79cdb9d7033213d))


### Code Refactoring

* 💡 remove numeric handling ([2ce5cda](https://github.com/PrajnaAvidya/prompt-shaper/commit/2ce5cda36a4d8d7b42b55d4eb25b791861fbfa55)), closes [#51](https://github.com/PrajnaAvidya/prompt-shaper/issues/51)
* 💡 removed all openai-specific stuff from cli ([9b02675](https://github.com/PrajnaAvidya/prompt-shaper/commit/9b02675dc8eae62b1298376b7062df2f224d2786))


### Features

* 🎸 ability to ignore specific files/directories in loadDir ([5e6373b](https://github.com/PrajnaAvidya/prompt-shaper/commit/5e6373b9145789c3e663b44fbab9828f8d65188b)), closes [#44](https://github.com/PrajnaAvidya/prompt-shaper/issues/44)
* 🎸 add CLI support for ignore patterns ([e083730](https://github.com/PrajnaAvidya/prompt-shaper/commit/e08373045e978a27582a78ab0fc67dc64168412e))
* 🎸 added no-llm mode ([f878f80](https://github.com/PrajnaAvidya/prompt-shaper/commit/f878f8040b0be090811c42ec9b843b31c047ac05))
* 🎸 only show user/hr when in interactive mode ([67e68f3](https://github.com/PrajnaAvidya/prompt-shaper/commit/67e68f3eadcaa140af225bf09e24c49412aa1e19))


### BREAKING CHANGES

* 🧨 developer prompt cli/env var no longer work
* 🧨 any numeric types/arithmetic is broken

## [5.0.1](https://github.com/PrajnaAvidya/prompt-shaper/compare/v5.0.0...v5.0.1) (2025-07-03)


### Bug Fixes

* 🐛 don't parse content inside markdown blocks ([9612115](https://github.com/PrajnaAvidya/prompt-shaper/commit/9612115da8ca799aed6b5c3e293e172170f5f0ed)), closes [#20](https://github.com/PrajnaAvidya/prompt-shaper/issues/20)
* 🐛 don't parse content inside of multiline variables ([23fb5f5](https://github.com/PrajnaAvidya/prompt-shaper/commit/23fb5f50980fcf36efa0d333e8f1a00d9c503c15)), closes [#2](https://github.com/PrajnaAvidya/prompt-shaper/issues/2)
* 🐛 don't remove comments in raw mode ([270988b](https://github.com/PrajnaAvidya/prompt-shaper/commit/270988b9459230aeefe17a85209b2fdf60f63ffd)), closes [#50](https://github.com/PrajnaAvidya/prompt-shaper/issues/50)

# [5.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v4.0.0...v5.0.0) (2025-05-07)


### Features

* add option to hide initial prompt ([902eb3c](https://github.com/PrajnaAvidya/prompt-shaper/commit/902eb3c0396576aeca4ac7e0325208ec47b79bc1)), closes [#48](https://github.com/PrajnaAvidya/prompt-shaper/issues/48)
* add support for img tag ([b60ca9d](https://github.com/PrajnaAvidya/prompt-shaper/commit/b60ca9dadf38b3cfbd57ae11ceecc675912e47d7)), closes [#39](https://github.com/PrajnaAvidya/prompt-shaper/issues/39)
* add support for tscn/tres files by default (Godot engine) ([9bbc9bc](https://github.com/PrajnaAvidya/prompt-shaper/commit/9bbc9bc7e6247c72982f95f91e5d49f1387c853b)), closes [#45](https://github.com/PrajnaAvidya/prompt-shaper/issues/45)
* remove "assistant" from text outputs ([57e8442](https://github.com/PrajnaAvidya/prompt-shaper/commit/57e844266873b8c30a4b2c321e9a6fb1e64aca33)), closes [#47](https://github.com/PrajnaAvidya/prompt-shaper/issues/47)


### BREAKING CHANGES

* if your workflow relies on finding/removing "assistant" at the beginning of outputs
it will need to be updated

# [4.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v3.0.0...v4.0.0) (2025-02-21)


### Features

* add additional support for new openai models ([e8ea8d3](https://github.com/PrajnaAvidya/prompt-shaper/commit/e8ea8d3e1abbf02e820fdc2adee9d8ce13060371)), closes [#40](https://github.com/PrajnaAvidya/prompt-shaper/issues/40)
* add support for reasoning_effort and response_format ([859b9c0](https://github.com/PrajnaAvidya/prompt-shaper/commit/859b9c05149af56400685720589c8df441f6e743)), closes [#41](https://github.com/PrajnaAvidya/prompt-shaper/issues/41)


### BREAKING CHANGES

* prompt cli option/env var have been split into system vs developer prompt

# [3.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.4.0...v3.0.0) (2024-12-28)


### Bug Fixes

* remove newlines as valid whitespace inside tags ([c5a442a](https://github.com/PrajnaAvidya/prompt-shaper/commit/c5a442a7c26bade8a9bf1d2a167feb729b6c4718))


### BREAKING CHANGES

* if you were using newlines as whitespace inside promptshaper tags that doesn't work
anymore, but you really shouldn't have been doing that!

# [2.4.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.3.1...v2.4.0) (2024-12-14)


### Bug Fixes

* fix starting new interactive mode chat with o1 models ([5bb13dd](https://github.com/PrajnaAvidya/prompt-shaper/commit/5bb13dd7806efbb0c2a9e3ed11f1bce81b95b2fd))


### Features

* add loadUrl ([df44abf](https://github.com/PrajnaAvidya/prompt-shaper/commit/df44abfb94723179b24e69558262b65e87441c74)), closes [#26](https://github.com/PrajnaAvidya/prompt-shaper/issues/26)
* add pegjs to default file extensions ([7efd210](https://github.com/PrajnaAvidya/prompt-shaper/commit/7efd210476351d22d20a3f120369ffc73391d8ea))
* add support for async functions ([9ce6ec4](https://github.com/PrajnaAvidya/prompt-shaper/commit/9ce6ec4fbc1623559fa2ddfbb6e4de42f76a862f))

## [2.3.1](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.3.0...v2.3.1) (2024-12-13)


### Bug Fixes

* remove version cli arg ([d16ce88](https://github.com/PrajnaAvidya/prompt-shaper/commit/d16ce881b11406175df821b9a80bb6dd86867b01))

# [2.3.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.2.0...v2.3.0) (2024-12-13)


### Features

* add output-assistant option ([09d58f0](https://github.com/PrajnaAvidya/prompt-shaper/commit/09d58f0598570e2b847ec537a8b85f94fc5165c3)), closes [#25](https://github.com/PrajnaAvidya/prompt-shaper/issues/25)

# [2.2.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.1.0...v2.2.0) (2024-12-13)


### Features

* added loadDir template function ([1080245](https://github.com/PrajnaAvidya/prompt-shaper/commit/1080245f01a2e710e7f910099453027ab5bd072a)), closes [#29](https://github.com/PrajnaAvidya/prompt-shaper/issues/29) [#24](https://github.com/PrajnaAvidya/prompt-shaper/issues/24)

# [2.1.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v2.0.0...v2.1.0) (2024-11-29)


### Bug Fixes

* fix cli tests/parsing ([947e9a7](https://github.com/PrajnaAvidya/prompt-shaper/commit/947e9a75c8c40435f60fb02716ed110aa789087a))


### Features

* add support for env vars ([fcda4c4](https://github.com/PrajnaAvidya/prompt-shaper/commit/fcda4c4e964d9515c60bd38b948c683be604f49e)), closes [#27](https://github.com/PrajnaAvidya/prompt-shaper/issues/27)
* change default model to gpt-4o ([af0783f](https://github.com/PrajnaAvidya/prompt-shaper/commit/af0783f3d79f4296bdfb03307046f4b9b5849e54))

# [2.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v1.4.0...v2.0.0) (2023-12-04)


### Bug Fixes

* 🐛 don't parse any inputs for raw mode ([01fb77a](https://github.com/PrajnaAvidya/prompt-shaper/commit/01fb77a5200eb065322cf08305b83e6715a063e6)), closes [#21](https://github.com/PrajnaAvidya/prompt-shaper/issues/21)


### BREAKING CHANGES

* 🧨 raw mode flag will no longer automatically trigger interactive mode

# [1.4.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v1.3.0...v1.4.0) (2023-11-08)


### Features

* render loaded files in markdown tags, and attempt to use file extension ([207181d](https://github.com/PrajnaAvidya/prompt-shaper/commit/207181dee81dbbf6845464a2c771ccf3ee4a2f42)), closes [#18](https://github.com/PrajnaAvidya/prompt-shaper/issues/18)

# [1.3.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v1.2.0...v1.3.0) (2023-09-26)


### Bug Fixes

* 🐛 add more whitespace to loaded files ([c5479b2](https://github.com/PrajnaAvidya/prompt-shaper/commit/c5479b276eb4c5676f2c784b97e2a7334453f088))
* 🐛 fix text loading issue ([7efbd48](https://github.com/PrajnaAvidya/prompt-shaper/commit/7efbd48d1ae4d0382c1b7c2019ede4937f633653))
* 🐛 validate path for saveJson and add some more comments ([bb39909](https://github.com/PrajnaAvidya/prompt-shaper/commit/bb39909b7410fe5e154e7033b08528e9f959f38f))


### Features

* parse PromptShaper tags in interactive mode ([e51a4ab](https://github.com/PrajnaAvidya/prompt-shaper/commit/e51a4abfc969da81a1967411dd7039931dacd6ed)), closes [#16](https://github.com/PrajnaAvidya/prompt-shaper/issues/16)

# [1.2.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v1.1.0...v1.2.0) (2023-09-26)


### Features

* add more context to contents of loaded files ([5300e68](https://github.com/PrajnaAvidya/prompt-shaper/commit/5300e6877bc000e1e65396a798b7c93944378717))

# [1.1.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v1.0.0...v1.1.0) (2023-09-20)


### Bug Fixes

* fix process exit, and save response to convo in non interactive mode ([4e63ef9](https://github.com/PrajnaAvidya/prompt-shaper/commit/4e63ef93fbeaeb05249dfb15a0a2ab058ea718cf))


### Features

* add interactive mode ([3ff3863](https://github.com/PrajnaAvidya/prompt-shaper/commit/3ff3863f7a4f4d2903f07c514cc191fba408b505))
* don't require -g if specifying interactive/prompt/model ([b118669](https://github.com/PrajnaAvidya/prompt-shaper/commit/b118669bbd483754d3ef2b2f927ffb8b93bbd6d1))
* load conversation from json/text file, and ability to go straight to interactive ([c10c46b](https://github.com/PrajnaAvidya/prompt-shaper/commit/c10c46bfd7e8aea618a3f834ff730e50a9d97ad6))

# [1.0.0](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.11...v1.0.0) (2023-09-20)


### Bug Fixes

* fix tests in CI ([69ff4d3](https://github.com/PrajnaAvidya/prompt-shaper/commit/69ff4d35d3a97c95b50daa82c063ee519067e96c))


### Features

* add -m to specify model type for openai calls ([4a1707b](https://github.com/PrajnaAvidya/prompt-shaper/commit/4a1707b4a0eaaa09a4161cb9aa1be8b8ac48269a))
* add format option -f ([dc8e749](https://github.com/PrajnaAvidya/prompt-shaper/commit/dc8e749d5802f42f4e1ba7a221f9e0ad25819784))
* add support for -g option to send parsed template to OpenAI ([9316d09](https://github.com/PrajnaAvidya/prompt-shaper/commit/9316d09e626d52677fac9378684766149084cc03))


### BREAKING CHANGES

* JSON var file option was changed

## [0.0.11](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.10...v0.0.11) (2023-08-11)


### Bug Fixes

* release ([d8b7d35](https://github.com/PrajnaAvidya/prompt-shaper/commit/d8b7d3566ab272c1f44d3da761f318d8de2f9b68))

## [0.0.10](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.9...v0.0.10) (2023-08-08)


### Bug Fixes

* update paths ([dadbef6](https://github.com/PrajnaAvidya/prompt-shaper/commit/dadbef6676c8326ebde0bd261714b3efd3695e59))

## [0.0.9](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.8...v0.0.9) (2023-08-08)


### Bug Fixes

* account for bin in isPackaged ([c124267](https://github.com/PrajnaAvidya/prompt-shaper/commit/c124267a086b2fbc54d0e2ad745f99a68d407261))

## [0.0.8](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.7...v0.0.8) (2023-08-08)


### Bug Fixes

* log argv for debug ([d84aac3](https://github.com/PrajnaAvidya/prompt-shaper/commit/d84aac3f5bf5844779ff7b33395d9626f4323fad))

## [0.0.7](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.6...v0.0.7) (2023-08-08)


### Bug Fixes

* use compiled template for build ([436b39c](https://github.com/PrajnaAvidya/prompt-shaper/commit/436b39c2765933949c7c673dbb354a6c7198c367))

## [0.0.6](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.5...v0.0.6) (2023-08-08)


### Bug Fixes

* copy template parser when building ([0b2b56c](https://github.com/PrajnaAvidya/prompt-shaper/commit/0b2b56ca9c163574bdbbf7e3585769e8f7896f51))

## [0.0.5](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.4...v0.0.5) (2023-08-08)


### Bug Fixes

* move peggy from devDependencies to dependencies ([3ab1d23](https://github.com/PrajnaAvidya/prompt-shaper/commit/3ab1d231771b8a95ea5d27cfd98ce6da675510bd))

## [0.0.4](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.3...v0.0.4) (2023-08-08)


### Bug Fixes

* make cli executable ([94753a2](https://github.com/PrajnaAvidya/prompt-shaper/commit/94753a2c6b0ac4f77133bcb6f3b1c8be888dd1d0))

## [0.0.3](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.2...v0.0.3) (2023-08-08)


### Bug Fixes

* syntax ([6ad10e1](https://github.com/PrajnaAvidya/prompt-shaper/commit/6ad10e14d479ced3219003bd340d0ceab80c11b5))

## [0.0.2](https://github.com/PrajnaAvidya/prompt-shaper/compare/v0.0.1...v0.0.2) (2023-08-08)


### Bug Fixes

* don't run checks on main branch (for CI release) ([eccf9b5](https://github.com/PrajnaAvidya/prompt-shaper/commit/eccf9b569996068ba2c3058ca138e99eb4e1fe0c))
