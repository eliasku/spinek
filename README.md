# spinek

Автономный TypeScript SDK для **Spine 4.3**. Ядро, WebGL и Canvas перенесены из текущего локального upstream 4.3; Three.js-рендер адаптирован непосредственно под [ek3d](https://github.com/eliasku/ek3d), без зависимости от `three`. Совместимые локальные исправления сохранены; остальные оптимизации из игровых портов 4.2/3.8 не считаются автоматически перенесёнными.

Сравнение версий, полный список исходных `@lib`-зависимостей и приоритеты будущих оптимизаций — в [OPTIMIZE_PLAN.md](./OPTIMIZE_PLAN.md).

## Запуск

Нужен Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` и npm. Для разработки адаптера ek3d репозитории должны лежать рядом: `../ek3d` подключён как локальная dev-зависимость. Самостоятельным приложениям с WebGL/Canvas ek3d не нужен: это optional peer dependency.

```sh
npm install
npm run dev
```

На стартовой странице — три примера с переключением анимаций и паузой:

| URL                     | Рендер                                              | Данные              |
| ----------------------- | --------------------------------------------------- | ------------------- |
| `/examples/webgl.html`  | WebGL, batching, two-color tint, clipping           | `spineboy-pro.skel` |
| `/examples/canvas.html` | Canvas 2D, regions/meshes, slot blending и clipping | `spineboy-pro.json` |
| `/examples/ek3d.html`   | `SkeletonMesh` в сцене ek3d                         | `spineboy-pro.json` |

```sh
npm run build:examples  # Статические примеры → dist-examples/
npm run preview        # Просмотр собранных примеров
npm run typecheck
npm test
npm run check          # Типы, тесты и сборка примеров
```

Инструменты — [Vite+](https://viteplus.dev/guide/): `vp dev`, `vp build`, `vp test`, `vp lint`, `vp fmt`. Зависимости фиксируются в `package-lock.json`; после первого install можно использовать `npm ci`.

## Импорты

```ts
import { AnimationState } from "spinek/core/AnimationState";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import { SkeletonBinary } from "spinek/core/SkeletonBinary";
import { Physics } from "spinek/core/Physics";
import { AssetManager } from "spinek/webgl/AssetManager";
import { SceneRenderer } from "spinek/webgl/SceneRenderer";
import { SkeletonRenderer } from "spinek/canvas/SkeletonRenderer";
import { SkeletonMesh } from "spinek/ek3d/SkeletonMesh";
```

Библиотека распространяется исходными TypeScript-файлами: `exports` сопоставляет `spinek/*` с `src/*.ts`, включая вложенные каталоги. Каждый символ импортируется из определяющего его файла, без расширения; корневого entry point и barrel-файлов нет. Нужен TypeScript-aware bundler. В npm-пакет входят весь `src/`, документация и `LICENSE`; предсобранные JS, upstream и примеры в пакет не входят.

Все перечисления объявлены как `const enum`: используйте обращения `Enum.Member`, а не `Object.values(Enum)` или динамический `Enum[key]`. JSON и atlas разбирают строковые значения через явные внутренние словари; числовые значения и поддерживаемый регистр имён сохранены.

Приватные общие буферы, таблицы и счётчики хранятся в module scope: `const` для непереназначаемых ссылок, `let` для изменяемых значений. Буферы по-прежнему переиспользуются всеми экземплярами; публичные `static` API остаются на классах.

`Matrix4` использует один временный `Float32Array(16)` на модуль вместо буфера в каждом экземпляре; поле `temp` удалено. Переопределённый `set()` должен скопировать полученный буфер до запуска других матричных операций.

Полные запускаемые варианты загрузки atlas, JSON/binary, управления анимацией и освобождения ресурсов находятся в `examples/`.

### ek3d

```ts
import { AtlasAttachmentLoader } from "spinek/core/AtlasAttachmentLoader";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import type { TextureAtlas } from "spinek/core/TextureAtlas";
import { AssetManager } from "spinek/ek3d/AssetManager";
import { SkeletonMesh } from "spinek/ek3d/SkeletonMesh";

const assets = new AssetManager("/assets/");
assets.loadTextureAtlas("spineboy.atlas");
assets.loadJson("spineboy-pro.json");
await assets.loadAll();

const reader = new SkeletonJson(new AtlasAttachmentLoader(assets.require("spineboy.atlas") as TextureAtlas));
const skeletonData = reader.readSkeletonData(assets.require("spineboy-pro.json"));
const mesh = new SkeletonMesh({ skeletonData });
scene.add(mesh); // ek3d Scene
mesh.state.setAnimation(0, "walk", true);

// В цикле рендера, deltaSeconds в секундах:
mesh.update(deltaSeconds);
renderer.render(scene, camera);

// При удалении сцены:
scene.remove(mesh);
mesh.dispose(); // Геометрия и материалы; atlas можно разделять между mesh.
assets.dispose(); // Atlas и текстуры.
```

По умолчанию используется unlit `SkeletonMeshMaterial`, не требующий регистрации built-in shader в ek3d renderer. `twoColorTint: false` отключает dark-color атрибут. `materialFactory` позволяет использовать собственный материал с `map`; для встроенных материалов ek3d соответствующий shader нужно передать в `WebGLRenderer({ shaders: ... })`.

## Границы совместимости

- Поддерживаются экспорты **Spine Editor 4.3**, не 4.2. Источник — локальный [upstream, commit `175a1e05073a406f305bde2621c065b8c2256c42`](https://github.com/EsotericSoftware/spine-runtimes/tree/175a1e05073a406f305bde2621c065b8c2256c42/spine-ts): npm runtime 4.3.13 плюс находящиеся в checkout unreleased-изменения Canvas. Примерные assets из этого же checkout экспортированы Editor 4.3.75-beta; это версия редактора, не npm-пакета.
- API переключён на native 4.3: `bone.pose/appliedPose`, `slot.pose/appliedPose`, `drawOrder.appliedPose`, единые constraints и sliders, sequence-based attachments, convex/inverse clipping. Устаревшие `MixBlend`, `MixDirection`, `Updatable`, `HasTextureRegion` и старые прямые поля не поддерживаются compatibility-обёртками. Данные старых версий нужно переэкспортировать.
- Игровых `@lib`-импортов нет. Арифметика `Color.set/add` остаётся без автоматического clamp, как в исходном оптимизированном порте; это намеренное отличие от upstream Color. `getBoundsRect()` возвращает `{ x, y, width, height }`.
- Binary reader учитывает `byteOffset` и `byteLength` у переданного `Uint8Array`, включая Node.js Buffer и subarray.
- `AssetManager.disposeAsset(path)` принимает путь относительно своего `pathPrefix`, как `load/get/require`; ресурсы с префиксом освобождаются без повторного добавления префикса.
- В Canvas triangle mode поддерживаются meshes, clipping (включая inverse) и ближайшие native composite equivalents для slot blending. Включайте `renderer.triangleRendering = true`, как в примере. RGB/two-color tint не поддерживается; blending на прозрачном фоне может отличаться от WebGL. Image mode предназначен для regions.
- ek3d также поставляется исходниками. В этой рабочей копии используется локальный `../ek3d`; импорты `spinek/ek3d/*` требуют установленный ek3d, ядро и WebGL/Canvas — нет.
- Адаптер ek3d предоставляет native `mesh.skeletonPhysics` с opt-in наследованием перемещения и вращения; по умолчанию коэффициенты равны нулю. Материалы используют `forceSinglePass`, чтобы сохранить slot draw order при отрицательных масштабах.
- Примеры работают в браузере. Browser AssetManager использует DOM APIs и `requestAnimationFrame`; ядро можно использовать без DOM.

## Проверки

`tests/core.test.ts` загружает реальные JSON и binary fixtures 4.3, проверяет анимацию, world vertices, sequence UVs, bounds, чтение binary из subarray, освобождение prefixed assets по reference count и разделение constrained/applied poses. Отдельно проверяются строковые режимы JSON, mipmap aliases атласа и воспроизведение всех семи sequence modes. `tests/ek3d.test.ts` проверяет изменение геометрии, material groups и освобождение ресурсов для one-/two-color режимов без GPU.

`tests/matrix4.test.ts` проверяет порядок умножения, умножение матрицы на себя и независимость результатов разных экземпляров при транспонировании, инверсии и ошибке инверсии вырожденной матрицы.

`npm run lint` не находит неиспользуемых импортов. Оставшиеся предупреждения относятся к параметрам, стилю перенесённого кода и upstream enum aliases; их массовая переработка не входит в чистку импортов.

## Лицензия

Ядро, рендеры и демонстрационные Spine-данные подчиняются [Spine Runtimes License Agreement](./LICENSE), а не MIT-лицензии ek3d. Условия включают требования к лицензии Spine Editor и обязательное сохранение copyright/license при распространении. Лицензия примеров также находится в `public/assets/LICENSE`.
