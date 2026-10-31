# План оптимизаций spinek / Spine 4.3

## Статус и источники сравнения

SDK переведён на **native Spine 4.3**, а не на 4.2 с подменённым номером версии. База — локальный `upstream/spine-runtimes`, commit [`175a1e05073a406f305bde2621c065b8c2256c42`](https://github.com/EsotericSoftware/spine-runtimes/tree/175a1e05073a406f305bde2621c065b8c2256c42/spine-ts). В checkout указана npm-версия 4.3.13 и есть unreleased-изменения Canvas. Fixtures Spineboy экспортированы Editor 4.3.75-beta; версия редактора и версия npm runtime — разные величины.

Для сравнения официальных поколений загружена ветка 4.2, commit [`5cb78e77d3711ddcd80c7bd043bb11cf70fcc88c`](https://github.com/EsotericSoftware/spine-runtimes/tree/5cb78e77d3711ddcd80c7bd043bb11cf70fcc88c/spine-ts). Это официальный baseline 4.2, **не установленный git-предок пользовательского порта**: точный исходный commit порта неизвестен. [GitHub compare 4.2→4.3](https://github.com/EsotericSoftware/spine-runtimes/compare/5cb78e77d3711ddcd80c7bd043bb11cf70fcc88c...175a1e05073a406f305bde2621c065b8c2256c42) оказался слишком большим для GitHub UI; выполнен локальный двухсторонний diff этих source trees. Семантические изменения сверены с [официальным changelog](https://github.com/EsotericSoftware/spine-runtimes/blob/175a1e05073a406f305bde2621c065b8c2256c42/spine-ts/CHANGELOG.md).

Обозначения путей:

- `L` = `~/dats/cricket-crash/src/lib` — исходные пользовательские порты; файлы не изменялись.
- `L/spine4` — пользовательское ядро поколения 4.2.
- `L/spine` — дерево, называемое портом 3.8. Его **ядро и draw-подсистема нельзя считать одной чистой версией**: `draw/SkeletonRenderer.ts:1–14` и `draw/SkeletonClipping.ts` уже импортируют классы из `spine4`.
- `src/` — текущий автономный SDK 4.3. Пути и символы ниже относятся к нему, если не указан `L`.

Ниже — **план, а не уже достигнутое ускорение**. Профилирование и сравнительные бенчмарки не выполнялись. Механизмы ожидаемой экономии — гипотезы, основанные на конкретных аллокациях, копированиях и алгоритмах в коде; процентов ускорения здесь нет.

## Что изменилось в 4.3 и не подлежит механическому откату

| Область | Порт 4.2 / старое ядро | Требование native 4.3 |
| --- | --- | --- |
| Состояние | Прямые поля костей и слотов | Setup/pose/constrained/applied состояния: `Posed`, `BonePose`, `SlotPose`; рендер читает `appliedPose` |
| Draw order | Массив слотов | `DrawOrder.pose` и `DrawOrder.appliedPose`, включая изменение constraints/sliders |
| Constraints | Раздельные списки и типоспецифичные индексы | Единый `SkeletonData.constraints`, native pose-классы и sliders |
| Timeline API | `MixBlend` / `MixDirection` | `MixFrom`, `add`, `out`, `appliedPose`; additive tracks и multiple property IDs |
| Attachments | `region`, attachment-level UV и offsets | Non-null `Sequence`, slot sequence index, предварительно вычисленные sequence UV/offsets |
| Clipping | Старый decomposed-polygon путь | Convex fast path, inverse clipping, текущие lifecycle/fallback правила |
| Физика | Старые типы и прямые поля | Отдельный `Physics`, `SkeletonPhysicsMovement`, opt-in наследование 3D-перемещения в ek3d |
| Canvas | Ограниченный старый triangle renderer | Текущий checkout использует `SkeletonRendererCore`, clipping и native composite equivalents для blend modes |

В текущем переносе сохранены совместимые локальные изменения: корректный `Uint8Array.byteOffset/byteLength`, исправление prefix-relative освобождения assets, намеренно unclamped `Color.set/add`, прямой ek3d-адаптер и исправленные shader hooks для уже раскрытых chunks ek3d. Остальные реализации ядра 4.2 заменены native 4.3; наличие оптимизации в старом дереве **не означает**, что она уже есть в новом SDK.

## Какие `@lib` использовал исходный spine4

### Активные прямые импорты

Канонические имена ниже объединяют варианты с `.js` и без расширения. В `spine4/core` были только два разных `@lib`-модуля; ещё один встречался в demo.

| Модуль | Потребители | Роль и решение в SDK |
| --- | --- | --- |
| `@lib/math/Color` / `@lib/math/Color.js` | `core/{BoneData,Skeleton,SkeletonBinary,SkeletonClipping,SkeletonJson,Skin,Slot,SlotData}.ts`; `core/attachments/{BoundingBoxAttachment,ClippingAttachment,HasTextureRegion,MeshAttachment,PathAttachment,PointAttachment,RegionAttachment}.ts` — 15 мест | Mutable RGBA. Теперь автономный `Color` из `src/core/Utils.ts`; сохранено отсутствие автоматического clamp у set/add. Игровые convenience-методы не импортируются целиком. |
| `@lib/math/Vec2` | `core/Bone.ts:5` | Вектор для преобразований координат. Заменён native `Vector2`; это не SIMD и не Float32 storage. |
| `@lib/assets/AssetMeta` → `SpineAssetMeta` | `demo.ts:1`, поле конструктора `demo.ts:84` | Игровые метаданные. Demo — заглушка с no-op load/draw; в SDK не перенесён. |

### Относительные импорты, которые тоже связывали spine4 с игрой

Поиск только `@lib` не показывал всю зависимость:

| Исходный импорт | Потребители | Скрытая связь |
| --- | --- | --- |
| `../../math/Rect.js` | `core/Skeleton.ts:30` | Игровой `Rect` использует `Mat2d` и math/utils; его размеры называются `w/h`. В SDK `getBoundsRect()` возвращает native `{x,y,width,height}`. |
| `../../math/Vec2.js`, `../../../math/Vec2.js` | `Skeleton.ts`, `TransformConstraint.ts`, `attachments/PointAttachment.ts` | Ещё три места использования игрового Vec2 помимо прямого alias в Bone. |
| `../../spine/core/SpineAtlas` | `core/AtlasAttachmentLoader.ts:10` | Игровой atlas с `lookup` и `pageSources`, не официальный TextureAtlas. |
| `../../../spine/core/SpineAtlas.js` → `TextureRegion` | `attachments/{HasTextureRegion,MeshAttachment,RegionAttachment,Sequence}.ts` | Игровые `w/h`, `rotated`, concrete Texture; транзитивный type-import `@lib/rendering/texture`. |
| `../../../spine/core/attachments/AttachmentType` | База Attachment и реализации BoundingBox/Clipping/Mesh/Path/Point/Region | Общий runtime tag enum со старым деревом. В native 4.3 такой публичной классификации нет; приватный enum binary-format не является заменой. |

`L/math/Color.ts`, `Vec2.ts`, `Rect.ts` и `SpineAtlas.ts` также используют ambient `f32/u32/i32/GLenum`. Числовые aliases из `L/global.d.ts` — обычный JavaScript `number`, без автоматического округления до float32 или packed storage. `Rect → Mat2d → Vec2` — ещё одна причина не затягивать весь math-пакет ради bounds.

### Закомментированные aliases в `spine4/demo.ts`

Это **не активные зависимости**. Для полноты исходного инвентаря:

- `@lib/spine/draw/SkeletonRenderer` → `SkeletonRenderer`;
- `@lib/spine/draw/programs` → `newTwoColoredTextured`;
- `@lib/draw/state` → `setProgram`;
- `@lib/rendering/program` → type `Program`;
- `@lib/spine/core/SpineAtlas` → `SpineAtlas`;
- `@lib/spine/core/SpineAtlasJson` → type `SpineAtlasJson`;
- `@lib/spine/core/SpineAtlasLoader` → `createSpineAtlas`, `reloadSpineAtlas`;
- `@lib/spine4/core/AnimationStateData` и `@lib/spine4/core/AnimationState` — aliases самого порта, а не внешнего движка.

В текущих `src/`, `examples/` и `tests/` зависимостей от `@lib` нет.

## Сравнение с деревом spine / «3.8»

### Архитектура и реальные оптимизационные приёмы

| Приём | Где в пользовательском дереве | Что есть в 4.3 / вывод |
| --- | --- | --- |
| Разделение Animation / TrackEntry / timelines | `L/spine/core/animation/Animation.ts`, `TrackEntry.ts`, `timelines/*` | Полезный образец организации. В 4.3 классы сгруппированы в `Animation.ts`; разбиение само по себе не доказывает выигрыш FPS или bundle size. |
| Numeric attachment tags | `core/attachments/RegionAttachment.ts`, `Skeleton.ts`, `Skin.ts`; hybrid `draw/SkeletonRenderer.ts:75–101` | Кандидат на единый discriminated union, только после профиля. Native классы, custom loaders и copy/linked-mesh/sequence поведение должны сохраниться. |
| Поиск ключей бинарным поиском | `L/spine/core/utils/Utils.ts:8–30` | Native `Timeline.search` линейный. Контракты различаются: старый helper возвращает следующий ключ, native — текущий/предыдущий offset. |
| Индекс atlas | `L/spine/core/SpineAtlas.ts`, `SpineAtlasLoader.ts`; оба старых attachment loader | Native `TextureAtlas.findRegion` линейный; есть потенциальный выигрыш при загрузке, не обязательно в кадре. |
| Общий TextDecoder | `L/spine/core/BinaryInput.ts:54–87`, `L/utils/decodeUtf8.ts` | Кандидат на измерение parse-time; UTF-8/surrogate semantics нужно доказать на формате 4.3. |
| Shared batching и packed colors | `L/draw/draw2d.ts:440–470`, `draw/state.ts` | Native уже батчит texture/blend state, а RendererCore уже хранит packed colors. Игровой global GL не нужен SDK. |
| Clipping scratch | `L/spine/draw/SkeletonClipping.ts` | Старый clipper переиспользует scratch, но hybrid renderer всё равно делает `new Float32Array(clipper.clippedVertices)` на clipped draw. Это не allocation-free эталон. |
| Timeline dispatch | `L/spine/core/animation/AnimationState.ts` | Там по-прежнему есть `instanceof`; утверждение «в 3.8 всё переведено на tags» неверно. |

### Другие внешние aliases в старом дереве

Это активные зависимости **вне собственного `spine/core`**, а не рекомендация импортировать их в SDK:

| Модуль | Потребители / назначение |
| --- | --- |
| `@lib/math/Color`, `@lib/math/Vec2` | Данные, transforms, attachments, hybrid renderer/clipper; часть imports type-only |
| `@lib/math/utils` | `signum`, `clamp` в animation/timelines |
| `@lib/dev/utils` | Assertions в моделях, loaders и animation. `assert` зависит от `__DEBUG_MODE__`: эту политику нельзя переносить на trust boundaries SDK. |
| `@lib/utils/decodeUtf8` | BinaryInput и singleton TextDecoder |
| `@lib/draw/BlendMode` | Игровой blend enum в SlotData |
| `@lib/rendering/texture` | Type Texture в atlas и renderer; сам runtime texture привязан к игровому GL |
| `@lib/draw/sprite`, `@lib/system` | Загрузка текстур, разрешений и глобальный GL в SpineAtlasLoader |
| `@lib/draw/draw2d.js`, `@lib/rendering/program` | Общий batch sink и shader programs |
| `@lib/spine4/core/{Skeleton,Slot}` | Hybrid renderer/clipper, Slot type-only |
| `@lib/spine4/core/attachments/{ClippingAttachment,MeshAttachment,RegionAttachment}` | Hybrid draw-подсистема; варианты с `.js` и без него |

Внутренние `@lib/spine/core/*` aliases обозначают собственные модули старого runtime: модели/constraints, `utils/{Utils,math,Pool,IntSet,Interpolation}`, `animation/{Animation,AnimationStateData,TrackEntry,EventType}`, `animation/timelines/*`, `attachments/*`. Их относительные импорты не создают зависимости на игровой движок. Отдельно hybrid renderer импортирует game draw state и два разных BlendMode через относительные пути.

## Будущие оптимизации: приоритеты

P1 — сначала устранять видимые копии/аллокации и повторный поиск; P2 — алгоритмы и типовые границы после замеров; P3 — более широкие API/ABI эксперименты, только при доказанной необходимости. Все пункты ниже пока не внедрены.

### P1. Убрать временный Float32Array на clipped draw в WebGL

- **Доказательство:** `src/webgl/SkeletonRenderer.ts:171–175` конвертирует `clipper.clippedVertices` в новый Float32Array. `PolygonBatcher.draw` принимает ArrayLike и синхронно копирует данные в собственный batch.
- **Изменение:** сначала проверить прямую передачу существующего массива без transformer. Для transformer, если нужен именно typed buffer, использовать renderer-owned grow-only scratch с явными used counts.
- **Ожидаемый механизм [INFERENCE]:** исчезают временный backing buffer и дополнительная полная конверсия на затронутый draw; необходимая копия в batch остаётся.
- **Не сломать:** lifetime до синхронного потребления, transformer mutation/count/stride semantics, one-/two-color tint, PMA, slot range, clipping fallback. Не заменять clipper старым алгоритмом 3.8.
- **Критерий:** совпадение vertices/UV/colors/indices и изображения для ordinary/inverse/concave clips, inside/outside triangles и transformer on/off; allocation count и bytes copied после прогрева.

### P1. Сократить staging-копии SkeletonRendererCore

- **Доказательство:** `render` копирует данные в command buffers, ветка number[] использует `indices.slice`; `batchSubCommands` копирует их ещё раз даже для singleton group (`src/core/SkeletonRendererCore.ts:195–215,227–263,266–316`).
- **Изменение:** начать с устранения временного index slice и повторной сборки singleton. Прямое накопление в финальные compatible batches — только если профиль оправдывает более крупное изменение.
- **Ожидаемый механизм [INFERENCE]:** меньше промежуточных массивов и memory traffic, особенно в Canvas triangle mode.
- **Не сломать:** срок жизни команды до следующего render, `next`, numVertices/numIndices, slot Z, порядок, texture/blend/color boundaries и index limits. Нельзя возвращать shared scratch как стабильный snapshot.
- **Критерий:** differential comparison command topology и используемых элементов buffers; singleton/multiple groups, пустой clipping result, меняющиеся stride/размеры и большие batches. Измерять CPU preparation отдельно от Canvas rasterization.

### P1. Индексировать atlas lookup без изменения семантики

- **Доказательство:** `L/spine{,4}/core/...AtlasAttachmentLoader` использует lookup; `src/core/TextureAtlas.ts::findRegion` сканирует regions, в том числе при загрузке sequence frames.
- **Изменение:** выбрать индекс с явным mutation/lifetime contract; публичный `atlas.regions` нельзя молча считать immutable. Не переносить игровой compact JSON atlas, pageSources и resolution loader.
- **Ожидаемый механизм [INFERENCE]:** меньше повторных scans при загрузке больших atlas/sequence sets; это load-time задача.
- **Не сломать:** upstream возвращает **первый** duplicate name, старый dictionary перезаписывал **последним**; безопасные ключи вроде `__proto__`, отсутствующие regions, `allowMissingRegions`, rename/reorder/mutation, page/PMA/filter/wrap metadata и rotations.
- **Критерий:** одинаковое разрешение имён и ошибок; parse/load latency вместе с памятью индекса на разных размерах atlas.

### P2. Проверить binary search для длинных timelines

- **Доказательство:** `L/spine/core/utils/Utils.ts::binarySearch` против `src/core/Animation.ts::Timeline.search`.
- **Изменение:** реализовать поиск с **native контрактом** и сравнить с linear на реальном распределении длины tracks. Threshold для коротких массивов вводить только по результатам замеров.
- **Ожидаемый механизм [INFERENCE]:** меньше сравнений на длинных tracks; короткие могут стать медленнее.
- **Не сломать:** stride, точное попадание, одинаковые времена, первый/последний ключ, loop/reverse/random seek. Не хранить mutable cursor в shared Timeline: несколько skeleton instances и sliders имеют независимые времена.
- **Критерий:** совпадение frame offsets, poses и event firing; отдельные short/medium/long-track замеры, последовательный playback и seeks.

### P2. Проверить переиспользуемый TextDecoder для binary strings

- **Доказательство:** `L/spine/core/BinaryInput.ts::readString` использует `L/utils/decodeUtf8`; native `SkeletonBinary.ts::BinaryInput.readString` собирает строку через fromCharCode.
- **Изменение:** изолированный decode experiment без переписывания всего парсера.
- **Ожидаемый механизм [INFERENCE]:** меньше JavaScript string concatenation; выгода для коротких строк не доказана.
- **Не сломать:** реальное Spine encoding, non-BMP/surrogates, BOM, malformed/truncated payload, null/empty prefixes и cursor advancement. Старый reader игнорирует typed-array byteOffset — копировать его constructor нельзя; этот дефект уже исправлен в SDK.
- **Критерий:** identical JSON/binary results, multilingual/event strings и sliced buffers; измерять whole-file parse latency и allocation, а не только decoder microbenchmark.

### P2. Докрутить типовые границы, не добавляя runtime-конвертеры

- **Доказательство:** старый порт имеет отдельные Timeline/TrackEntry модули и интерфейсы; в 4.3 `SkeletonJson.readSkeletonData` ещё принимает any, `AssetManager.require` возвращает широкий AssetData, а async loading helpers частично теряют точный тип. В `examples/common.ts` поэтому нужны assertions для atlas/binary cache entries.
- **Изменение:** уточнять типы JSON sections и результаты load/async API по месту использования; уменьшать any и casts через реальные discriminants/типы, не через универсальный wrapper, schema engine или второй набор моделей.
- **Ожидаемый результат:** compile-time contract и поддерживаемость; ускорение кадра этим не заявляется.
- **Не сломать:** все 4.3 JSON features, custom attachment loaders, nullable поля и runtime validation. Игровые f32/u32 aliases не дают runtime-ускорения. Debug-only asserts не должны заменять ошибки на входных данных.
- **Критерий:** strict consumer compilation, полезные positive/negative consumer scenarios, прежняя runtime обработка неправильных данных; не тестировать исходный текст или forwarding.

### P3. Оценить tags + discriminated unions для attachments

- **Доказательство:** readonly tags есть в старых attachments; native renderer/bounds/skin paths проверяют классы. Даже spine4 не полностью отказался от instanceof.
- **Изменение:** только если discrimination заметна в профиле — единый readonly tag и согласованные union/type guards во всех нужных местах. Native classes и custom attachment extensibility сохраняются.
- **Риск:** дополнительное поле меняет shape объектов, instanceof уже может хорошо оптимизироваться JIT; несовпадающая классификация разрушит skin copies, linked meshes и sequences. Не смешивать runtime tag с file-format enum.
- **Критерий:** mixed attachment workloads в поддерживаемых движках плюс все renderer/bounds/path/skin/copy/custom-loader переходы. Без доказанного выигрыша оставить instanceof.

### P3. Разнести timeline-классы по файлам, если это упрощает поддержку

- **Доказательство:** структура `L/spine/core/animation/timelines/*` удобнее для навигации; native `Animation.ts` содержит всё вместе.
- **Изменение:** механическое разбиение без смены семантики и с теми же публичными exports; не переносить старые apply signatures и packed numeric property IDs.
- **Риск:** 4.3 допускает несколько property IDs и draw-order-folder/slider взаимодействия. Старый sparse boolean-array ID scheme — не drop-in замена. Tree shaking и ускорение TypeScript надо измерять, не обещать.
- **Критерий:** идентичность публичных классов между entry points, отсутствие cycles, API/declaration parity и прежняя animation semantics; bundle size — по реальным consumer builds.

### P3. Packed WebGL vertex colors и локальная оптимизация pools — только после профиля

- **Доказательство:** игровой draw2d пакует colors, native RendererCore уже использует Uint32Array, но WebGL/ek3d имеют свой vertex/shader ABI. CommandPool уже существует, хотя ищет подходящий buffer, использует splice и создаёт subarray views при reuse.
- **Изменение:** отдельно оценить packed color attributes и отдельно pool/view allocation; не вводить новый generic pool или менять ABI пакетом «заодно».
- **Риск:** normalized attributes, PMA/tint-black, unclamped Color semantics, resource restore, WebGL и ek3d shaders должны согласоваться. Module-global scratch из старого renderer ухудшает reentrancy и isolation нескольких экземпляров.
- **Критерий:** bytes uploaded, draw calls, CPU/GC и pixel/geometry parity; стоимость дополнительной сложности должна оправдываться измерением.

## Что уже есть и не нужно «оптимизировать» повторно

- Typed frame/curve storage и renderer-owned reusable world vertices.
- TrackEntry, bounds polygon, triangulator и render-command pools; reset support уже есть.
- Typed unpacked clipping buffers, convex fast path и inverse clipping.
- Предварительный расчёт sequence UV/offsets.
- Texture batching, кэширование blend state и PMA additive batching в WebGL.
- Packed light/dark colors и adjacent-compatible batching в RendererCore.
- Canvas triangle clipping/blending в текущем checkout; это уже перенесено, а не будущая задача.
- `forceSinglePass` и opt-in movement inheritance в адаптере ek3d.

Создание новых subarray views всё ещё является созданием объектов, даже если backing buffer переиспользуется. И наоборот, наличие pool не доказывает отсутствие лишних копий.

## Проверка каждой будущей оптимизации

1. Контроль — **текущий 4.3 baseline** с теми же fixtures и намеренными локальными отличиями, а не 3.8 runtime на несовместимых данных. Старое дерево — источник техник, не честная performance control group.
2. Отдельно измерять parse/load, animation/constraints, geometry/clipping preparation, upload/submission и rasterization. Сравнивать warmed-up runs на одинаковых браузере, GPU, viewport/DPR и данных; публиковать методику и сырые результаты.
3. Workloads: обычные regions; weighted/deformed/linked meshes; sequences с rotation/trim; inverse/concave clipping; переключения skins/attachments; additive/mix/reverse/seeks; sliders и physics modes; несколько экземпляров с общей SkeletonData.
4. Измерения: CPU median/tail, allocation count/bytes и GC, bytes copied/uploaded, draw calls, время загрузки и память. Не выводить процент ускорения из количества удалённых строк или из одного микробенчмарка.
5. Корректность: deterministic pose/geometry/UV/index comparison, видимые изображения и события анимации, прозрачные targets/PMA/blend modes, изменяющиеся размеры buffers и lifetime/resources. Permanent test — для конкретного consumer-visible regression, не для текста реализации.
6. После доказательства — минимальный локальный diff. Если оптимизация не помогает или требует несоразмерного усложнения, её не внедрять.

На момент составления плана пройдены strict typecheck, 7 behavior tests, сборки SDK/примеров и browser smoke трёх renderer paths на 4.3. Это доказательство работоспособности выбранных путей, **не exhaustive-проверка всех возможностей 4.3 и не бенчмарк**.
