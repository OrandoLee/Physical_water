# 3D 水体沙盒

一个可运行、可部署、可 iframe 嵌入的 Three.js 3D 水体沙盒 Demo。场景包含透明玻璃水箱、可交互水面、简化浮力与碰撞、物体投放、水位上升和溢出效果，适合作为个人网站里的 LAB / Demo 展示项目。

## 功能特性

- Vite + TypeScript + Three.js
- 透明玻璃水箱、蓝绿色水体、光照、阴影和轻微 Bloom
- 可交互水面高度场：点击、拖拽、物体入水都会产生波纹
- WASD 移动视角，鼠标拖动观察方向，滚轮调节距离
- 底部物品栏：木球、金属球、玻璃块、黄色浮标、重石块
- 简化物理：重力、浮力、阻尼、沉浮、边界约束、物体碰撞
- 多物体排水导致整体水位上升，达到水箱口沿后出现溢出效果
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

相对资源路径既适合 GitHub Pages 项目子路径，也适合本地直接打开 `dist/index.html`。

线上地址通常是：

```txt
https://orandolee.github.io/Physical_water/
```

如果部署到根域名、Vercel 或 Netlify 根路径，也可以改为：

```ts
base: '/'
```

仓库内置 `.github/workflows/deploy.yml`，推送到 `main` 后会执行：

- `npm ci`
- `npm run build`
- 上传 `dist`
- 使用官方 GitHub Pages Actions 发布

如果你使用 `gh-pages` 分支发布，也可以在仓库 Settings -> Pages 中选择：

```txt
Source: Deploy from a branch
Branch: gh-pages
Folder: / (root)
```

## iframe 嵌入

普通嵌入：

```html
<div class="demo-frame-wrap">
  <iframe
    src="https://orandolee.github.io/Physical_water/"
    title="3D 水体沙盒"
    loading="lazy"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</div>
```

推荐嵌入模式：

```html
<div class="demo-frame-wrap">
  <iframe
    src="https://orandolee.github.io/Physical_water/?embed=1"
    title="3D 水体沙盒"
    loading="lazy"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</div>
```

响应式 iframe 容器：

```css
.demo-frame-wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  background: #05070a;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.demo-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
```

沉浸式 iframe 容器：

```css
.demo-frame-wrap {
  width: 100%;
  height: min(86vh, 900px);
  border-radius: 28px;
  overflow: hidden;
  background: #05070a;
}

.demo-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
```

## 操作说明

- 点击画面激活沙盒
- `WASD` 移动视角
- 鼠标拖动或右键拖动观察方向
- 滚轮调节观察距离
- 点击或拖动水面制造涟漪
- `Shift + 左键` 制造更强扰动
- 从底部物品栏拖拽物体投放到水箱中
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
    WaterSurface.ts
    WaterMaterial.ts
  objects/
    FloatingObject.ts
    ObjectFactory.ts
    ObjectTypes.ts
  ui/
    ActivationOverlay.ts
    Hud.ts
    InventoryBar.ts
  utils/
    constants.ts
    math.ts
```

## 已实现内容

- 透明水箱和动态水面
- 鼠标扰动水面
- WASD 与鼠标视角控制
- 拖拽物体入水
- 简化浮力、沉降、碰撞和边界约束
- 物体排水导致水位上升
- 水位达到口沿后出现溢出效果
- 独立模式和 iframe 嵌入模式
- GitHub Pages 自动部署配置

## 后续可扩展方向

- 高能入水时的粒子水花
- 更真实的折射和水下视觉
- 更多物体类型和自定义材质
- 可选参数调试面板
- 水体颜色、密度或波纹预设
