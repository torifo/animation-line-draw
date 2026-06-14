---
name: anim-line-draw
description: "Geometric / pattern scroll-linked animation (pure HTML/CSS/JS, no deps). Use when you need a scroll-linked effect with a geometric / pattern feel — e.g. プロダクト紹介、ステップ解説、図解の段階的提示. スクロール進捗に同期して SVG のストロークが順に引かれていく演出。下へ巻くと描かれ、上へ戻すと逆再生で消える。進捗＝スクロール位置なので、途中で止めれば描きかけのまま留まる。図形はピッカーで切り替え可能（エンブレム / スター / キューブ / スパイラル / 同心円 / 六角 / 三角）。"
---

# anim-line-draw (A·Sc · ライン描画スクロール)

Pure HTML + CSS + vanilla JS, **zero dependencies**. スクロール進捗に同期して SVG のストロークが順に引かれていく演出。下へ巻くと描かれ、上へ戻すと逆再生で消える。進捗＝スクロール位置なので、途中で止めれば描きかけのまま留まる。図形はピッカーで切り替え可能（エンブレム / スター / キューブ / スパイラル / 同心円 / 六角 / 三角）。

## When to use / 使いどころ
- **EN:** a *scroll-linked* effect with a *geometric / pattern* feel.
- **JP:** 幾何学・パターン × スクロール連動。推奨配置: プロダクト紹介、ステップ解説、図解の段階的提示

## Bundled assets / 同梱アセット
This skill folder is the reference implementation — copy from these files:
- `index.html` — full working demo (open to preview)
- `style.css` — component styles
- `script.js` — the self-contained logic
- `README.md` — full human-facing doc (JP): mechanism, accessibility, constraints

## How to apply / 組み込み手順
Copy the component CSS block from `style.css` and the script from `script.js` (no build step), then follow the markup/parameters below.

### 1. 2 ファイルをコピー

`style.css` と `script.js` を移植先へ。外部依存ゼロ。

### 2. マークアップ

```html
<link rel="stylesheet" href="./line-draw.css">

<!-- 背の高いセクション。この区間のスクロールで描かれる -->
<section class="line-draw" data-line-draw>
  <div class="ld-sticky">           <!-- sticky で描画中ずっと画面中央に留まる -->
    <svg class="ld-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      <path   class="ld-path" d="…" />
      <circle class="ld-path ld-accent" cx="400" cy="300" r="96" />
    </svg>
  </div>
</section>

<script src="./line-draw.js"></script>
```

- `.ld-path` は `path` でも `circle`/`line`/`polyline` でも可（`getTotalLength()` が使える要素）
- DOM の並び順 = 描画順
- `.ld-accent` を足すとアクセント色（`--ld-accent`）になる
- セクションの高さ（`--ld-scroll`）が描画に使うスクロール量。長いほどゆっくり描かれる

### 3. 図形を切り替える（ギャラリー型）

`script.js` の `SHAPES` オブジェクトにエントリを足すだけで、ピッカー（`[data-ld-picker]`）にチップが自動生成される。値は SVG フラグメント文字列で、各要素に `class="ld-path"` を付ける（`svg.innerHTML` は SVG 名前空間でパースされる）。

```js
const SHAPES = {
  'エンブレム': circle(400,300,230) + path('M400 60 L640 300 ...') + ...,
  'スター':     path(star(400,300,230,92,5)) + circle(400,300,96,true),
  // 追加例：
  '五角':       path(polygon(400,300,230,5)),
};
```

付属の生成ヘルパー（viewBox `0 0 800 600` 基準）：

| ヘルパー | 生成するもの |
|---|---|
| `path(d, accent?)` | 任意の path |
| `circle(cx, cy, r, accent?)` | 円 |
| `polygon(cx, cy, r, sides, rot?)` | 正多角形 |
| `star(cx, cy, R, r, points?, rot?)` | 星（外接 R / 内接 r） |
| `spiral(cx, cy, turns, spacing, step?)` | アルキメデスのらせん |

- ピッカーで切り替えると、**現在のスクロール進捗のまま** 新しい図形が再描画される（最初から見たいなら一度上へ戻す）
- 図形ごとに要素数が違っても OK（並び順に進捗を均等分割）

## Customize / カスタマイズ
### カスタマイズ可能な CSS 変数
| 変数 | 役割 | デフォルト |
|---|---|---|
| `--ld-stroke` | 線の色 | `#0a0a0a` |
| `--ld-accent` | `.ld-accent` を付けた線の色 | `#ff2d55` |
| `--ld-width` | 線の太さ | `2` |
| `--ld-scroll` | 描画に使うスクロール区間（セクション高さ） | `260vh` |

### よくある調整例

```css
/* ゆっくり丁寧に描く */
.line-draw{ --ld-scroll:400vh; }

/* 極細の製図線 */
.line-draw{ --ld-width:1; --ld-stroke:#0066ff; }
```

---
> Full mechanism, accessibility and known constraints: see **`README.md`** / 詳細・機構・アクセシビリティは README.md 参照。
