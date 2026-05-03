var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_vision = null;
try { __mfs_vision = require("./vision.js"); } catch (e) {}
if (!__mfs_vision) try { __mfs_vision = (typeof global !== "undefined" ? global.__mfs_vision : this.__mfs_vision) || null; } catch (e2) {}

var SJZ_ONNX_LABELS = ["TuBiao_AnJianSheZhiFanHui", "TuBiao_BiTe", "TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_FuChong", "TuBiao_HaiZhua", "TuBiao_JiNeng", "TuBiao_KaiHuo", "TuBiao_LunPan", "TuBiao_PaXia", "TuBiao_ShangSheng", "TuBiao_SheZhi", "TuBiao_SheZhiFanHui", "TuBiao_TanChuangFanHui", "TuBiao_TouZhi", "TuBiao_TuiChu", "TuBiao_XiaJiang", "TuBiao_YinYi"];
var DEFAULT_MODEL_DIR = "/sdcard/MyFirstScript/models";
var DEFAULT_MODEL_PATH = DEFAULT_MODEL_DIR + "/SJZ.onnx";

var Holder = {
    instance: null,
    inited: false,
    key: ""
};

function log(msg, hooks, prefix) {
    try {
        if (hooks && hooks.log) hooks.log(msg);
        else if (typeof logd === "function") logd(msg);
    } catch (e) {
    }
}

function isNum(v) {
    return typeof v === "number" && !isNaN(v);
}

function parseList(value, fallback) {
    if (value && value.length && typeof value !== "string") return value;
    let text = String(value || "").replace(/\n/g, ",").replace(/;/g, ",").replace(/\|/g, ",");
    let parts = text.split(",");
    let result = [];
    for (let i = 0; i < parts.length; i++) {
        let item = String(parts[i] || "").trim();
        if (item) result.push(item);
    }
    return result.length > 0 ? result : (fallback || []);
}

function labelsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (String(a[i]) !== String(b[i])) return false;
    return true;
}

function normalizeConfig(input, gameName) {
    let cfg = input || {};
    let out = {};
    out.enabled = cfg.useYolo === true || cfg.yoloEnabled === true || cfg.enableYolo === true || cfg.useYolo === "true" || cfg.yoloEnabled === "true" || cfg.enableYolo === "true";
    out.modelPath = String(cfg.yoloOnnxPath || cfg.modelPath || DEFAULT_MODEL_PATH).trim() || DEFAULT_MODEL_PATH;
    out.labels = parseList(cfg.yoloLabels || cfg.labels, SJZ_ONNX_LABELS);
    if (cfg.yoloForceModelLabelOrder !== false && !labelsEqual(out.labels, SJZ_ONNX_LABELS)) {
        out.labels = SJZ_ONNX_LABELS.slice(0);
    }
    out.boxThr = Number(cfg.yoloBoxThr);
    if (isNaN(out.boxThr)) out.boxThr = 0.25;
    out.iouThr = Number(cfg.yoloIouThr);
    if (isNaN(out.iouThr)) out.iouThr = 0.35;
    out.confidence = Number(cfg.yoloConfidence);
    if (isNaN(out.confidence)) out.confidence = 0.60;
    out.verbose = cfg.yoloVerboseDiagnostics === true || cfg.yoloVerboseDiagnostics === "true" || cfg.yoloVerboseDiagnostics === "1";
    out.gameName = gameName || String(cfg.gameName || "通用");
    return out;
}

function release() {
    try { if (Holder.instance) Holder.instance.release(); } catch (e) {}
    Holder.instance = null;
    Holder.inited = false;
    Holder.key = "";
}

function getImageSize(img) {
    let info = { width: 0, height: 0 };
    try { if (img && typeof img.getWidth === "function") info.width = Number(img.getWidth()) || 0; } catch (e) {}
    try { if (img && typeof img.getHeight === "function") info.height = Number(img.getHeight()) || 0; } catch (e2) {}
    try {
        if (!info.width && img && img.width !== undefined) info.width = Number(img.width) || 0;
        if (!info.height && img && img.height !== undefined) info.height = Number(img.height) || 0;
    } catch (e3) {}
    return info;
}

function ensureModelPath(cfg, hooks) {
    try {
        if (cfg.modelPath && file.exists(cfg.modelPath)) return true;
    } catch (e) {}
    let lower = DEFAULT_MODEL_DIR + "/sjz.onnx";
    try {
        if (file.exists(DEFAULT_MODEL_PATH)) {
            cfg.modelPath = DEFAULT_MODEL_PATH;
            return true;
        }
        if (file.exists(lower)) {
            cfg.modelPath = lower;
            log("【" + cfg.gameName + "YOLO】使用小写模型路径: " + lower, hooks);
            return true;
        }
    } catch (e2) {}
    log("【" + cfg.gameName + "YOLO】模型不存在: " + cfg.modelPath + "，也未找到 " + DEFAULT_MODEL_PATH + " 或 " + lower, hooks);
    return false;
}

function ensure(cfg, hooks) {
    if (!cfg.enabled) return false;
    if (typeof yolov8Api === "undefined" || !yolov8Api || typeof yolov8Api.newYolov8Onxx !== "function") {
        log("【" + cfg.gameName + "YOLO】当前环境不支持 yolov8Api", hooks);
        return false;
    }
    if (!ensureModelPath(cfg, hooks)) return false;
    let key = cfg.modelPath + "|" + cfg.labels.join(",") + "|" + cfg.boxThr + "|" + cfg.iouThr;
    if (Holder.instance && Holder.inited && Holder.key === key) return true;
    release();
    try {
        let ins = yolov8Api.newYolov8Onxx();
        let tmp = yolov8Api.newYolov8Onxx();
        if (!ins || !tmp) return false;
        let yc = tmp.getOnnxConfig(cfg.labels, 0, 0, cfg.boxThr, cfg.iouThr, 2);
        try { tmp.release(); } catch (e0) {}
        if (!yc || !ins.initYoloModel(yc, cfg.modelPath, null)) {
            try { ins.release(); } catch (e1) {}
            log("【" + cfg.gameName + "YOLO】模型初始化失败: " + cfg.modelPath, hooks);
            return false;
        }
        Holder.instance = ins;
        Holder.inited = true;
        Holder.key = key;
        log("【" + cfg.gameName + "YOLO】模型初始化成功: " + cfg.modelPath, hooks);
        return true;
    } catch (e) {
        log("【" + cfg.gameName + "YOLO】初始化异常: " + e, hooks);
        release();
        return false;
    }
}

function yName(o) { return String(o && (o.name || o.label || o.className) || ""); }
function yConf(o) { let v = parseFloat(o && (o.confidence || o.score || o.prob || o.conf)); return isNaN(v) ? 0 : v; }
function center(o) {
    if (!o) return null;
    if (isNum(o.left) && isNum(o.right) && isNum(o.top) && isNum(o.bottom)) return { x: Math.floor((o.left + o.right) / 2), y: Math.floor((o.top + o.bottom) / 2), raw: o, confidence: yConf(o), name: yName(o) };
    if (isNum(o.x1) && isNum(o.x2) && isNum(o.y1) && isNum(o.y2)) return { x: Math.floor((o.x1 + o.x2) / 2), y: Math.floor((o.y1 + o.y2) / 2), raw: o, confidence: yConf(o), name: yName(o) };
    if (isNum(o.x) && isNum(o.y)) return { x: Math.floor(o.x), y: Math.floor(o.y), raw: o, confidence: yConf(o), name: yName(o) };
    return null;
}

function captureImage() {
    try {
        if (__mfs_vision && __mfs_vision.captureForLandscape) return __mfs_vision.captureForLandscape();
    } catch (e) {}
    try { return image.captureFullScreenEx() || image.captureFullScreen(); } catch (e2) {}
    return null;
}

function detectAll(inputCfg, hooks, gameName) {
    let cfg = normalizeConfig(inputCfg, gameName);
    if (!ensure(cfg, hooks)) return [];
    let img = null;
    try {
        img = captureImage();
        let size = getImageSize(img);
        if (!img || !size.width || !size.height) {
            log("【" + cfg.gameName + "YOLO诊断】截图尺寸无效=" + size.width + "x" + size.height + "，跳过本次YOLO", hooks);
            return [];
        }
        let raw = Holder.instance.detectImage(img, cfg.labels);
        let arr = raw ? JSON.parse(raw) : [];
        let result = [];
        for (let i = 0; i < arr.length; i++) {
            if (yConf(arr[i]) >= cfg.confidence) result.push(arr[i]);
        }
        if (result.length > 0) {
            let preview = [];
            for (let j = 0; j < result.length && j < 10; j++) {
                let p = center(result[j]);
                preview.push(yName(result[j]) + "@" + yConf(result[j]).toFixed(2) + (p ? "(" + p.x + "," + p.y + ")" : ""));
            }
            log("【" + cfg.gameName + "YOLO】识别结果: " + preview.join(", "), hooks);
        } else if (cfg.verbose) {
            log("【" + cfg.gameName + "YOLO】识别结果为空", hooks);
        }
        return result;
    } catch (e) {
        log("【" + cfg.gameName + "YOLO】识别异常: " + e, hooks);
        return [];
    } finally {
        try { if (img) image.recycle(img); } catch (e2) {}
    }
}

function detectBest(inputCfg, hooks, gameName, label) {
    let arr = detectAll(inputCfg, hooks, gameName);
    let best = null;
    for (let i = 0; i < arr.length; i++) {
        if (label && yName(arr[i]) !== label) continue;
        let p = center(arr[i]);
        if (!p) continue;
        if (!best || p.confidence > best.confidence) best = p;
    }
    return best;
}

module.exports = {
    labels: SJZ_ONNX_LABELS,
    defaultModelPath: DEFAULT_MODEL_PATH,
    normalizeConfig: normalizeConfig,
    ensure: ensure,
    release: release,
    detectAll: detectAll,
    detectBest: detectBest,
    center: center,
    yName: yName,
    yConf: yConf
};

try { if (typeof global !== "undefined") global.__mfs_sjz_yolo = module.exports; else this.__mfs_sjz_yolo = module.exports; } catch (e) {}
