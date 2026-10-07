import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Label, Separator, Switch, Tabs } from "@heroui/react";

import {
  LAYOUTS,
  RATIOS,
  THEMES,
  defaultState,
  defaultShapePick,
  FONTS,
  SIG_FONTS,
  SIG_EFFECTS,
  SIG_POSITIONS,
  SIGNATURE_ASSET_LIMIT,
  SIGNATURE_FONT_TYPES,
  SIGNATURE_IMAGE_TYPES,
  SIGNATURE_FREE_MARGIN,
  SIGNATURE_KEY_FAST_STEP,
  SIGNATURE_KEY_STEP,
  SIG_DEFAULT_FREE_POINT,
  GRID_LIMIT,
  nodeKey,
  UNDO_MAX,
  PROGRESS_TRACK_WIDTH,
  normalizeProgressTrackWidth,
} from "./engine/constants.js";
import { paintCollage, exportImage, signatureAnchor, themeOf } from "./engine/draw.js";
import { customGridGeometry, previewSize } from "./engine/layouts.js";
import { defaultFreeform, defaultRegionSetting } from "./engine/freeform.js";
import {
  evenDividers,
  narrowestGapIndex,
  normalizeGrid,
  pruneNodes,
  remapShapes,
  respaceDividers,
  widestGapIndex,
} from "./engine/grid.js";
import { PRESET_DETAILS, PRESET_GROUPS, PRESETS, resolvePanelAvailability } from "./engine/presets.js";
import { useUiTheme } from "./hooks/useUiTheme.js";
import ThemeToggle from "./components/ThemeToggle.jsx";
import CustomGridOverlay from "./components/CustomGridOverlay.jsx";
import FreeformOverlay from "./components/FreeformOverlay.jsx";
import GridEditorPanel from "./components/GridEditorPanel.jsx";
import { FieldSelect, FieldSlider, FieldText } from "./components/fields.jsx";
import LayoutThumb from "./components/LayoutThumb.jsx";
import HoverCard from "./components/HoverCard.jsx";
import YtShortOverlay from "./components/YtShortOverlay.jsx";
import { readAsset, writeAsset } from "./engine/assetStore.js";
import { openImageFiles, saveBlobWithSystemDialog } from "./engine/systemFileApi.js";

const SETTINGS_KEY = "photo-cut-settings-v3";

const PANEL_TITLES = {
  photos: "图片",
  look: "外观",
  text: "文字",
  export: "导出",
};

const NAV_ITEMS = [
  { id: "photos", label: "图片", icon: "image" },
  { id: "look", label: "外观", icon: "sliders" },
  { id: "text", label: "文字", icon: "text" },
  { id: "export", label: "导出", icon: "download" },
  { id: "history", label: "历史", icon: "history" },
];

const LIGHT_OPTIONS = [
  { value: "none", label: "无" },
  { value: "warm", label: "暖光" },
  { value: "cool", label: "冷光" },
  { value: "vignette", label: "暗角" },
  { value: "softbox", label: "柔光箱" },
];

const TEXTURE_OPTIONS = [
  { value: "none", label: "无", details: { name: "无纹理", description: "保持背景干净，让照片边缘和文字更清晰。", rows: [{ label: "图片排列", value: "原始色彩" }, { label: "适合画幅", value: "所有画幅" }, { label: "间距支持", value: "支持" }] } },
  { value: "grain", label: "颗粒", details: { name: "颗粒", description: "添加细微胶片颗粒，适合照片墙和夜景。", rows: [{ label: "图片排列", value: "统一叠加" }, { label: "适合画幅", value: "方形 / 竖幅" }, { label: "间距支持", value: "支持" }] } },
  { value: "paper", label: "纸纹", details: { name: "纸纹", description: "增加纸张触感，适合编辑风与剪贴簿布局。", rows: [{ label: "图片排列", value: "纸张底纹" }, { label: "适合画幅", value: "竖幅 / 方形" }, { label: "间距支持", value: "支持" }] } },
  { value: "both", label: "两者", details: { name: "颗粒 + 纸纹", description: "同时使用颗粒和纸纹，获得更明显的材质层次。", rows: [{ label: "图片排列", value: "统一叠加" }, { label: "适合画幅", value: "编辑排版" }, { label: "间距支持", value: "支持" }] } },
];

const LIGHT_DETAILS = {
  none: { name: "无背景光", description: "保持均匀底色，适合需要清晰边缘的拼贴。", rows: [{ label: "光线方向", value: "无" }, { label: "推荐画幅", value: "所有画幅" }, { label: "纹理叠加", value: "保留" }] },
  warm: { name: "暖光", description: "从左上方加入温暖光晕，适合复古和生活照片。", rows: [{ label: "光线方向", value: "左上" }, { label: "推荐画幅", value: "竖幅 / 方形" }, { label: "纹理叠加", value: "支持" }] },
  cool: { name: "冷光", description: "使用偏冷的高光平衡深色工作台，适合夜景照片。", rows: [{ label: "光线方向", value: "右上" }, { label: "推荐画幅", value: "横幅 / 方形" }, { label: "纹理叠加", value: "支持" }] },
  vignette: { name: "暗角", description: "压低边缘亮度，帮助视线集中到拼贴中心。", rows: [{ label: "光线方向", value: "四周收束" }, { label: "推荐画幅", value: "大图 / 海报" }, { label: "纹理叠加", value: "支持" }] },
  softbox: { name: "柔光箱", description: "添加柔和的中心光源，让纸张和照片层次更明显。", rows: [{ label: "光线方向", value: "中心扩散" }, { label: "推荐画幅", value: "编辑 / 竖幅" }, { label: "纹理叠加", value: "支持" }] },
};

const LAYOUT_PRESET_IDS = {
  mosaic: "pMosaic",
  editorial: "pEditorial",
  split: "pSplit",
  polaroid: "pPolaroid",
  scrapbook: "pScrap",
  circle: "pCircle",
  type: "pType",
  sns: "pSns",
  "yt-panel": "pYtPanel",
  player: "player",
};

const GAP_LABELS = { none: "无间距", narrow: "窄间距", standard: "标准间距", wide: "宽间距" };
const GRAIN_LABELS = { none: "无纹理", grain: "颗粒", paper: "纸纹", both: "颗粒 + 纸纹" };
function layoutHoverDetails(layout, ratio) {
  const presetId = LAYOUT_PRESET_IDS[layout.id];
  const preset = presetId ? PRESETS[presetId] : null;
  const presetDetails = presetId ? PRESET_DETAILS[presetId] : null;
  const patch = preset?.patch || {};
  const description = presetDetails?.description || (layout.id === "custom" ? "自由调整分隔线和节点，创建自己的拼贴结构。" : `${layout.hint}的拼贴布局。`);
  return {
    name: layout.name,
    description,
    rows: [
      { label: "布局结构", value: `${layout.thumb.length} 个区域` },
      { label: "适合照片", value: layout.id === "custom" ? "2–8 张" : `${Math.max(2, layout.thumb.length)} 张起` },
      { label: "推荐画幅", value: presetDetails?.ratio || patch.ratio || ratio },
      { label: "图片排列", value: presetDetails?.layoutLabel || layout.hint },
      { label: "不规则裁剪", value: layout.id === "custom" ? "支持" : "按布局" },
      { label: "间距 / 纹理", value: `${GAP_LABELS[patch.gap] || "可调间距"} · ${GRAIN_LABELS[patch.grain] || "可调纹理"}` },
    ],
  };
}

function NavIcon({ name }) {
  const paths = {
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m4 17 5-5 3 3 2-2 6 5" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    text: <><path d="M5 5h14M12 5v14M8 19h8" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" /></>,
    history: <><path d="M4 12a8 8 0 1 0 2-5.3" /><path d="M4 4v5h5M12 8v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H13v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

export default function App() {
  const { mode: uiTheme, setTheme: setUiTheme } = useUiTheme();
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const base = defaultState();
        return {
          ...base,
          ...saved,
          photos: [],
          ui: {
            ...base.ui,
            ...(saved.ui || {}),
            progressTrackWidth: normalizeProgressTrackWidth(saved.ui?.progressTrackWidth),
          },
          igStats: { ...base.igStats, ...(saved.igStats || {}) },
          ytStats: { ...base.ytStats, ...(saved.ytStats || {}) },
          playerMeta: { ...base.playerMeta, ...(saved.playerMeta || {}) },
          signature: { ...base.signature, ...(saved.signature || {}) },
        };
      }
    } catch {
      /* ignore */
    }
    return defaultState();
  });
  const [tab, setTab] = useState("look");
  const [activeNav, setActiveNav] = useState("look");
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(true);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [collapsedPresetGroups, setCollapsedPresetGroups] = useState({});
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [shapeMulti, setShapeMulti] = useState(false);
  const [freeformTool, setFreeformTool] = useState("select");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const gridPast = useRef([]);
  const gridFuture = useRef([]);
  const [, bumpHistory] = useState(0);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const signatureImageRef = useRef(null);
  const signatureImageFileRef = useRef(null);
  const signatureFontFileRef = useRef(null);
  const signatureDragRef = useRef(null);
  const customFontUrlRef = useRef("");
  const [signatureAssetVersion, setSignatureAssetVersion] = useState(0);
  const dropRef = useRef(null);
  const previewWrapRef = useRef(null);

  /** 深拷贝网格，确保撤销快照与后续改动互不影响。 */
  const cloneGrid = (raw) => {
    const g = normalizeGrid(raw);
    return {
      ...g,
      colsX: [...g.colsX],
      rowsY: [...g.rowsY],
      nodes: Object.fromEntries(Object.entries(g.nodes).map(([k, v]) => [k, { ...v }])),
      shapes: { ...g.shapes },
      fits: { ...g.fits },
      freeform: {
        ...g.freeform,
        nodes: Object.fromEntries(Object.entries(g.freeform?.nodes || {}).map(([k, v]) => [k, { ...v }])),
        edges: (g.freeform?.edges || []).map((edge) => ({ ...edge })),
        regionSettings: Object.fromEntries(
          Object.entries(g.freeform?.regionSettings || {}).map(([k, v]) => [
            k,
            { ...v, crop: { ...(v.crop || {}) }, sharedCrop: { ...(v.sharedCrop || {}) } },
          ])
        ),
        seam: { ...(g.freeform?.seam || {}) },
      },
    };
  };

  const patch = useCallback((p) => {
    setState((s) => {
      const raw = typeof p === "function" ? p(s) : p;
      // 自定义网格一旦变更就补齐缺省字段，避免旧设置缺列导致几何错乱
      const next = { ...s, ...raw };
      if (raw && "customGrid" in raw) next.customGrid = normalizeGrid(next.customGrid);
      return next;
    });
  }, []);

  /** 把当前网格压入撤销栈；命令式操作（增删行列、应用形状）以及拖拽起止时调用。 */
  const markGrid = useCallback(() => {
    setState((s) => {
      const snapshot = cloneGrid(s.customGrid);
      gridPast.current.push(snapshot);
      if (gridPast.current.length > UNDO_MAX) gridPast.current.shift();
      gridFuture.current = [];
      return s;
    });
    bumpHistory((n) => n + 1);
  }, []);

  const undoGrid = useCallback(() => {
    setState((s) => {
      if (!gridPast.current.length) return s;
      gridFuture.current.push(cloneGrid(s.customGrid));
      const prev = gridPast.current.pop();
      return { ...s, customGrid: { ...prev, on: true } };
    });
    bumpHistory((n) => n + 1);
  }, []);

  const redoGrid = useCallback(() => {
    setState((s) => {
      if (!gridFuture.current.length) return s;
      gridPast.current.push(cloneGrid(s.customGrid));
      const next = gridFuture.current.pop();
      return { ...s, customGrid: { ...next, on: true } };
    });
    bumpHistory((n) => n + 1);
  }, []);

  /**
   * 拖拽过程中的高频几何更新：只改数据，不进撤销栈。
   * 分隔线平移只改基准线位：节点偏移是相对基准线的形变量，
   * resolvedDividers 会在基准线上叠加 offset，整条线（含已拖过的节点）自然刚性平移。
   * 若再把 delta 累加进 nodes，每一帧都会重复加，节点会越拖越远直至被夹取“丢失”。
   */
  const onGridDrag = useCallback((op) => {
    setState((s) => {
      const g = normalizeGrid(s.customGrid);
      if (op.type === "divider") {
        const arrKey = op.axis === "x" ? "colsX" : "rowsY";
        const arr = [...g[arrKey]];
        if (op.i < 1 || op.i >= arr.length - 1) return s;
        const next = Number.isFinite(op.value) ? op.value : arr[op.i];
        if (next === arr[op.i]) return s;
        arr[op.i] = next;
        return { ...s, customGrid: { ...g, [arrKey]: arr } };
      }
      if (op.type === "node") {
        const nodes = { ...g.nodes, [nodeKey(op.c, op.r)]: { dx: op.dx, dy: op.dy } };
        return { ...s, customGrid: { ...g, nodes } };
      }
      return s;
    });
  }, []);

  const photos = state.photos;
  const activePhoto = photos.find((p) => p.id === state.activeId) || photos[0] || null;
  const availability = resolvePanelAvailability(state, photos.length);
  const progressTrackWidth = normalizeProgressTrackWidth(state.ui?.progressTrackWidth);
  const size = useMemo(() => previewSize(state, 760, 640), [state.ratio]);

  useEffect(() => {
    if (tab === "text" && !availability.showTextPanel) {
      setTab("look");
      setActiveNav("look");
    }
  }, [availability.showTextPanel, tab]);

  const grid = normalizeGrid(state.customGrid);
  const gridEditing = state.layout === "custom" && grid.on;
  const selectedIndex = activePhoto ? photos.findIndex((p) => p.id === activePhoto.id) : -1;
  const selectedShape = selectedIndex >= 0 ? grid.shapes?.[selectedIndex] || null : null;

  // 编辑层与绘制共用同一份归一化几何，避免两套布局实现漂移
  const gridGeo = useMemo(
    () => (gridEditing ? customGridGeometry(state, size.w, size.h) : null),
    [gridEditing, state.customGrid, size.w, size.h]
  );

  useEffect(() => {
    if (gridGeo?.kind !== "freeform") return;
    if (!gridGeo.regions.some((region) => region.id === selectedRegion)) {
      setSelectedRegion(gridGeo.regions[0]?.id || null);
    }
  }, [gridGeo, selectedRegion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size.w, size.h);
    paintCollage(ctx, state, size.w, size.h, { signatureImage: signatureImageRef.current });
  }, [state, size.w, size.h, signatureAssetVersion]);

  useEffect(() => {
    const { photos: _photos, ...rest } = state;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  }, [state]);

  useEffect(() => {
    const data = state.signature?.imageData;
    const asset = state.signature?.imageAsset;
    signatureImageRef.current = null;
    let cancelled = false;
    let objectUrl = "";
    const source = data
      ? Promise.resolve(data)
      : asset?.assetKey
        ? readAsset(asset.assetKey).then((blob) => {
            if (!blob) return "";
            objectUrl = URL.createObjectURL(blob);
            return objectUrl;
          })
        : Promise.resolve("");
    source.then((src) => {
      if (cancelled || !src) {
        if (!cancelled) setSignatureAssetVersion((v) => v + 1);
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        signatureImageRef.current = image;
        setSignatureAssetVersion((v) => v + 1);
      };
      image.onerror = () => {
        if (cancelled) return;
        signatureImageRef.current = null;
        setSignatureAssetVersion((v) => v + 1);
      };
      image.src = src;
    }).catch(() => {
      if (!cancelled) setSignatureAssetVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [state.signature?.imageData, state.signature?.imageAsset]);

  /* 字体二进制只存 IndexedDB，设置里保留名称和 assetKey。 */
  useEffect(() => {
    const custom = state.signature?.customFont;
    if (!custom?.assetKey || !custom.family) return undefined;
    let cancelled = false;
    readAsset(custom.assetKey)
      .then((blob) => {
        if (cancelled || !blob) return;
        if (customFontUrlRef.current) URL.revokeObjectURL(customFontUrlRef.current);
        const url = URL.createObjectURL(blob);
        customFontUrlRef.current = url;
        const face = new FontFace(custom.family, `url(${url})`);
        return face.load().then(() => {
          if (cancelled) return;
          document.fonts.add(face);
          setSignatureAssetVersion((v) => v + 1);
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state.signature?.customFont]);

  useEffect(
    () => () => {
      if (customFontUrlRef.current) URL.revokeObjectURL(customFontUrlRef.current);
    },
    []
  );

  /*
   * 旧版设置仍可能只有 imageData；上面的加载逻辑保留该兼容路径。
   * 新导入资源使用 IndexedDB，避免大文件撑爆 localStorage。
   */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const addFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      const loaded = await Promise.all(
        files.map(
          (file, idx) =>
            new Promise((resolve) => {
              const url = URL.createObjectURL(file);
              const img = new Image();
              img.onload = () =>
                resolve({
                  id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  img,
                  url,
                  crop: { zoom: 1, ox: 0, oy: 0 },
                });
              img.onerror = () => resolve(null);
              img.src = url;
            })
        )
      );
      const next = loaded.filter(Boolean);
      setState((s) => {
        const photos = [...s.photos, ...next];
        return { ...s, photos, activeId: s.activeId || next[0]?.id || null };
      });
    },
    []
  );

  const openImages = useCallback(async () => {
    try {
      const nativeFiles = await openImageFiles();
      if (nativeFiles) {
        await addFiles(nativeFiles);
        return;
      }
      fileRef.current?.click();
    } catch (error) {
      setToast(error?.message || "打开图片失败");
    }
  }, [addFiles]);

  const onExport = useCallback(async () => {
    if (!state.photos.length) {
      setToast("请先添加照片");
      return;
    }
    setBusy(true);
    let exportSignatureUrl = "";
    try {
      let exportSignatureImage = signatureImageRef.current;
      if (!exportSignatureImage && state.signature?.imageAsset?.assetKey) {
        const assetBlob = await readAsset(state.signature.imageAsset.assetKey);
        if (assetBlob) {
          exportSignatureUrl = URL.createObjectURL(assetBlob);
          exportSignatureImage = await new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = exportSignatureUrl;
          });
        }
      }
      const { blob, width, height } = await exportImage(state, size.w, size.h, {
        signatureImage: exportSignatureImage,
      });
      if (!blob) throw new Error("export failed");
      const filename = `photo-cut-${Date.now()}.${state.exportFormat === "png" ? "png" : "jpg"}`;
      const nativeSave = await saveBlobWithSystemDialog(blob, filename);
      if (nativeSave === null) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
      setToast(nativeSave?.canceled ? "已取消保存" : nativeSave ? "已保存文件" : `已导出 ${width}×${height}`);
    } catch (e) {
      setToast(e?.message || "导出失败");
    } finally {
      if (exportSignatureUrl) URL.revokeObjectURL(exportSignatureUrl);
      setBusy(false);
    }
  }, [state, size.w, size.h]);

  const applyPreset = (id) => {
    const p = PRESETS[id];
    if (!p) return;
    patch((s) => ({ ...s, ...p.patch, lastPreset: id }));
  };

  const updateUi = useCallback(
    (key, value) =>
      patch((s) => ({
        ...s,
        ui: {
          ...s.ui,
          [key]: key === "progressTrackWidth" ? normalizeProgressTrackWidth(value) : value,
        },
      })),
    [patch]
  );

  const updateSignature = useCallback(
    (key, value) => patch((s) => ({ ...s, signature: { ...s.signature, [key]: value } })),
    [patch]
  );

  const importSignatureImage = useCallback(
    async (file) => {
      if (!file) return;
      if (!SIGNATURE_IMAGE_TYPES.includes(file.type) || file.size > SIGNATURE_ASSET_LIMIT) {
        setToast("请选择 8MB 以内的 PNG 或 SVG 签名文件");
        return;
      }
      try {
        const assetKey = `signature-image-${Date.now()}`;
        await writeAsset(assetKey, file);
        patch((s) => ({
          ...s,
          signature: {
            ...s.signature,
            imageData: "",
            imageAsset: { assetKey, name: file.name, type: file.type },
          },
        }));
        setToast("签名图片已载入");
      } catch (error) {
        setToast(error?.message || "签名图片载入失败");
      }
    },
    [patch]
  );

  const importSignatureFont = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.toLowerCase().split(".").pop();
      const validType = SIGNATURE_FONT_TYPES.includes(file.type) || ["ttf", "otf", "woff", "woff2"].includes(ext);
      if (!validType || file.size > SIGNATURE_ASSET_LIMIT) {
        setToast("请选择 8MB 以内的 TTF、OTF、WOFF 或 WOFF2 字体");
        return;
      }
      try {
        const assetKey = `signature-font-${Date.now()}`;
        const family = `PhotoCutSignature-${Date.now()}`;
        await writeAsset(assetKey, file);
        updateSignature("customFont", { assetKey, family, name: file.name });
        updateSignature("font", "custom");
        setToast("签名字体已载入");
      } catch (error) {
        setToast(error?.message || "签名字体载入失败");
      }
    },
    [updateSignature]
  );

  /* ------------------- 自定义网格 · 高级编辑命令 ------------------- */

  /** 行列增减：几何按归一化比例插值，已有变形与形状归属尽量保留。 */
  const stepGrid = useCallback(
    (axis, dir) => {
      markGrid();
      setState((s) => {
        const g = normalizeGrid(s.customGrid);
        const isCol = axis === "col";
        const count = (isCol ? g.cols : g.rows) + dir;
        if (count < 1 || count > GRID_LIMIT) return s;
        const prevArr = isCol ? g.colsX : g.rowsY;
        const mode = dir > 0 ? "insert" : "remove";
        // 加：插在最宽的一格中间；减：去掉最窄的一格
        const at = dir > 0 ? widestGapIndex(prevArr) : narrowestGapIndex(prevArr);
        const nextArr = respaceDividers(prevArr, count, mode, at);
        const nextColsX = isCol ? nextArr : g.colsX;
        const nextRowsY = isCol ? g.rowsY : nextArr;
        const nextCols = nextColsX.length - 1;
        const nextRows = nextRowsY.length - 1;
        return {
          ...s,
          customGrid: {
            ...g,
            cols: nextCols,
            rows: nextRows,
            colsX: nextColsX,
            rowsY: nextRowsY,
            // 形状归属按旧格中心重新定位，避免插一列后全部错位
            shapes: remapShapes(g.shapes, g.colsX, g.rowsY, nextColsX, nextRowsY),
            nodes: pruneNodes(g, nextCols, nextRows),
          },
        };
      });
    },
    [markGrid]
  );

  const resetGrid = useCallback(() => {
    markGrid();
    patch((s) => {
      const g = normalizeGrid(s.customGrid);
      return {
        ...s,
        customGrid: {
          ...g,
          colsX: evenDividers(g.cols),
          rowsY: evenDividers(g.rows),
          nodes: {},
        },
      };
    });
  }, [markGrid, patch]);

  const clearShapes = useCallback(() => {
    markGrid();
    patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), shapes: {}, fits: {} } }));
  }, [markGrid, patch]);

  /** 随机交换照片位置：只打乱照片顺序，不动格子几何。 */
  const shufflePhotos = useCallback(() => {
    setState((s) => {
      if (s.photos.length < 2) return s;
      const arr = [...s.photos];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return { ...s, photos: arr };
    });
  }, []);

  /** 给若干槽位套形状或清除形状；形状逐格独立，符合「单选 + 多选 + 全部」的用法。 */
  const applyShape = useCallback(
    (targets, shapeId) => {
      const list = Array.isArray(targets) ? targets : [targets];
      const valid = list.filter((i) => Number.isFinite(i) && i >= 0);
      if (!valid.length) {
        setToast("请先在画布上点选格子");
        return;
      }
      markGrid();
      patch((s) => {
        const g = normalizeGrid(s.customGrid);
        const shapes = { ...g.shapes };
        const fits = { ...g.fits };
        valid.forEach((i) => {
          if (shapeId) {
            shapes[i] = shapeId;
            fits[i] = s.shapePick?.fit || "cover";
          } else {
            delete shapes[i];
            delete fits[i];
          }
        });
        return { ...s, customGrid: { ...g, shapes, fits } };
      });
    },
    [markGrid, patch]
  );

  /** 几何拖拽开始：先压入拖前快照，撤销才能回到拖动前。 */
  const onGridBegin = useCallback(() => {
    markGrid();
  }, [markGrid]);

  /** 编辑层拖拽结束：状态已在 onGridDrag 更新，此处不再压栈。 */
  const onGridCommit = useCallback(() => {
    bumpHistory((n) => n + 1);
  }, []);

  const onFreeformModeChange = useCallback(
    (mode) => {
      markGrid();
      patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), mode, on: true } }));
      setFreeformTool((current) => (mode === "freeform" ? "select" : current));
      setSelectedRegion(null);
    },
    [markGrid, patch]
  );

  const onFreeformGraphChange = useCallback(
    (nextGraph) => {
      patch((s) => ({
        ...s,
        customGrid: { ...normalizeGrid(s.customGrid), mode: "freeform", on: true, freeform: nextGraph },
      }));
    },
    [patch]
  );

  const onFreeformRegionSettingChange = useCallback(
    (regionId, changes) => {
      if (!regionId) return;
      patch((s) => {
        const g = normalizeGrid(s.customGrid);
        const current = { ...defaultRegionSetting(), ...(g.freeform.regionSettings?.[regionId] || {}) };
        const sharedCropBase = changes.mode === "shared" && !changes.sharedCrop ? current.crop : current.sharedCrop;
        const nextSetting = {
          ...current,
          ...changes,
          crop: { ...current.crop, ...(changes.crop || {}) },
          sharedCrop: { ...sharedCropBase, ...(changes.sharedCrop || {}) },
        };
        if (nextSetting.mode === "shared") {
          const sourceId = nextSetting.sourceId || nextSetting.photoId || null;
          nextSetting.sourceId = sourceId;
          nextSetting.photoId = sourceId;
        } else {
          nextSetting.sourceId = null;
        }
        const regionSettings = {
          ...g.freeform.regionSettings,
          [regionId]: nextSetting,
        };
        if (nextSetting.mode === "shared" && changes.sharedCrop) {
          Object.entries(regionSettings).forEach(([id, setting]) => {
            const settingSource = setting?.sourceId || setting?.photoId || null;
            if (id !== regionId && setting?.mode === "shared" && settingSource === nextSetting.sourceId) {
              regionSettings[id] = { ...setting, sharedCrop: { ...nextSetting.sharedCrop }, crop: { ...nextSetting.sharedCrop } };
            }
          });
        }
        return {
          ...s,
          customGrid: {
            ...g,
            mode: "freeform",
            freeform: {
              ...g.freeform,
              regionSettings,
            },
          },
        };
      });
    },
    [patch]
  );

  const onFreeformSeamChange = useCallback(
    (changes) => {
      patch((s) => {
        const g = normalizeGrid(s.customGrid);
        return { ...s, customGrid: { ...g, mode: "freeform", freeform: { ...g.freeform, seam: { ...g.freeform.seam, ...changes } } } };
      });
    },
    [patch]
  );

  const onFreeformClear = useCallback(() => {
    markGrid();
    patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), mode: "freeform", on: true, freeform: defaultFreeform() } }));
    setSelectedRegion(null);
    setFreeformTool("select");
  }, [markGrid, patch]);

  const onToggleCell = useCallback((index) => {
    setSelectedCells((prev) => (prev.includes(index) ? prev.filter((v) => v !== index) : [...prev, index]));
  }, []);

  const onSetSelection = useCallback((list) => setSelectedCells([...new Set(list)]), []);

  /** 点击格子同时把它设为「当前照片」，与现有裁剪面板联动。 */
  const onPickCell = useCallback(
    (index) => {
      const photo = photos[index];
      if (photo) setState((s) => ({ ...s, activeId: photo.id }));
    },
    [photos]
  );

  // 快捷键：Ctrl+Z / Ctrl+Shift+Z 撤销重做；Esc 取消选择
  useEffect(() => {
    if (!gridEditing) return undefined;
    const onKey = (e) => {
      const el = e.target;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoGrid();
        else undoGrid();
      } else if (e.key === "Escape") {
        setSelectedCells([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gridEditing, undoGrid, redoGrid]);

  const th = themeOf(state);
  const sigAnchor = useMemo(() => signatureAnchor(state, size.w, size.h), [state.signature, size.w, size.h]);

  const onSignaturePointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    signatureDragRef.current = { pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onSignaturePointerMove = useCallback(
    (event) => {
      if (!signatureDragRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const x = Math.min(1 - SIGNATURE_FREE_MARGIN, Math.max(SIGNATURE_FREE_MARGIN, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1 - SIGNATURE_FREE_MARGIN, Math.max(SIGNATURE_FREE_MARGIN, (event.clientY - rect.top) / rect.height));
      patch((s) => ({ ...s, signature: { ...s.signature, pos: "free", x, y } }));
      event.preventDefault();
      event.stopPropagation();
    },
    [patch]
  );

  const onSignaturePointerUp = useCallback((event) => {
    signatureDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.stopPropagation();
  }, []);

  const onSignatureKeyDown = useCallback(
    (event) => {
      const step = event.shiftKey ? SIGNATURE_KEY_FAST_STEP : SIGNATURE_KEY_STEP;
      const delta = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[event.key];
      if (!delta) return;
      event.preventDefault();
      patch((s) => ({
        ...s,
        signature: {
          ...s.signature,
          pos: "free",
          x: Math.min(1 - SIGNATURE_FREE_MARGIN, Math.max(SIGNATURE_FREE_MARGIN, (s.signature?.x ?? SIG_DEFAULT_FREE_POINT[0]) + delta[0])),
          y: Math.min(1 - SIGNATURE_FREE_MARGIN, Math.max(SIGNATURE_FREE_MARGIN, (s.signature?.y ?? SIG_DEFAULT_FREE_POINT[1]) + delta[1])),
        },
      }));
    },
    [patch]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <div className="brand">
            photo<span>-cut</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="text-xs text-[color:var(--muted)]">React + HeroUI · 本机拼贴</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onPress={() => patch(defaultState())}>
            重置
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              const { photos: _p, ...rest } = state;
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
              setToast("已记住设置");
            }}
          >
            记住设置
          </Button>
          <Button variant="primary" size="sm" onPress={onExport} isDisabled={!photos.length || busy}>
            {busy ? "导出中…" : "导出"}
          </Button>
        </div>
      </header>

      <div className="workspace">
        <aside className="nav-rail" aria-label="主导航">
          <div className="nav-mark" aria-label="photo-cut">pc</div>
          <nav className="nav-list">
            {NAV_ITEMS.map((item) => {
              const selected = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item${selected ? " is-active" : ""}`}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.id === "history") {
                      setTab("look");
                      setToast("可使用画布工具栏中的撤销与重做");
                    } else {
                      setTab(item.id);
                    }
                  }}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="nav-footer">
            <button type="button" className="nav-item nav-item-utility" onClick={() => setToast("当前语言：中文")}>
              <span className="nav-language">文</span>
              <span>语言</span>
            </button>
            <ThemeToggle mode={uiTheme} onChange={setUiTheme} />
            <button type="button" className="nav-item nav-item-utility" onClick={() => setToast("设置已在顶部工具栏提供")}>
              <NavIcon name="settings" />
              <span>设置</span>
            </button>
          </div>
        </aside>

        <aside className={`rail settings-sidebar${settingsCollapsed ? " is-collapsed" : ""}`}>
          <div className="settings-header">
            <div>
              <span className="settings-kicker">当前面板</span>
              <h1>{PANEL_TITLES[tab] || "外观"}</h1>
            </div>
            <div className="settings-header-actions">
              <button type="button" className="help-button" onClick={() => setToast("提示：设置会自动保存，画布可直接拖动签名位置")}>
                ? <span>查看提示</span>
              </button>
              <button type="button" className="settings-collapse" onClick={() => setSettingsCollapsed((collapsed) => !collapsed)} aria-expanded={!settingsCollapsed}>
                {settingsCollapsed ? "展开" : "收起"}
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Tabs
            selectedKey={tab}
            onSelectionChange={(key) => {
              const next = String(key);
              setTab(next);
              setActiveNav(next);
            }}
            className="settings-tabs"
            aria-label="设置分区"
          >
            <Tabs.ListContainer className="settings-tab-list" aria-hidden="true">
              <Tabs.List>

                <Tabs.Tab id="look">外观</Tabs.Tab>
                {availability.showTextPanel && <Tabs.Tab id="text">文字</Tabs.Tab>}
                <Tabs.Tab id="export">导出</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="photos">
              <div className="panel-section">
                <h2>出图预设</h2>
                <div className="preset-groups">
                  {PRESET_GROUPS.map((group) => (
                    <section className="preset-group" key={group.id}>
                      <button
                        type="button"
                        className="preset-group-title"
                        aria-expanded={!collapsedPresetGroups[group.id]}
                        aria-controls={`preset-group-${group.id}`}
                        onClick={() =>
                          setCollapsedPresetGroups((current) => ({
                            ...current,
                            [group.id]: !current[group.id],
                          }))
                        }
                      >
                        <span className="preset-group-title-label">{group.label}</span>
                        <span className="preset-group-title-trailing">
                          <span className="mono">{group.items.length}</span>
                          <span className="preset-group-chevron" aria-hidden="true">
                            {collapsedPresetGroups[group.id] ? "+" : "−"}
                          </span>
                        </span>
                      </button>
                      <div
                        id={`preset-group-${group.id}`}
                        className={`preset-grid${collapsedPresetGroups[group.id] ? " is-collapsed" : ""}`}
                        hidden={!!collapsedPresetGroups[group.id]}
                      >
                        {group.items.map((id) => {
                          const preset = PRESETS[id];
                          if (!preset) return null;
                          const details = PRESET_DETAILS[id] || {};
                          return (
                            <HoverCard
                              key={id}
                              details={{
                                name: preset.name || id,
                                description: details.description || "预设组合，可继续在外观和文字面板中微调。",
                                rows: [
                                  { label: "推荐画幅", value: details.ratio || preset.ratio || preset.patch?.ratio || state.ratio },
                                  { label: "布局结构", value: details.layoutLabel || preset.layoutLabel || preset.patch?.layout || state.layout },
                                  { label: "主题", value: preset.patch?.theme || "保留当前" },
                                  { label: "纹理 / 间距", value: `${GRAIN_LABELS[preset.patch?.grain] || "保留当前纹理"} · ${GAP_LABELS[preset.patch?.gap] || "保留当前间距"}` },
                                ],
                              }}
                            >
                              <button
                                type="button"
                                className={`preset-card ${state.lastPreset === id ? "is-active" : ""}`}
                                onClick={() => applyPreset(id)}
                              >
                                <span className="preset-card-title">{preset.name || id}</span>
                                <span className="preset-card-meta">
                                  {details.ratio || preset.ratio || preset.patch?.ratio || state.ratio} · {details.layoutLabel || preset.layoutLabel || preset.patch?.layout || state.layout}
                                </span>
                              </button>
                            </HoverCard>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              {availability.hasIgInteraction && (
                <div className="panel-section interaction-panel">
                  <h2>社交卡片交互</h2>
                  <div className="interaction-row">
                    <Button size="sm" variant={state.ui?.liked ? "primary" : "secondary"} onPress={() => updateUi("liked", !state.ui?.liked)}>
                      {state.ui?.liked ? "已点赞" : "点亮爱心"}
                    </Button>
                    <Button size="sm" variant={state.ui?.bookmarked ? "primary" : "secondary"} onPress={() => updateUi("bookmarked", !state.ui?.bookmarked)}>
                      {state.ui?.bookmarked ? "已收藏" : "收藏"}
                    </Button>
                  </div>
                  <FieldText label="账号名称" value={state.igBrand || ""} onChange={(v) => patch({ igBrand: v })} placeholder="photo-cut" maxLength={30} />
                  <FieldText label="配文" value={state.igCaption || ""} onChange={(v) => patch({ igCaption: v })} placeholder="写下这张拼贴的故事" maxLength={80} />
                  <FieldText label="点赞数" value={state.igStats?.likes || ""} onChange={(v) => patch((s) => ({ ...s, igStats: { ...s.igStats, likes: v } }))} placeholder="128" maxLength={12} />
                  <FieldText label="评论数" value={state.igStats?.comments || ""} onChange={(v) => patch((s) => ({ ...s, igStats: { ...s.igStats, comments: v } }))} placeholder="12" maxLength={12} />
                  <FieldText label="转发数" value={state.igStats?.shares || ""} onChange={(v) => patch((s) => ({ ...s, igStats: { ...s.igStats, shares: v } }))} placeholder="4" maxLength={12} />
                </div>
              )}

              {availability.showPlayerPanel && (
                <div className="panel-section interaction-panel">
                  <h2>播放器交互</h2>
                  <div className="interaction-row">
                    <Button size="sm" variant={state.ui?.playing !== false ? "primary" : "secondary"} onPress={() => updateUi("playing", state.ui?.playing === false)}>
                      {state.ui?.playing !== false ? "播放中" : "已暂停"}
                    </Button>
                    <Button size="sm" variant={state.ui?.muted ? "primary" : "secondary"} onPress={() => updateUi("muted", !state.ui?.muted)}>
                      {state.ui?.muted ? "已静音" : "有声音"}
                    </Button>
                  </div>
                  <div className="player-track-setting" style={{ "--progress-track-width": `${progressTrackWidth}%` }}>
                    <FieldSlider
                      label="进度条宽度"
                      min={PROGRESS_TRACK_WIDTH.min}
                      max={PROGRESS_TRACK_WIDTH.max}
                      step={PROGRESS_TRACK_WIDTH.step}
                      value={progressTrackWidth}
                      onChange={(v) => updateUi("progressTrackWidth", normalizeProgressTrackWidth(v))}
                      format={(v) => `${v}%`}
                    />
                    <div className="player-track-preview" aria-hidden="true">
                      <span className="player-track-preview__fill" />
                    </div>
                  </div>
                  {availability.hasDuration && (
                    <FieldSlider
                      label="播放进度"
                      min={0}
                      max={100}
                      value={Math.round((state.ui?.playerProgress ?? 0) * 100)}
                      onChange={(v) => updateUi("playerProgress", v / 100)}
                      format={(v) => `${v}%`}
                    />
                  )}
                  <FieldSlider
                    label="缓冲进度"
                    min={0}
                    max={100}
                    value={Math.round((state.ui?.playerBuffered ?? 0) * 100)}
                    onChange={(v) => updateUi("playerBuffered", Math.max(state.ui?.playerProgress ?? 0, v / 100))}
                    format={(v) => `${v}%`}
                  />
                  <FieldText label="曲目" value={state.playerMeta?.track || ""} onChange={(v) => patch((s) => ({ ...s, playerMeta: { ...s.playerMeta, track: v } }))} placeholder="Now Playing" maxLength={40} />
                  <FieldText label="艺术家" value={state.playerMeta?.artist || ""} onChange={(v) => patch((s) => ({ ...s, playerMeta: { ...s.playerMeta, artist: v } }))} placeholder="photo-cut" maxLength={40} />
                  {availability.hasDuration && (
                    <>
                      <FieldText label="当前时间" value={state.playerMeta?.timeLeft || ""} onChange={(v) => patch((s) => ({ ...s, playerMeta: { ...s.playerMeta, timeLeft: v } }))} placeholder="1:24" maxLength={12} />
                      <FieldText label="总时长" value={state.playerMeta?.timeRight || ""} onChange={(v) => patch((s) => ({ ...s, playerMeta: { ...s.playerMeta, timeRight: v } }))} placeholder="3:42" maxLength={12} />
                    </>
                  )}
                  {availability.hasStats && (
                    <Switch isSelected={!!state.ui?.showCounts} onChange={(v) => updateUi("showCounts", v)} className="mb-2">
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                      <Switch.Content><Label>显示互动数量</Label></Switch.Content>
                    </Switch>
                  )}
                </div>
              )}

              <div className="panel-section">
                <h2>照片</h2>
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="secondary" onPress={openImages}>
                    选择图片
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={!photos.length}
                    onPress={() => patch({ photos: [], activeId: null })}
                  >
                    清空
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div
                  ref={dropRef}
                  className="dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    dropRef.current?.classList.add("is-over");
                  }}
                  onDragLeave={() => dropRef.current?.classList.remove("is-over")}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropRef.current?.classList.remove("is-over");
                    addFiles(e.dataTransfer.files);
                  }}
                  onClick={openImages}
                >
                  {photos.length ? `${photos.length} 张照片 · 可继续拖入` : "拖入或选择照片"}
                </div>

              </div>

              {activePhoto && (
                <div className="panel-section">
                  <h2>当前照片</h2>
                  <div className="text-xs text-[color:var(--muted)] mb-2 truncate">{activePhoto.name}</div>
                  <FieldSlider
                    label="缩放"
                    min={100}
                    max={300}
                    value={Math.round((activePhoto.crop?.zoom || 1) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, zoom: v / 100 } } : p
                        ),
                      }))
                    }
                    format={(v) => `${(v / 100).toFixed(2)}×`}
                  />
                  <FieldSlider
                    label="水平偏移"
                    min={-100}
                    max={100}
                    value={Math.round((activePhoto.crop?.ox || 0) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, ox: v / 100 } } : p
                        ),
                      }))
                    }
                  />
                  <FieldSlider
                    label="垂直偏移"
                    min={-100}
                    max={100}
                    value={Math.round((activePhoto.crop?.oy || 0) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, oy: v / 100 } } : p
                        ),
                      }))
                    }
                  />
                </div>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="look">
              <div className="panel-section">
                <h2>布局</h2>
                <div className="layout-feature">
                  <LayoutThumb cells={LAYOUTS.find((l) => l.id === state.layout)?.thumb || LAYOUTS[0].thumb} themes={th} />
                  <div className="layout-feature-copy">
                    <span className="layout-feature-kicker">当前布局</span>
                    <strong>{LAYOUTS.find((l) => l.id === state.layout)?.name || state.layout}</strong>
                    <span>{LAYOUTS.find((l) => l.id === state.layout)?.hint || "可继续调整"}</span>
                  </div>
                  <Button size="sm" variant="secondary" onPress={() => setLayoutPickerOpen((open) => !open)}>
                    {layoutPickerOpen ? "更换" : "收起"}
                  </Button>
                </div>
                <div className={`layout-grid${layoutPickerOpen ? "" : " is-collapsed"}`}>
                  {LAYOUTS.map((l) => (
                    <HoverCard key={l.id} details={layoutHoverDetails(l, state.ratio)}>
                      <button
                      key={l.id}
                      type="button"
                      className={`layout-card ${state.layout === l.id ? "is-active" : ""}`}
                      onClick={() =>
                        patch((s) => ({
                          ...s,
                          layout: l.id,
                          // 选中「自定义网格」即进入编辑态，避免多一步开关
                          customGrid:
                            l.id === "custom" ? { ...normalizeGrid(s.customGrid), on: true } : s.customGrid,
                        }))
                      }
                    >
                      <LayoutThumb cells={l.thumb} themes={th} />
                        <div className="name">{l.name}</div>
                        <div className="hint">{l.hint}</div>
                      </button>
                    </HoverCard>
                  ))}
                </div>
              </div>

              {state.layout === "custom" && (
                <GridEditorPanel
                  grid={grid}
                  shapePick={state.shapePick}
                  selectedCount={selectedCells.length}
                  shapedCount={Object.keys(grid.shapes || {}).length}
                  multi={shapeMulti}
                  canUndo={!!gridPast.current.length}
                  canRedo={!!gridFuture.current.length}
                  hasPhotos={photos.length >= 2}
                  hasGrid={!!gridGeo}
                  photos={photos}
                  freeformGeometry={gridGeo?.kind === "freeform" ? gridGeo : null}
                  freeformTool={freeformTool}
                  selectedRegion={selectedRegion}
                  onModeChange={onFreeformModeChange}
                  onFreeformToolChange={setFreeformTool}
                  onFreeformRegionPick={setSelectedRegion}
                  onFreeformRegionSettingChange={onFreeformRegionSettingChange}
                  onFreeformSeamChange={onFreeformSeamChange}
                  onFreeformClear={onFreeformClear}
                  onToggleEdit={(v) =>
                    patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), on: v } }))
                  }
                  onStep={stepGrid}
                  onReset={resetGrid}
                  onUndo={undoGrid}
                  onRedo={redoGrid}
                  onPadChange={(v) =>
                    patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), outerPad: v } }))
                  }
                  onGapChange={(v) =>
                    patch((s) => ({ ...s, customGrid: { ...normalizeGrid(s.customGrid), cellGap: v } }))
                  }
                  onMultiChange={setShapeMulti}
                  onPickShape={(id) =>
                    patch((s) => ({ ...s, shapePick: { ...defaultShapePick(), ...s.shapePick, shape: id } }))
                  }
                  onFitChange={(v) =>
                    patch((s) => ({ ...s, shapePick: { ...defaultShapePick(), ...s.shapePick, fit: v } }))
                  }
                  onApplyToSelected={(id) => applyShape(selectedCells, id)}
                  onApplyToAll={(id) => gridGeo && applyShape(gridGeo.cells.map((c) => c.index), id)}
                  onClearShapes={clearShapes}
                  onShuffle={shufflePhotos}
                />
              )}

              <div className="panel-section">
                <h2>画布</h2>
                {availability.capabilities.gap && (
                <Switch
                  isSelected={state.gap === "none"}
                  onChange={(value) => patch({ gap: value ? "none" : "standard" })}
                  className="borderless-switch"
                >
                  <Switch.Control><Switch.Thumb /></Switch.Control>
                  <Switch.Content>
                    <Label>无边框</Label>
                    <span className="switch-note">图片延伸至画布边缘</span>
                  </Switch.Content>
                </Switch>
                )}
                <FieldSelect
                  label="比例"
                  value={state.ratio}
                  onChange={(v) => patch({ ratio: v })}
                  options={Object.keys(RATIOS).map((k) => ({ value: k, label: k }))}
                />
                <div className="look-two-col">
                  <FieldSelect
                    label="主题"
                    value={state.theme}
                    onChange={(v) => patch({ theme: v })}
                    options={Object.entries(THEMES).map(([k]) => ({ value: k, label: k }))}
                  />
                  <FieldSelect
                    label="照片排列"
                    value={state.cols}
                    onChange={(v) => patch({ cols: v })}
                    options={[
                      { value: "auto", label: "自动" },
                      { value: "4", label: "4 列" },
                      { value: "5", label: "5 列" },
                      { value: "6", label: "6 列" },
                      { value: "7", label: "7 列" },
                    ]}
                  />
                </div>
                <FieldSelect
                  label="背景"
                  value={state.bgMode}
                  onChange={(v) => patch({ bgMode: v })}
                  options={[
                    { value: "solid", label: "纯色" },
                    { value: "gradient", label: "渐变" },
                    { value: "photo", label: "照片底" },
                  ]}
                />
                {state.bgMode === "photo" && (
                  <FieldSlider
                    label="淡影浓度"
                    min={5}
                    max={60}
                    value={Math.round((state.ghost || 0.35) * 100)}
                    onChange={(v) => patch({ ghost: v / 100 })}
                    format={(v) => (v / 100).toFixed(2)}
                  />
                )}
              </div>

              {(availability.capabilities.texture || availability.capabilities.light || availability.capabilities.gap) && (
              <div className="panel-section">
                <h2>质感与光</h2>
                <div className="look-two-col">
                  {availability.capabilities.texture && (
                  <div className="texture-picker">
                    <div className="field-label"><span>纹理</span><span className="mono text-[color:var(--accent)]">{TEXTURE_OPTIONS.find((option) => option.value === state.grain)?.label}</span></div>
                    <div className="texture-card-grid" role="group" aria-label="纹理">
                      {TEXTURE_OPTIONS.map((option) => (
                        <HoverCard key={option.value} details={option.details}>
                          <button
                            type="button"
                            className={`texture-card texture-card-${option.value}${state.grain === option.value ? " is-active" : ""}`}
                            onClick={() => patch({ grain: option.value })}
                            aria-pressed={state.grain === option.value}
                          >
                            <span className="texture-preview" />
                            <span>{option.label}</span>
                          </button>
                        </HoverCard>
                      ))}
                    </div>
                  </div>
                  )}
                  {availability.capabilities.gap && (
                  <FieldSelect
                    label="间距"
                    value={state.gap}
                    onChange={(v) => patch({ gap: v })}
                    options={[
                      { value: "none", label: "无" },
                      { value: "narrow", label: "窄" },
                      { value: "standard", label: "标准" },
                      { value: "wide", label: "宽" },
                    ]}
                  />
                  )}
                </div>
                <FieldSelect
                  label="圆角"
                  value={state.radius}
                  onChange={(v) => patch({ radius: v })}
                  options={[
                    { value: "none", label: "直角" },
                    { value: "soft", label: "柔和" },
                    { value: "medium", label: "中等" },
                    { value: "large", label: "大圆角" },
                  ]}
                />
                {availability.capabilities.light && <div className="light-section">
                  <div className="field-label"><span>背景光</span><span className="mono text-[color:var(--accent)]">{LIGHT_OPTIONS.find((item) => item.value === state.light)?.label}</span></div>
                  <div className="light-grid" role="group" aria-label="背景光">
                    {LIGHT_OPTIONS.map((option) => (
                      <HoverCard key={option.value} details={LIGHT_DETAILS[option.value]}>
                        <button
                          type="button"
                          className={`light-card light-card-${option.value}${state.light === option.value ? " is-active" : ""}`}
                          onClick={() => patch({ light: option.value })}
                          aria-pressed={state.light === option.value}
                        >
                          <span className="light-preview" />
                          <span>{option.label}</span>
                        </button>
                      </HoverCard>
                    ))}
                  </div>
                </div>}
                {availability.capabilities.light && <FieldSelect
                  label="光效"
                  value={state.light}
                  onChange={(v) => patch({ light: v })}
                  options={LIGHT_OPTIONS}
                />}
                {availability.capabilities.light && state.light !== "none" && (
                  <>
                    <FieldSlider
                      label="光效强度"
                      min={0}
                      max={100}
                      value={Math.round((state.lightStrength || 0.45) * 100)}
                      onChange={(v) => patch({ lightStrength: v / 100 })}
                      format={(v) => (v / 100).toFixed(2)}
                    />
                    <div className="field-row">
                      <Label className="text-xs text-[color:var(--muted)]">光色</Label>
                      <div className="flex items-center gap-2">
                        <input
                          className="color-swatch"
                          type="color"
                          value={state.lightColor}
                          onChange={(e) => patch({ lightColor: e.target.value })}
                        />
                        <span className="mono text-[color:var(--muted)]">
                          {state.lightColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              )}

            </Tabs.Panel>

            {availability.showTextPanel && <Tabs.Panel id="text">
              <div className="panel-section">
                <h2>文字版式</h2>
                <FieldSelect
                  label="样式"
                  value={state.textStyle}
                  onChange={(v) => patch({ textStyle: v })}
                  options={[
                    { value: "head-footer", label: "头尾" },
                    { value: "edition", label: "编辑" },
                    { value: "center", label: "居中大字" },
                    { value: "top", label: "顶部" },
                  ]}
                />
                <FieldText label="标题" value={state.title} onChange={(v) => patch({ title: v })} placeholder="Enter 可换行，最多 3 行" />
                <FieldText label="副标题" value={state.subtitle} onChange={(v) => patch({ subtitle: v })} placeholder="右上角小字" maxLength={40} />
                <FieldText label="页脚" value={state.footer} onChange={(v) => patch({ footer: v })} placeholder="Through the Lens" maxLength={40} />
                <FieldText label="副页脚" value={state.subfooter} onChange={(v) => patch({ subfooter: v })} placeholder="© 2026" maxLength={40} />
                <FieldSelect
                  label="主字体"
                  value={state.font}
                  onChange={(v) => patch({ font: v })}
                  options={Object.keys(FONTS).map((k) => ({ value: k, label: k }))}
                />
                <FieldSelect
                  label="辅助字体"
                  value={state.fontSub}
                  onChange={(v) => patch({ fontSub: v })}
                  options={Object.keys(FONTS).map((k) => ({ value: k, label: k }))}
                />
                <Switch
                  isSelected={!!state.glow}
                  onChange={(v) => patch({ glow: v })}
                  className="mb-2"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>标题发光</Label>
                  </Switch.Content>
                </Switch>
              </div>

              {availability.showSignaturePanel && (
              <div className="panel-section">
                <h2>签名</h2>
                <Switch
                  isSelected={!!state.signature?.enabled}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, enabled: v } }))}
                  className="mb-2"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>显示签名</Label>
                  </Switch.Content>
                </Switch>
                {availability.showSignaturePanel && state.signature?.enabled && (
                  <div className="signature-details">
                <FieldSelect
                  label="签名字体"
                  value={state.signature?.font || "script"}
                  onChange={(v) => updateSignature("font", v)}
                  options={[
                    ...Object.keys(SIG_FONTS).map((k) => ({ value: k, label: k })),
                    ...((state.signature?.customFont || state.signature?.font === "custom")
                      ? [{ value: "custom", label: state.signature.customFont?.name || "自定义字体" }]
                      : []),
                  ]}
                />
                <FieldText
                  label="签名文字"
                  value={state.signature?.text || ""}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, text: v } }))}
                  placeholder="你的签名"
                  maxLength={20}
                />
                <FieldSelect
                  label="位置"
                  value={state.signature?.pos || "br"}
                  onChange={(v) => updateSignature("pos", v)}
                  options={SIG_POSITIONS.map((item) => ({ value: item.id, label: item.label }))}
                />
                <FieldSelect
                  label="效果"
                  value={state.signature?.effect || "soft"}
                  onChange={(v) => updateSignature("effect", v)}
                  options={SIG_EFFECTS.map((item) => ({ value: item.id, label: item.label }))}
                />
                {state.signature?.pos === "free" && (
                  <>
                    <FieldSlider label="水平位置" min={4} max={96} value={Math.round((state.signature?.x ?? 0.88) * 100)} onChange={(v) => updateSignature("x", v / 100)} format={(v) => `${v}%`} />
                    <FieldSlider label="垂直位置" min={4} max={96} value={Math.round((state.signature?.y ?? 0.9) * 100)} onChange={(v) => updateSignature("y", v / 100)} format={(v) => `${v}%`} />
                  </>
                )}
                <div className="field-row signature-assets">
                  <Label className="text-xs text-[color:var(--muted)]">本地资源</Label>
                  <div className="interaction-row">
                    <Button size="sm" variant="secondary" onPress={() => signatureImageFileRef.current?.click()}>导入签名图</Button>
                    <Button size="sm" variant="secondary" onPress={() => signatureFontFileRef.current?.click()}>导入字体</Button>
                    {(state.signature?.imageData || state.signature?.imageAsset) && <Button size="sm" variant="ghost" onPress={() => patch((s) => ({ ...s, signature: { ...s.signature, imageData: "", imageAsset: null } }))}>移除签名图</Button>}
                  </div>
                  <input ref={signatureImageFileRef} type="file" accept={SIGNATURE_IMAGE_TYPES.join(",")} hidden onChange={(e) => { importSignatureImage(e.target.files?.[0]); e.target.value = ""; }} />
                  <input ref={signatureFontFileRef} type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={(e) => { importSignatureFont(e.target.files?.[0]); e.target.value = ""; }} />
                  <div className="hint-text">支持 PNG / SVG 签名图与 TTF / OTF / WOFF / WOFF2 字体，资源只保存在本机。</div>
                </div>
                <FieldSlider
                  label="大小"
                  min={4}
                  max={16}
                  value={Math.round((state.signature?.size || 0.08) * 100)}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, size: v / 100 } }))}
                />
                <FieldSlider
                  label="旋转"
                  min={-30}
                  max={30}
                  value={state.signature?.rotate ?? -6}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, rotate: v } }))}
                />
                <FieldSlider
                  label="不透明度"
                  min={10}
                  max={100}
                  value={Math.round((state.signature?.opacity ?? 0.72) * 100)}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, opacity: v / 100 } }))}
                />
              </div>
                )}
              </div>
              )}
            </Tabs.Panel>}

            <Tabs.Panel id="export">
              <div className="panel-section">
                <h2>导出与出片</h2>
                <FieldSelect
                  label="尺寸"
                  value={state.exportSize}
                  onChange={(v) => patch({ exportSize: v })}
                  options={[
                    { value: "ig", label: "社媒 1080" },
                    { value: "x", label: "高清 2160" },
                    { value: "original", label: "原始 2×" },
                  ]}
                />
                <FieldSelect
                  label="格式"
                  value={state.exportFormat}
                  onChange={(v) => patch({ exportFormat: v })}
                  options={[
                    { value: "jpg", label: "JPG" },
                    { value: "png", label: "PNG" },
                  ]}
                />
                <FieldSlider
                  label="目标体积"
                  min={1}
                  max={8}
                  value={state.maxMB || 2}
                  onChange={(v) => patch({ maxMB: v })}
                  format={(v) => `${v} MB`}
                />
                <Button className="w-full mt-2" variant="primary" onPress={onExport} isDisabled={!photos.length || busy}>
                  {busy ? "导出中…" : "导出图片"}
                </Button>
                <div className="text-[11px] text-[color:var(--muted)] mt-3 leading-relaxed">
                  当前拼贴主题：背景 {th.bg} · 文字 {th.ink} · 强调 {th.accent}
                </div>
              </div>
            </Tabs.Panel>
          </Tabs>
        </aside>

        <section className="stage" aria-label="拼贴预览">
          <div className="stage-toolbar">
            <div className="toolbar-group">
              <Button size="sm" variant="primary" onPress={() => (gridEditing ? resetGrid() : applyPreset(state.lastPreset || "pMosaic"))}>
                重新布局
              </Button>
              <Button size="sm" variant="secondary" onPress={shufflePhotos} isDisabled={photos.length < 2}>
                排序
              </Button>
              <Button size="sm" variant="ghost" onPress={undoGrid} isDisabled={!gridPast.current.length} aria-label="撤销">
                ↶
              </Button>
              <Button size="sm" variant="ghost" onPress={redoGrid} isDisabled={!gridFuture.current.length} aria-label="重做">
                ↷
              </Button>
            </div>
            <div className="stage-context">
              <span>{LAYOUTS.find((l) => l.id === state.layout)?.name || state.layout}</span>
              <span className="stage-context-meta">{state.ratio} · {state.theme} · {size.w}×{size.h}</span>
            </div>
            <div className="toolbar-group toolbar-actions">
              <Button size="sm" variant="secondary" onPress={shufflePhotos} isDisabled={photos.length < 2}>
                随机布局
              </Button>
              <Button size="sm" variant="primary" onPress={onExport} isDisabled={!photos.length || busy}>
                {busy ? "导出中…" : "导出 JPG"}
              </Button>
            </div>
          </div>
          <div className="stage-inner" ref={previewWrapRef}>
            <div className={`canvas-frame${gridEditing ? " is-editing" : ""}`}>
              <canvas ref={canvasRef} />
              {state.layout === "yt-short" && availability.hasMedia && (
                <YtShortOverlay
                  state={state}
                  onToggle={(key) => updateUi(key, !state.ui?.[key])}
                />
              )}
              {availability.showSignaturePanel && state.signature?.enabled && (state.signature.text || state.signature.imageData || state.signature.imageAsset) && (
                <div
                  className="signature-handle"
                  role="button"
                  tabIndex={0}
                  aria-label="拖动签名位置"
                  title="拖动签名到任意位置"
                  style={{ left: `${(sigAnchor.x / size.w) * 100}%`, top: `${(sigAnchor.y / size.h) * 100}%` }}
                  onPointerDown={onSignaturePointerDown}
                  onPointerMove={onSignaturePointerMove}
                  onPointerUp={onSignaturePointerUp}
                  onPointerCancel={onSignaturePointerUp}
                  onKeyDown={onSignatureKeyDown}
                />
              )}
              {gridEditing && gridGeo?.kind === "freeform" && (
                <FreeformOverlay
                  graph={grid.freeform}
                  geo={gridGeo}
                  canvasRef={canvasRef}
                  tool={freeformTool}
                  selectedRegion={selectedRegion}
                  onRegionPick={setSelectedRegion}
                  onGraphChange={onFreeformGraphChange}
                  onGraphBegin={onGridBegin}
                  onGraphCommit={onGridCommit}
                />
              )}
              {gridEditing && gridGeo?.kind !== "freeform" && (
                <CustomGridOverlay
                  grid={grid}
                  geo={gridGeo}
                  canvasRef={canvasRef}
                  selected={selectedCells}
                  multi={shapeMulti}
                  onGridChange={onGridDrag}
                  onGridBegin={onGridBegin}
                  onGridCommit={onGridCommit}
                  onToggleCell={onToggleCell}
                  onSetSelection={onSetSelection}
                  onPickCell={onPickCell}
                />
              )}
            </div>
          </div>
          <div className="stage-filmstrip">
            <div className="filmstrip-heading">
              <span>图片</span>
              <span className="filmstrip-count">{photos.length} 张</span>
            </div>
            <div className="filmstrip">
              {photos.length ? photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`film-thumb ${state.activeId === p.id ? "is-active" : ""}`}
                  onClick={() => patch({ activeId: p.id })}
                  title={p.name}
                >
                  <img src={p.url} alt={p.name} />
                </button>
              )) : <button type="button" className="filmstrip-empty" onClick={openImages}>选择图片开始拼贴</button>}
            </div>
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[color:var(--overlay)] border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
