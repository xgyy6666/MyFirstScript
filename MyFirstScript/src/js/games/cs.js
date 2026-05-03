var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_cs_vision = null;
try { __mfs_cs_vision = require("../core/vision.js"); } catch (e) {}
if (!__mfs_cs_vision) try { __mfs_cs_vision = (typeof global !== "undefined" ? global.__mfs_vision : this.__mfs_vision) || null; } catch (e2) {}

var __mfs_cs_state = {
    yolo: null,
    yoloOk: false,
    yoloKey: "",
    lastToastMs: 0,
    captureReady: false,
    landscapeDiagnoseCount: 0,
    rawSaveProbeDone: false,
    captureFallbackCount: 0,
    captureSourceCompareCount: 0,
    lowThresholdProbeCount: 0,
    classCoverageDiagCount: 0,
    savedNoLunPanProbeFrame: false
};

function csCreateDefaultConfig() {
    return {
        enabled: true,
        modelPath: "/sdcard/MyFirstScript/models/SJZ.onnx",
        labels: ["TuBiao_AnJianSheZhiFanHui", "TuBiao_BiTe", "TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_FuChong", "TuBiao_HaiZhua", "TuBiao_JiNeng", "TuBiao_KaiHuo", "TuBiao_LunPan", "TuBiao_PaXia", "TuBiao_ShangSheng", "TuBiao_SheZhi", "TuBiao_SheZhiFanHui", "TuBiao_TanChuangFanHui", "TuBiao_TouZhi", "TuBiao_TuiChu", "TuBiao_XiaJiang", "TuBiao_YinYi"],
        repairMissingDefaultLabels: true,
        forceModelLabelOrder: true,
        boxThreshold: 0.25,
        iouThreshold: 0.35,
        confidence: 0.40,
        diagnoseRawCandidates: true,
        lowThresholdProbe: true,
        numThread: 2,
        loopTimes: 0,
        intervalMs: 1000,
        toastIntervalMs: 5000,
        showToast: false,
        saveDebugImage: false,
        saveAnnotatedImage: true,
        saveNoLunPanProbeFrame: true,
        diagnoseLandscape: true,
        compareCaptureSources: true,
        debugImagePath: "/sdcard/MyFirstScript/cs_yolo_runtime.png",
        annotatedImagePath: "/sdcard/Download/cs_yolo_annotated.png"
    };
}

function csLog(msg, hooks) {
    try {
        hooks && hooks.log ? hooks.log(msg) : logd(msg);
    } catch (e) {
    }
}

function csToast(msg, cfg) {
    try {
        if (!cfg || !cfg.showToast) return;
        let now = new Date().getTime();
        let interval = cfg.toastIntervalMs || 5000;
        if (now - __mfs_cs_state.lastToastMs < interval) return;
        __mfs_cs_state.lastToastMs = now;
        toast(msg);
    } catch (e) {
    }
}

function csStop(hooks) {
    try {
        return hooks && hooks.shouldStop ? hooks.shouldStop() : false;
    } catch (e) {
        return false;
    }
}

function csIsNum(v) {
    return typeof v === "number" && !isNaN(v);
}

function csParseLabels(value) {
    if (value && value.length && typeof value !== "string") return value;
    let text = String(value || "").replace(/\n/g, ",").replace(/;/g, ",").replace(/\|/g, ",");
    let parts = text.split(",");
    let result = [];
    for (let i = 0; i < parts.length; i++) {
        let item = String(parts[i] || "").trim();
        if (item) result.push(item);
    }
    return result;
}

function csLabelsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (String(a[i]) !== String(b[i])) return false;
    }
    return true;
}

function csEnsureLabelListComplete(cfg, hooks) {
    let defaults = csCreateDefaultConfig().labels;
    let labels = cfg.labels || [];
    if (cfg.forceModelLabelOrder !== false && !csLabelsEqual(labels, defaults)) {
        csLog("【CS-YOLO诊断】传入 labels 与 SJZ.onnx 真实 names 不一致，已强制改为 ONNX names 顺序。旧顺序=" + labels.join(" | "), hooks);
        cfg.labels = defaults.slice(0);
        return;
    }
    let exists = {};
    for (let i = 0; i < labels.length; i++) exists[String(labels[i])] = true;
    let missing = [];
    for (let j = 0; j < defaults.length; j++) {
        if (!exists[String(defaults[j])]) missing.push(defaults[j]);
    }
    if (missing.length > 0) {
        csLog("【CS-YOLO诊断】labels 配置缺失默认类别: " + missing.join(",") + "。这会导致 Android 识别结果与 Python 类别映射不一致。", hooks);
        if (cfg.repairMissingDefaultLabels !== false) {
            cfg.labels = labels.concat(missing);
            csLog("【CS-YOLO诊断】已临时补齐 labels，但仍建议检查训练 data.yaml 的真实 names 顺序。", hooks);
        }
    }
}

function csMergeConfig(input) {
    let cfg = csCreateDefaultConfig();
    if (input) {
        for (let k in input) cfg[k] = input[k];
    }
    cfg.labels = csParseLabels(cfg.labels);
    if (!cfg.labels || cfg.labels.length === 0) cfg.labels = csCreateDefaultConfig().labels;
    cfg.boxThreshold = parseFloat(cfg.boxThreshold);
    cfg.iouThreshold = parseFloat(cfg.iouThreshold);
    cfg.confidence = parseFloat(cfg.confidence);
    cfg.numThread = parseInt(cfg.numThread, 10);
    cfg.loopTimes = parseInt(cfg.loopTimes, 10);
    cfg.intervalMs = parseInt(cfg.intervalMs, 10);
    cfg.toastIntervalMs = parseInt(cfg.toastIntervalMs, 10);
    if (!(cfg.boxThreshold > 0 && cfg.boxThreshold <= 1)) cfg.boxThreshold = 0.25;
    if (!(cfg.iouThreshold > 0 && cfg.iouThreshold <= 1)) cfg.iouThreshold = 0.35;
    if (!(cfg.confidence >= 0 && cfg.confidence <= 1)) cfg.confidence = 0.40;
    if (!(cfg.numThread > 0)) cfg.numThread = 2;
    if (!(cfg.loopTimes >= 0)) cfg.loopTimes = 0;
    if (!(cfg.intervalMs >= 500)) cfg.intervalMs = 1000;
    if (!(cfg.toastIntervalMs >= 1000)) cfg.toastIntervalMs = 5000;
    cfg.modelPath = String(cfg.modelPath || "").trim();
    cfg.debugImagePath = String(cfg.debugImagePath || "/sdcard/MyFirstScript/cs_yolo_runtime.png").trim();
    cfg.annotatedImagePath = String(cfg.annotatedImagePath || "/sdcard/Download/cs_yolo_annotated.png").trim();
    if (typeof cfg.showToast === "string") cfg.showToast = cfg.showToast === "true" || cfg.showToast === "1" || cfg.showToast === "开启" || cfg.showToast === "是";
    if (typeof cfg.saveDebugImage === "string") cfg.saveDebugImage = cfg.saveDebugImage === "true" || cfg.saveDebugImage === "1" || cfg.saveDebugImage === "开启" || cfg.saveDebugImage === "是";
    if (typeof cfg.saveAnnotatedImage === "string") cfg.saveAnnotatedImage = cfg.saveAnnotatedImage === "true" || cfg.saveAnnotatedImage === "1" || cfg.saveAnnotatedImage === "开启" || cfg.saveAnnotatedImage === "是";
    if (typeof cfg.saveNoLunPanProbeFrame === "string") cfg.saveNoLunPanProbeFrame = cfg.saveNoLunPanProbeFrame !== "false" && cfg.saveNoLunPanProbeFrame !== "0" && cfg.saveNoLunPanProbeFrame !== "关闭" && cfg.saveNoLunPanProbeFrame !== "否";
    if (typeof cfg.diagnoseLandscape === "string") cfg.diagnoseLandscape = cfg.diagnoseLandscape === "true" || cfg.diagnoseLandscape === "1" || cfg.diagnoseLandscape === "开启" || cfg.diagnoseLandscape === "是";
    if (typeof cfg.diagnoseRawCandidates === "string") cfg.diagnoseRawCandidates = cfg.diagnoseRawCandidates === "true" || cfg.diagnoseRawCandidates === "1" || cfg.diagnoseRawCandidates === "开启" || cfg.diagnoseRawCandidates === "是";
    if (typeof cfg.compareCaptureSources === "string") cfg.compareCaptureSources = cfg.compareCaptureSources !== "false" && cfg.compareCaptureSources !== "0" && cfg.compareCaptureSources !== "关闭" && cfg.compareCaptureSources !== "否";
    if (typeof cfg.lowThresholdProbe === "string") cfg.lowThresholdProbe = cfg.lowThresholdProbe !== "false" && cfg.lowThresholdProbe !== "0" && cfg.lowThresholdProbe !== "关闭" && cfg.lowThresholdProbe !== "否";
    if (typeof cfg.forceModelLabelOrder === "string") cfg.forceModelLabelOrder = cfg.forceModelLabelOrder !== "false" && cfg.forceModelLabelOrder !== "0" && cfg.forceModelLabelOrder !== "关闭" && cfg.forceModelLabelOrder !== "否";
    if (typeof cfg.repairMissingDefaultLabels === "string") cfg.repairMissingDefaultLabels = cfg.repairMissingDefaultLabels !== "false" && cfg.repairMissingDefaultLabels !== "0" && cfg.repairMissingDefaultLabels !== "关闭" && cfg.repairMissingDefaultLabels !== "否";
    return cfg;
}

function csReleaseYolo() {
    try {
        if (__mfs_cs_state.yolo) __mfs_cs_state.yolo.release();
    } catch (e) {
    }
    __mfs_cs_state.yolo = null;
    __mfs_cs_state.yoloOk = false;
    __mfs_cs_state.yoloKey = "";
    __mfs_cs_state.captureReady = false;
}

function csEnsureCapture(hooks) {
    if (__mfs_cs_state.captureReady) return true;
    try {
        __mfs_cs_state.captureReady = !!image.requestScreenCapture(10000, 0);
        csLog(__mfs_cs_state.captureReady ? "【CS-YOLO】截图权限申请成功" : "【CS-YOLO】截图权限申请失败", hooks);
        return __mfs_cs_state.captureReady;
    } catch (e) {
        csLog("【CS-YOLO】申请截图权限异常: " + e, hooks);
        __mfs_cs_state.captureReady = false;
        return false;
    }
}

function csEnsureYolo(cfg, hooks) {
    if (!cfg.modelPath) {
        csLog("【CS-YOLO】模型路径为空", hooks);
        return false;
    }
    try {
        if (typeof file !== "undefined" && file && typeof file.exists === "function" && !file.exists(cfg.modelPath)) {
            csLog("【CS-YOLO】模型文件不存在: " + cfg.modelPath, hooks);
            return false;
        }
    } catch (e0) {
    }
    let labels = csParseLabels(cfg.labels);
    if (!labels || labels.length === 0) labels = csCreateDefaultConfig().labels;
    cfg.labels = labels;
    let labelKey = "";
    for (let i = 0; i < labels.length; i++) {
        if (i > 0) labelKey += ",";
        labelKey += String(labels[i]);
    }
    let key = cfg.modelPath + "|" + labelKey + "|" + cfg.boxThreshold + "|" + cfg.iouThreshold + "|" + cfg.numThread;
    if (__mfs_cs_state.yoloOk && __mfs_cs_state.yolo && __mfs_cs_state.yoloKey === key) return true;
    csReleaseYolo();
    try {
        if (typeof yolov8Api === "undefined" || !yolov8Api || typeof yolov8Api.newYolov8Onxx !== "function") {
            csLog("【CS-YOLO】yolov8Api 不可用", hooks);
            return false;
        }
        let ins = yolov8Api.newYolov8Onxx();
        let tmp = yolov8Api.newYolov8Onxx();
        if (!ins || !tmp) {
            csLog("【CS-YOLO】创建 YOLO 实例失败", hooks);
            return false;
        }
        let yoloConfig = tmp.getOnnxConfig(labels, 0, 0, cfg.boxThreshold, cfg.iouThreshold, cfg.numThread);
        try { tmp.release(); } catch (e1) {}
        if (!yoloConfig) {
            try { ins.release(); } catch (e2) {}
            csLog("【CS-YOLO】创建 ONNX 配置失败", hooks);
            return false;
        }
        let ok = !!ins.initYoloModel(yoloConfig, cfg.modelPath, null);
        if (!ok) {
            try { ins.release(); } catch (e3) {}
            csLog("【CS-YOLO】模型初始化失败: " + cfg.modelPath, hooks);
            return false;
        }
        __mfs_cs_state.yolo = ins;
        __mfs_cs_state.yoloOk = true;
        __mfs_cs_state.yoloKey = key;
        csLog("【CS-YOLO】模型初始化成功: " + cfg.modelPath, hooks);
        return true;
    } catch (e) {
        csLog("【CS-YOLO】初始化异常: " + e, hooks);
        csReleaseYolo();
        return false;
    }
}

function csGetLabel(item) {
    return String(item && (item.name || item.label || item.className || item.class || item.cls) || "");
}

function csGetConfidence(item) {
    let v = parseFloat(item && (item.confidence || item.score || item.prob || item.conf));
    return isNaN(v) ? 0 : v;
}

function csGetCenter(item) {
    if (!item) return null;
    if (csIsNum(item.x) && csIsNum(item.y)) return { x: Math.floor(item.x), y: Math.floor(item.y) };
    if (csIsNum(item.centerX) && csIsNum(item.centerY)) return { x: Math.floor(item.centerX), y: Math.floor(item.centerY) };
    if (csIsNum(item.cx) && csIsNum(item.cy)) return { x: Math.floor(item.cx), y: Math.floor(item.cy) };
    if (csIsNum(item.left) && csIsNum(item.right) && csIsNum(item.top) && csIsNum(item.bottom)) return { x: Math.floor((item.left + item.right) / 2), y: Math.floor((item.top + item.bottom) / 2) };
    if (csIsNum(item.x1) && csIsNum(item.x2) && csIsNum(item.y1) && csIsNum(item.y2)) return { x: Math.floor((item.x1 + item.x2) / 2), y: Math.floor((item.y1 + item.y2) / 2) };
    if (csIsNum(item.x) && csIsNum(item.y) && csIsNum(item.width) && csIsNum(item.height)) return { x: Math.floor(item.x + item.width / 2), y: Math.floor(item.y + item.height / 2) };
    let b = item.bounds || item.rect || item.box || null;
    if (b && csIsNum(b.left) && csIsNum(b.right) && csIsNum(b.top) && csIsNum(b.bottom)) return { x: Math.floor((b.left + b.right) / 2), y: Math.floor((b.top + b.bottom) / 2) };
    if (b && csIsNum(b.x1) && csIsNum(b.x2) && csIsNum(b.y1) && csIsNum(b.y2)) return { x: Math.floor((b.x1 + b.x2) / 2), y: Math.floor((b.y1 + b.y2) / 2) };
    if (b && csIsNum(b.x) && csIsNum(b.y) && csIsNum(b.width) && csIsNum(b.height)) return { x: Math.floor(b.x + b.width / 2), y: Math.floor(b.y + b.height / 2) };
    return null;
}

function csCaptureScreenBySource(source, hooks) {
    try {
        if (source === "ex" && image && typeof image.captureFullScreenEx === "function") return image.captureFullScreenEx();
    } catch (e) {
        csLog("【CS-YOLO截图诊断】captureFullScreenEx异常: " + e, hooks);
    }
    try {
        if (source === "normal" && image && typeof image.captureFullScreen === "function") return image.captureFullScreen();
    } catch (e2) {
        csLog("【CS-YOLO截图诊断】captureFullScreen异常: " + e2, hooks);
    }
    return null;
}

function csCaptureScreen(hooks) {
    let img = null;
    for (let captureTry = 0; captureTry < 5 && !img; captureTry++) {
        let candidate = csCaptureScreenBySource("ex", hooks) || csCaptureScreenBySource("normal", hooks);
        let size = csGetImageSize(candidate);
        if (candidate && size.width > 0 && size.height > 0) {
            img = candidate;
            break;
        }
        try { if (candidate) image.recycle(candidate); } catch (er) {}
        sleep(250);
    }
    if (!img) csLog("【CS-YOLO】截图失败或截图尺寸为0，请确认已授予截图权限/屏幕录制权限", hooks);
    return img;
}

function csGetImageSize(img) {
    let info = { width: 0, height: 0 };
    try { if (img && typeof img.getWidth === "function") info.width = Number(img.getWidth()) || 0; } catch (e) {}
    try { if (img && typeof img.getHeight === "function") info.height = Number(img.getHeight()) || 0; } catch (e2) {}
    try {
        if (!info.width && img && img.width !== undefined) info.width = Number(img.width) || 0;
        if (!info.height && img && img.height !== undefined) info.height = Number(img.height) || 0;
    } catch (e3) {}
    return info;
}

function csGetScreenSize() {
    let info = { width: 0, height: 0 };
    try { info.width = Number(device.getScreenWidth()) || 0; } catch (e) {}
    try { info.height = Number(device.getScreenHeight()) || 0; } catch (e2) {}
    return info;
}

function csDiagnoseLandscape(img, rawArr, passed, cfg, hooks) {
    if (!cfg.diagnoseLandscape) return;
    __mfs_cs_state.landscapeDiagnoseCount++;
    if (__mfs_cs_state.landscapeDiagnoseCount > 3 && __mfs_cs_state.landscapeDiagnoseCount % 10 !== 0) return;
    let screen = csGetScreenSize();
    let imgSize = csGetImageSize(img);
    let sw = screen.width, sh = screen.height, iw = imgSize.width, ih = imgSize.height;
    let screenOri = sw > sh ? "横屏" : (sw < sh ? "竖屏" : "方屏");
    let imgOri = iw > ih ? "横屏" : (iw < ih ? "竖屏" : "方屏");
    csLog("【CS-YOLO横屏诊断】屏幕=" + sw + "x" + sh + "(" + screenOri + ")，截图=" + iw + "x" + ih + "(" + imgOri + ")", hooks);
    if (__mfs_cs_vision && typeof __mfs_cs_vision.diagnoseLandscapeIssue === "function") {
        try { __mfs_cs_vision.diagnoseLandscapeIssue(img, function (m) { csLog("【CS-YOLO" + m.replace(/^【/, "").replace(/^横屏诊断】/, "横屏诊断】"), hooks); }); } catch (ev) {}
    }
    if (sw && sh && iw && ih && ((sw > sh && iw < ih) || (sw < sh && iw > ih))) {
        csLog("【CS-YOLO横屏诊断】疑似屏幕旋转问题：横板游戏但截图方向与屏幕方向不一致，可能导致 YOLO 输入与 Python 视频不同", hooks);
    }
    if (sw && sh && iw && ih && (sw !== iw || sh !== ih)) {
        csLog("【CS-YOLO横屏诊断】屏幕尺寸和截图尺寸不一致，可能存在缩放/黑边/系统栏影响", hooks);
    }
    let arr = rawArr || [];
    let maxCoord = 0, outside = 0, relativeLike = 0, square640Like = 0;
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        let p = csGetCenter(item);
        let b = csGetBounds(item);
        if (p) {
            maxCoord = Math.max(maxCoord, Math.abs(p.x), Math.abs(p.y));
            if (sw && sh && (p.x < 0 || p.y < 0 || p.x > sw || p.y > sh)) outside++;
            if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) relativeLike++;
            if (p.x >= 0 && p.x <= 640 && p.y >= 0 && p.y <= 640) square640Like++;
        }
        if (b) {
            maxCoord = Math.max(maxCoord, Math.abs(b.x1), Math.abs(b.y1), Math.abs(b.x2), Math.abs(b.y2));
            if (b.x1 >= 0 && b.x1 <= 1 && b.y1 >= 0 && b.y1 <= 1 && b.x2 >= 0 && b.x2 <= 1 && b.y2 >= 0 && b.y2 <= 1) relativeLike++;
        }
    }
    csLog("【CS-YOLO横屏诊断】检测统计：原始=" + arr.length + "，过阈值=" + ((passed || []).length) + "，最大坐标=" + maxCoord.toFixed(2) + "，越界中心=" + outside, hooks);
    if (relativeLike > 0) csLog("【CS-YOLO横屏诊断】疑似返回相对坐标 0~1，需要乘以屏幕/截图宽高", hooks);
    if (arr.length > 0 && sw && sh && (sw > 640 || sh > 640) && square640Like === arr.length && maxCoord <= 640) csLog("【CS-YOLO横屏诊断】疑似返回 640x640 输入坐标，需要还原到真实截图/屏幕", hooks);
    if (outside > 0) csLog("【CS-YOLO横屏诊断】存在越界中心点，坐标系可能与屏幕方向/缩放不一致", hooks);
}

function csGetBounds(item) {
    if (!item) return null;
    if (csIsNum(item.left) && csIsNum(item.right) && csIsNum(item.top) && csIsNum(item.bottom)) return { x1: item.left, y1: item.top, x2: item.right, y2: item.bottom };
    if (csIsNum(item.x1) && csIsNum(item.x2) && csIsNum(item.y1) && csIsNum(item.y2)) return { x1: item.x1, y1: item.y1, x2: item.x2, y2: item.y2 };
    if (csIsNum(item.x) && csIsNum(item.y) && csIsNum(item.width) && csIsNum(item.height)) return { x1: item.x, y1: item.y, x2: item.x + item.width, y2: item.y + item.height };
    let b = item.bounds || item.rect || item.box || null;
    if (b && csIsNum(b.left) && csIsNum(b.right) && csIsNum(b.top) && csIsNum(b.bottom)) return { x1: b.left, y1: b.top, x2: b.right, y2: b.bottom };
    if (b && csIsNum(b.x1) && csIsNum(b.x2) && csIsNum(b.y1) && csIsNum(b.y2)) return { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
    if (b && csIsNum(b.x) && csIsNum(b.y) && csIsNum(b.width) && csIsNum(b.height)) return { x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height };
    if (b && b.length >= 4) {
        let minX = 999999, minY = 999999, maxX = -1, maxY = -1;
        for (let i = 0; i < b.length; i++) {
            let pt = b[i];
            let px = pt.x !== undefined ? pt.x : pt[0];
            let py = pt.y !== undefined ? pt.y : pt[1];
            if (!csIsNum(px) || !csIsNum(py)) continue;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
        }
        if (maxX >= 0 && maxY >= 0) return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    }
    return null;
}

function csMakeBoundsFromCenter(p) {
    if (!p || !csIsNum(p.x) || !csIsNum(p.y)) return null;
    let half = 48;
    return { x1: p.x - half, y1: p.y - half, x2: p.x + half, y2: p.y + half };
}

function csGetClassId(item, labels) {
    if (!item) return -1;
    let keys = ["classId", "class_id", "classIndex", "class_index", "index", "id", "cls"];
    for (let i = 0; i < keys.length; i++) {
        let v = item[keys[i]];
        if (v !== undefined && v !== null && !isNaN(parseInt(v, 10))) return parseInt(v, 10);
    }
    let label = csGetLabel(item);
    if (label && labels) {
        for (let j = 0; j < labels.length; j++) {
            if (String(labels[j]) === label) return j;
        }
    }
    return -1;
}

function csShortJson(obj, maxLen) {
    let s = "";
    try { s = JSON.stringify(obj); } catch (e) { s = String(obj); }
    maxLen = maxLen || 220;
    return s.length > maxLen ? s.substring(0, maxLen) + "..." : s;
}

function csLogLabelOrder(cfg, hooks) {
    let parts = [];
    for (let i = 0; i < (cfg.labels || []).length; i++) parts.push(i + ":" + cfg.labels[i]);
    csLog("【CS-YOLO诊断】当前传入模型的 labels 顺序: " + parts.join(" | "), hooks);
}

function csSaveImageObject(img, path, hooks, desc) {
    if (!img || !path) return false;
    try {
        if (typeof image.saveTo === "function") {
            image.saveTo(img, path);
            csLog("【CS-YOLO】已保存" + desc + ": " + path, hooks);
            return true;
        }
        if (img && typeof img.saveTo === "function") {
            img.saveTo(path);
            csLog("【CS-YOLO】已保存" + desc + ": " + path, hooks);
            return true;
        }
    } catch (e) {
        csLog("【CS-YOLO】保存" + desc + "失败: " + e, hooks);
    }
    return false;
}

function csTrySaveDebugImage(img, cfg, hooks) {
    if (!cfg.saveDebugImage || !img || !cfg.debugImagePath) return;
    csSaveImageObject(img, cfg.debugImagePath, hooks, "运行时截图");
}

function csDrawAnnotatedBitmap(bitmap, results) {
    let canvas = new android.graphics.Canvas(bitmap);
    let boxPaint = new android.graphics.Paint();
    boxPaint.setAntiAlias(true);
    boxPaint.setStrokeWidth(4);
    boxPaint.setStyle(android.graphics.Paint.Style.STROKE);
    boxPaint.setColor(android.graphics.Color.rgb(0, 180, 255));
    let textPaint = new android.graphics.Paint();
    textPaint.setAntiAlias(true);
    textPaint.setTextSize(32);
    textPaint.setStyle(android.graphics.Paint.Style.FILL);
    let bgPaint = new android.graphics.Paint();
    bgPaint.setStyle(android.graphics.Paint.Style.FILL);
    bgPaint.setColor(android.graphics.Color.argb(170, 0, 0, 0));
    for (let i = 0; i < results.length; i++) {
        let item = results[i];
        let b = item.bounds;
        if (!b) continue;
        textPaint.setColor(android.graphics.Color.rgb(0, 180, 255));
        canvas.drawRect(b.x1, b.y1, b.x2, b.y2, boxPaint);
        let classText = item.classId >= 0 ? "#" + item.classId + " " : "";
        let label = classText + item.label + " " + item.confidence.toFixed(2);
        let textWidth = textPaint.measureText(label);
        let textY = Math.max(34, b.y1 - 8);
        canvas.drawRect(b.x1, textY - 34, b.x1 + textWidth + 16, textY + 8, bgPaint);
        canvas.drawText(label, b.x1 + 8, textY, textPaint);
    }
}

function csTryMakeParentDir(path) {
    try {
        let p = String(path || "");
        let idx = p.lastIndexOf("/");
        if (idx > 0 && typeof file !== "undefined" && file && typeof file.mkdirs === "function") {
            file.mkdirs(p.substring(0, idx));
        }
    } catch (e) {}
}

function csFileExists(path) {
    try { return new java.io.File(String(path || "")).exists(); } catch (e) {}
    try { return typeof file !== "undefined" && file && typeof file.exists === "function" && file.exists(path); } catch (e2) {}
    return false;
}

function csScanSavedImage(path) {
    try {
        if (typeof android === "undefined") return;
        let ctx = null;
        try { ctx = context; } catch (e0) {}
        if (!ctx) try { ctx = activity; } catch (e1) {}
        if (ctx && android.media && android.media.MediaScannerConnection) {
            android.media.MediaScannerConnection.scanFile(ctx, [String(path)], ["image/png"], null);
        }
    } catch (e) {}
}

function csWriteBitmapPng(bitmap, path, hooks) {
    let out = null;
    try {
        csTryMakeParentDir(path);
        out = new java.io.FileOutputStream(String(path));
        let ok = bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out);
        out.flush();
        try { out.getFD().sync(); } catch (es) {}
        try { out.close(); } catch (ec0) {}
        out = null;
        csScanSavedImage(path);
        let exists = csFileExists(path);
        csLog("【CS-YOLO】保存带框调试图尝试: " + path + "，compress=" + ok + "，存在=" + exists, hooks);
        return exists;
    } catch (e) {
        csLog("【CS-YOLO】保存带框调试图失败: " + path + "，错误=" + e, hooks);
        return false;
    } finally {
        try { if (out) out.close(); } catch (ec) {}
    }
}

function csListObjectFunctions(obj, limit) {
    let names = [];
    try {
        for (let k in obj) {
            try { if (typeof obj[k] === "function") names.push(k); } catch (e0) {}
            if (names.length >= limit) break;
        }
    } catch (e) {}
    return names.join(",");
}

function csLogImageCapabilities(img, hooks) {
    try {
        let imgFns = csListObjectFunctions(img, 30);
        let imageFns = (typeof image !== "undefined" && image) ? csListObjectFunctions(image, 60) : "";
        csLog("【CS-YOLO】截图对象能力: " + imgFns, hooks);
        csLog("【CS-YOLO】image接口能力: " + imageFns, hooks);
    } catch (e) {}
}

function csTrySaveRawScreenshotForDebug(img, cfg, hooks) {
    let paths = [
        "/storage/emulated/0/Download/cs_yolo_raw.png",
        "/sdcard/Download/cs_yolo_raw.png",
        "/storage/emulated/0/Pictures/cs_yolo_raw.png",
        "/sdcard/Pictures/cs_yolo_raw.png",
        "/sdcard/MyFirstScript/cs_yolo_raw.png"
    ];
    let saved = false;
    for (let i = 0; i < paths.length; i++) {
        let p = paths[i];
        if (csSaveImageObject(img, p, hooks, "原始截图")) {
            csScanSavedImage(p);
            csLog("【CS-YOLO】原始截图保存检查: " + p + "，存在=" + csFileExists(p), hooks);
            saved = true;
        }
    }
    if (!saved) csLog("【CS-YOLO】原始截图所有路径保存失败，说明当前 EasyClick 图片保存接口/存储权限不可用", hooks);
}

function csTrySaveAnnotatedImage(img, results, cfg, hooks) {
    if (!cfg.saveAnnotatedImage || !img || !cfg.annotatedImagePath) return;
    try {
        let bitmap = null;
        if (img && typeof img.getBitmap === "function") bitmap = img.getBitmap();
        else if (img && img.bitmap) bitmap = img.bitmap;
        if (!bitmap) {
            if (!__mfs_cs_state.rawSaveProbeDone) {
                __mfs_cs_state.rawSaveProbeDone = true;
                csLog("【CS-YOLO】无法获取截图Bitmap，先保存原始截图用于确认路径和权限", hooks);
                csLogImageCapabilities(img, hooks);
                csTrySaveRawScreenshotForDebug(img, cfg, hooks);
            }
            return;
        }
        let mutable = bitmap.copy(android.graphics.Bitmap.Config.ARGB_8888, true);
        csDrawAnnotatedBitmap(mutable, results || []);
        let paths = [
            cfg.annotatedImagePath,
            "/storage/emulated/0/Download/cs_yolo_annotated.png",
            "/sdcard/Download/cs_yolo_annotated.png",
            "/storage/emulated/0/Pictures/cs_yolo_annotated.png",
            "/sdcard/Pictures/cs_yolo_annotated.png",
            "/storage/emulated/0/DCIM/cs_yolo_annotated.png",
            "/sdcard/DCIM/cs_yolo_annotated.png",
            "/sdcard/MyFirstScript/cs_yolo_annotated.png"
        ];
        let saved = false;
        let used = {};
        for (let i = 0; i < paths.length; i++) {
            let p = String(paths[i] || "").trim();
            if (!p || used[p]) continue;
            used[p] = true;
            if (csWriteBitmapPng(mutable, p, hooks)) saved = true;
        }
        csLog(saved ? "【CS-YOLO】带框调试图至少一个路径保存成功" : "【CS-YOLO】带框调试图所有路径均保存失败，请检查 EasyClick 存储权限", hooks);
        try { if (mutable && mutable !== bitmap) mutable.recycle(); } catch (er) {}
    } catch (e) {
        csLog("【CS-YOLO】保存带框调试图总异常: " + e, hooks);
    }
}

function csBuildPassedFromRaw(arr, cfg) {
    let passed = [];
    for (let i = 0; i < (arr || []).length; i++) {
        let item = arr[i];
        let conf = csGetConfidence(item);
        if (conf < cfg.confidence) continue;
        let p = csGetCenter(item);
        let label = csGetLabel(item);
        let classId = csGetClassId(item, cfg.labels);
        let bounds = csGetBounds(item) || csMakeBoundsFromCenter(p);
        passed.push({ label: label, classId: classId, confidence: conf, x: p ? p.x : null, y: p ? p.y : null, bounds: bounds, raw: item });
    }
    return passed;
}

function csDetectRawOnImage(img, cfg, hooks, sourceName) {
    try {
        let size = csGetImageSize(img);
        if (!size.width || !size.height) {
            csLog("【CS-YOLO截图诊断】" + sourceName + " 截图尺寸无效=" + size.width + "x" + size.height + "，跳过本次推理", hooks);
            return [];
        }
        let raw = __mfs_cs_state.yolo.detectImage(img, cfg.labels);
        let arr = raw ? JSON.parse(raw) : [];
        if (cfg.compareCaptureSources) {
            csLog("【CS-YOLO截图诊断】" + sourceName + " 截图=" + size.width + "x" + size.height + "，原始候选=" + arr.length, hooks);
        }
        return arr;
    } catch (e) {
        csLog("【CS-YOLO截图诊断】" + sourceName + " 推理异常: " + e, hooks);
        return [];
    }
}

function csHasLabel(arr, labelName) {
    for (let i = 0; i < (arr || []).length; i++) {
        if (csGetLabel(arr[i]) === labelName) return true;
    }
    return false;
}

function csTryFallbackCaptureDetect(currentArr, cfg, hooks) {
    if (!cfg.compareCaptureSources) return null;
    let needsProbe = currentArr.length === 0 || !csHasLabel(currentArr, "TuBiao_LunPan");
    if (!needsProbe) return null;
    if (__mfs_cs_state.captureFallbackCount >= 8) return null;
    __mfs_cs_state.captureFallbackCount++;
    let alt = null;
    try {
        sleep(120);
        alt = csCaptureScreenBySource("normal", hooks);
        if (!alt) return null;
        let altArr = csDetectRawOnImage(alt, cfg, hooks, "fallback-normal");
        let primaryHasLunPan = csHasLabel(currentArr, "TuBiao_LunPan");
        let altHasLunPan = csHasLabel(altArr, "TuBiao_LunPan");
        if (altHasLunPan || altArr.length > currentArr.length) {
            csLog("【CS-YOLO截图诊断】fallback-normal 更优：主候选=" + currentArr.length + "，备用候选=" + altArr.length + "，主LunPan=" + primaryHasLunPan + "，备用LunPan=" + altHasLunPan + "。", hooks);
            return { img: alt, arr: altArr };
        }
        if (currentArr.length === 0 && altArr.length > 0) {
            csLog("【CS-YOLO截图诊断】主截图源候选为空，但 fallback-normal 有 " + altArr.length + " 个候选，后续建议优先使用 captureFullScreen。", hooks);
            return { img: alt, arr: altArr };
        }
    } catch (e) {
        csLog("【CS-YOLO截图诊断】备用截图检测异常: " + e, hooks);
    }
    try { if (alt) image.recycle(alt); } catch (e2) {}
    return null;
}

function csSummarizeMissingLabels(arr, cfg) {
    let seen = {};
    for (let i = 0; i < (arr || []).length; i++) {
        let id = csGetClassId(arr[i], cfg.labels);
        let label = csGetLabel(arr[i]);
        if (id >= 0) seen[id] = true;
        if (label) {
            for (let j = 0; j < cfg.labels.length; j++) {
                if (String(cfg.labels[j]) === label) seen[j] = true;
            }
        }
    }
    let missing = [];
    for (let k = 0; k < (cfg.labels || []).length; k++) {
        if (!seen[k]) missing.push("#" + k + " " + cfg.labels[k]);
    }
    return missing.join("，");
}

function csDiagnoseClassCoverage(arr, cfg, hooks) {
    if (!arr || arr.length === 0) return;
    __mfs_cs_state.classCoverageDiagCount++;
    if (__mfs_cs_state.classCoverageDiagCount > 3 && __mfs_cs_state.classCoverageDiagCount % 10 !== 0) return;
    let missing = csSummarizeMissingLabels(arr, cfg);
    csLog("【CS-YOLO类别诊断】当前模型返回类别覆盖缺失: " + (missing || "无") + "。若 Python 能识别缺失类，请优先核对训练 data.yaml names 顺序与 Android labels 是否完全一致。", hooks);
    if (missing.indexOf("#11 TuBiao_LunPan") >= 0) {
        csLog("【CS-YOLO类别诊断】LunPan 在 Android 原始候选中持续缺失，且 boxThreshold=0.05 仍缺失；倾向于模型/插件输出解析或类别顺序问题，不是业务 confidence 过滤。", hooks);
    }
}

function csSaveNoLunPanProbeFrame(img, arr, cfg, hooks) {
    if (!cfg.saveNoLunPanProbeFrame || __mfs_cs_state.savedNoLunPanProbeFrame || !img || !arr || arr.length === 0) return;
    if (csHasLabel(arr, "TuBiao_LunPan")) return;
    let p = "/sdcard/Download/cs_yolo_no_lunpan_probe.png";
    if (csSaveImageObject(img, p, hooks, "无LunPan探针截图")) {
        __mfs_cs_state.savedNoLunPanProbeFrame = true;
        csLog("【CS-YOLO类别诊断】已保存无LunPan但有其他候选的同帧截图: " + p + "。请用 Python 对这张图推理，确认是否真的应有 LunPan。", hooks);
    }
}

function csWithTemporaryYolo(cfg, boxThreshold, iouThreshold, hooks, fn) {
    let oldYolo = __mfs_cs_state.yolo;
    let oldOk = __mfs_cs_state.yoloOk;
    let oldKey = __mfs_cs_state.yoloKey;
    __mfs_cs_state.yolo = null;
    __mfs_cs_state.yoloOk = false;
    __mfs_cs_state.yoloKey = "";
    let probeCfg = {};
    for (let k in cfg) probeCfg[k] = cfg[k];
    probeCfg.boxThreshold = boxThreshold;
    probeCfg.iouThreshold = iouThreshold;
    try {
        if (!csEnsureYolo(probeCfg, hooks)) return null;
        return fn(probeCfg);
    } finally {
        try { if (__mfs_cs_state.yolo) __mfs_cs_state.yolo.release(); } catch (e) {}
        __mfs_cs_state.yolo = oldYolo;
        __mfs_cs_state.yoloOk = oldOk;
        __mfs_cs_state.yoloKey = oldKey;
    }
}

function csTryLowThresholdProbe(img, arr, cfg, hooks) {
    if (!cfg.lowThresholdProbe || !img || !arr || arr.length === 0) return arr;
    if (csHasLabel(arr, "TuBiao_LunPan")) return arr;
    if (__mfs_cs_state.lowThresholdProbeCount >= 5) return arr;
    __mfs_cs_state.lowThresholdProbeCount++;
    let probed = csWithTemporaryYolo(cfg, 0.05, cfg.iouThreshold, hooks, function (probeCfg) {
        return csDetectRawOnImage(img, probeCfg, hooks, "probe-box0.05");
    });
    if (!probed) return arr;
    let hasLunPan = csHasLabel(probed, "TuBiao_LunPan");
    csLog("【CS-YOLO阈值探针】boxThreshold 0.05 原始候选=" + probed.length + "，LunPan=" + hasLunPan + "。当前 boxThreshold=" + cfg.boxThreshold + "，原始候选=" + arr.length, hooks);
    if (hasLunPan) return probed;
    return arr;
}

function csLogRawCandidates(arr, cfg, hooks) {
    if (!cfg.diagnoseRawCandidates) return;
    if (!arr || arr.length === 0) {
        csLog("【CS-YOLO候选诊断】原始候选为空。若截图里有目标，可能是当前帧画面/模型输入/阈值前 NMS 问题。", hooks);
        return;
    }
    let lines = [];
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        let conf = csGetConfidence(item);
        let label = csGetLabel(item);
        let classId = csGetClassId(item, cfg.labels);
        let p = csGetCenter(item);
        let b = csGetBounds(item);
        let status = conf >= cfg.confidence ? "PASS" : "LOW";
        let classText = classId >= 0 ? "#" + classId + " " : "";
        let pos = p ? " @(" + p.x + "," + p.y + ")" : "";
        let box = b ? " box=(" + Math.round(b.x1) + "," + Math.round(b.y1) + "," + Math.round(b.x2) + "," + Math.round(b.y2) + ")" : "";
        lines.push(status + " " + classText + label + " " + conf.toFixed(2) + pos + box);
    }
    csLog("【CS-YOLO候选诊断】全部原始候选: " + lines.join("，"), hooks);
}

function csDetectOnce(inputConfig, hooks) {
    let cfg = csMergeConfig(inputConfig);
    if (!csEnsureYolo(cfg, hooks)) return [];
    let img = null;
    try {
        img = csCaptureScreen(hooks);
        if (!img) return [];
        csTrySaveDebugImage(img, cfg, hooks);
        let arr = csDetectRawOnImage(img, cfg, hooks, "primary-ex");
        let fallback = csTryFallbackCaptureDetect(arr, cfg, hooks);
        if (fallback) {
            try { image.recycle(img); } catch (er) {}
            img = fallback.img;
            arr = fallback.arr;
        }
        arr = csTryLowThresholdProbe(img, arr, cfg, hooks);
        csDiagnoseClassCoverage(arr, cfg, hooks);
        csSaveNoLunPanProbeFrame(img, arr, cfg, hooks);
        csLogRawCandidates(arr, cfg, hooks);
        let passed = csBuildPassedFromRaw(arr, cfg);
        csTrySaveAnnotatedImage(img, passed, cfg, hooks);
        csDiagnoseLandscape(img, arr, passed, cfg, hooks);
        csLogDetectResult(passed, arr.length, cfg, hooks);
        return passed;
    } catch (e) {
        csLog("【CS-YOLO】识别异常: " + e, hooks);
        return [];
    } finally {
        try { if (img) image.recycle(img); } catch (e2) {}
    }
}

function csLogDetectResult(passed, rawCount, cfg, hooks) {
    if (!passed || passed.length === 0) {
        csLog("【CS-YOLO】当前屏幕未识别到高于阈值 " + cfg.confidence + " 的标签，原始数量=" + rawCount, hooks);
        csToast("CS识别：未识别到标签", cfg);
        return;
    }
    let lines = [];
    for (let i = 0; i < passed.length; i++) {
        let item = passed[i];
        let classText = item.classId >= 0 ? "#" + item.classId + " " : "";
        let boxText = item.bounds ? " box=(" + Math.round(item.bounds.x1) + "," + Math.round(item.bounds.y1) + "," + Math.round(item.bounds.x2) + "," + Math.round(item.bounds.y2) + ")" : "";
        lines.push(classText + item.label + " " + item.confidence.toFixed(2) + (item.x !== null ? " @(" + item.x + "," + item.y + ")" : "") + boxText);
    }
    csLog("【CS-YOLO】识别结果: " + lines.join("，"), hooks);
    csLog("【CS-YOLO】识别统计: 过阈值=" + passed.length + "，原始数量=" + rawCount + "，阈值=" + cfg.confidence + "，带框图=" + (cfg.saveAnnotatedImage ? cfg.annotatedImagePath : "未启用"), hooks);
    for (let j = 0; j < passed.length && j < 5; j++) {
        csLog("【CS-YOLO诊断】raw[" + j + "]=" + csShortJson(passed[j].raw, 260), hooks);
    }
    csToast("CS识别 " + passed.length + " 个", cfg);
}

function csStart(inputConfig, hooks) {
    let cfg = csMergeConfig(inputConfig);
    if (!cfg.enabled) {
        csLog("【CS-YOLO】未启用，跳过", hooks);
        return [];
    }
    csLog("【CS-YOLO】模块版本: cs_yolo_real_onnx_names_fix_v1", hooks);
    csLog("【CS-YOLO】开始测试当前屏幕标签识别", hooks);
    csEnsureLabelListComplete(cfg, hooks);
    csLogLabelOrder(cfg, hooks);
    if (!csEnsureCapture(hooks)) return [];
    let last = [];
    let count = 0;
    let infinite = cfg.loopTimes <= 0;
    while (!csStop(hooks) && (infinite || count < cfg.loopTimes)) {
        count++;
        csLog("【CS-YOLO】第 " + count + (infinite ? " 次识别" : "/" + cfg.loopTimes + " 次识别"), hooks);
        last = csDetectOnce(cfg, hooks);
        if (!csStop(hooks)) sleep(cfg.intervalMs);
    }
    csLog("【CS-YOLO】测试结束", hooks);
    return last;
}

module.exports = {
    createDefaultConfig: csCreateDefaultConfig,
    start: csStart,
    detectOnce: csDetectOnce,
    releaseYolo: csReleaseYolo
};

try {
    if (typeof global !== "undefined") global.__mfs_cs = module.exports;
    else this.__mfs_cs = module.exports;
} catch (e) {
}
