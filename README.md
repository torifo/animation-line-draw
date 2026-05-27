# A·Sc · ライン描画スクロール

> スクロール進捗に同期して SVG のストロークが順に引かれていく演出。下へ巻くと描かれ、上へ戻すと逆再生で消える。進捗＝スクロール位置なので、途中で止めれば描きかけのまま留まる。図形はピッカーで切り替え可能（エンブレム / スター / キューブ / スパイラル / 同心円 / 六角 / 三角）。

**Live demo**: `./index.html`

## 概要

| 項目 | 内容 |
|---|---|
| ジャンル | A · 幾何学・パターン |
| 用途 | Sc · スクロール連動 |
| 主な参考 | Apple（AirPods Pro 等の製品ページ）, Codrops |
| 依存 | なし（Pure HTML + CSS + Vanilla JS） |
| 推奨配置 | プロダクト紹介、ステップ解説、図解の段階的提示 |

## 仕組み（位置ベース）

1. 各 `.ld-path` の全長を `getTotalLength()` で測り、`stroke-dasharray = 全長`、`stroke-dashoffset = 全長`（＝未描画）にする
2. スクロールごとに進捗 `progress = -section.top / (section.height - viewport)` を 0〜1 で算出
3. 要素を DOM の並び順に均等分割し、要素 `i` は区間 `[i/n, (i+1)/n]` で `dashoffset` を全長 → 0 へ。先頭の線から順に描かれる
4. 上へ戻すと `progress` が下がり、`dashoffset` が戻る＝逆再生で消える

> wave-parallax（B·Sc）はスクロール「速度」ベースだったが、ライン描画は「どこまで描けたか＝スクロール位置」が本質なので**位置ベースが正しい**。両者は意図的に別方式。

## 組み込み手順

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

## カスタマイズ可能な CSS 変数

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

## アクセシビリティ

`prefers-reduced-motion: reduce` のとき、スクロール連動を行わず最初から全線を描画済みで静止表示する。

## パフォーマンス

- スクロール更新は `requestAnimationFrame` で 1 フレーム 1 回に間引き
- `IntersectionObserver` でセクションが視野外のとき更新停止
- 全長は userspace（viewBox）基準なので表示サイズが変わっても再測定不要

## 制約 / 既知の挙動

- `getTotalLength()` が使えない要素（`rect`/`text` 等）は非対応。`path` 等に変換して使う
- 多数の長い path を同時に描く場合、`stroke-dashoffset` 更新コストに注意
- 進捗は「セクション内のスクロール位置」に紐付くため、セクションが画面より低いと描き切れない。`--ld-scroll` は `100vh` より十分大きく

## ライセンス

ANIMATION DESIGN STUDY の一部として公開（コピペ自由）。
