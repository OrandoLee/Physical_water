# 3D 物理水体沙箱

一个可运行、可部署、可 iframe 嵌入的 Three.js 3D 水体实验 Demo。场景包含透明玻璃水箱、可交互水面、简化浮力与碰撞、物体投放、水位上升、溢流、水下折射视觉和实时指标面板。

## 功能特性

- Vite + TypeScript + Three.js
- 透明玻璃水箱、动态水面、光照、阴影和轻微 Bloom
- 物体入水时同步产生水面扰动
- 更真实的水面折射感、水下体积色、焦散光纹和密度雾化
- 10 种可投放物体：木球、金属球、玻璃块、浮标、重石块、泡沫块、橡胶圈、陶瓷胶囊、油滴软球、自定义材质
- 调试面板：水体预设、波纹倍率、水面线框、自定义物体颜色/密度/材质
- 水体预设：清澈实验水、浅海蓝绿、深水高折射、浑浊高密度、盐水强浮力
- 实时指标面板：水面高度、波动能量、最大浪高、水体密度、物体数量、溢流深度
- 简化物理：重力、浮力、阻尼、沉浮、边界约束、物体碰撞
- 支持独立页面和 `?embed=1` 嵌入模式
- 预留 `postMessage` 控制接口：暂停、恢复、重置、加载完成
- GitHub Actions 自动构建并发布到 GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

开发服务器启动后，打开终端中显示的本地地址即可。

## 构建与预览

```bash
npm run build
npm run preview
```

如果要直接双击文件预览，请先运行：

```bash
npm run build
```

然后打开：

```txt
dist/index.html
```

仓库根目录的 `index.html` 是 Vite 源码入口，直接双击时只会显示提示页；正式 Demo 请通过 `npm run dev` 或 `dist/index.html` 打开。

## GitHub Pages 部署

当前 `vite.config.ts` 使用：

```ts
base: './'
```

相对资源路径适合 GitHub Pages 项目子路径，也适合本地直接打开 `dist/index.html`。

线上地址通常是：

```txt
https://orandolee.github.io/Physical_water/
```

仓库内置 `.github/workflows/deploy.yml`，推送到 `main` 后会执行：

- `npm ci`
- `npm run build`
- 上传 `dist`
- 使用官方 GitHub Pages Actions 发布

## iframe 嵌入

普通嵌入：

```html
<iframe
  src="https://orandolee.github.io/Physical_water/"
  title="3D 物理水体沙箱"
  loading="lazy"
  allow="fullscreen"
  allowfullscreen
></iframe>
```

推荐嵌入模式：

```html
<iframe
  src="https://orandolee.github.io/Physical_water/?embed=1"
  title="3D 物理水体沙箱"
  loading="lazy"
  allow="fullscreen"
  allowfullscreen
></iframe>
```

## 操作说明

- 点击画面激活沙箱
- `WASD` 移动视角
- 鼠标拖动或右键拖动观察方向
- 滚轮调节观察距离
- 点击或拖动水面制造波纹
- `Shift + 左键` 制造更强扰动
- 从底部物品栏拖拽物体投放到水箱中
- 点击右上角“调试”打开参数面板
- `ESC` 释放控制

## postMessage 接口

父页面可以向 iframe 发送：

```ts
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_PAUSE' }, '*')
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_RESUME' }, '*')
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_RESET' }, '*')
```

Demo 初始化完成后会发送：

```ts
window.parent?.postMessage({ type: 'WATER_SANDBOX_READY' }, '*')
```

这些接口是可选增强，不依赖父页面也能正常运行。

## 文件结构

```txt
src/
  main.ts
  styles.css
  scene/
    SceneApp.ts
    CameraController.ts
    Lighting.ts
    PostProcessing.ts
  water/
    UnderwaterVisuals.ts
    WaterMaterial.ts
    WaterPresets.ts
    WaterSurface.ts
  objects/
    FloatingObject.ts
    ObjectFactory.ts
    ObjectTypes.ts
  ui/
    ActivationOverlay.ts
    DebugPanel.ts
    Hud.ts
    InventoryBar.ts
    MetricsPanel.ts
  utils/
    constants.ts
    math.ts
```
