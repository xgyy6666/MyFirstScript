var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_vision = null;
try { __mfs_vision = require("../core/vision.js"); } catch (e) {}
if (!__mfs_vision) try { __mfs_vision = (typeof global !== "undefined" ? global.__mfs_vision : this.__mfs_vision) || null; } catch (e2) {}

var __mfs_delta_state = { pts: {}, yolo: null, yoloOk: false, yoloKey: "", ocr: null, ocrOk: false, debugOverlay: null };
var __mfs_delta_model_dir = "/sdcard/MyFirstScript/models";
var __mfs_delta_model_path = __mfs_delta_model_dir + "/SJZ.onnx";
var __mfs_delta_model_asset_candidates = ["SJZ.onnx", "sjz.onnx", "res/SJZ.onnx", "res/sjz.onnx"];
var DELTA_SJZ_ONNX_LABELS = ["TuBiao_AnJianSheZhiFanHui", "TuBiao_BiTe", "TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_FuChong", "TuBiao_HaiZhua", "TuBiao_JiNeng", "TuBiao_KaiHuo", "TuBiao_LunPan", "TuBiao_PaXia", "TuBiao_ShangSheng", "TuBiao_SheZhi", "TuBiao_SheZhiFanHui", "TuBiao_TanChuangFanHui", "TuBiao_TouZhi", "TuBiao_TuiChu", "TuBiao_XiaJiang", "TuBiao_YinYi"];

function createDebugOverlay() {
    try {
        if (__mfs_delta_state.debugOverlay) return __mfs_delta_state.debugOverlay;
        if (typeof floaty === "undefined" || !floaty) return null;
        let overlay = floaty.rawWindow(
            <frame id="container" w="*" h="*" bg="#00000000">
                <canvas id="canvas" w="*" h="*"/>
            </frame>
        );
        overlay.setTouchable(false);
        overlay.setSize(-1, -1);
        overlay.setPosition(0, 0);
        __mfs_delta_state.debugOverlay = overlay;
        return overlay;
    } catch (e) {
        return null;
    }
}

function drawYoloResults(arr, hooks) {
    try {
        let overlay = createDebugOverlay();
        if (!overlay) return;
        let canvas = overlay.canvas;
        if (!canvas) return;
        ui.run(function() {
            try {
                canvas.on("draw", function(c) {
                    c.drawColor(android.graphics.Color.TRANSPARENT, android.graphics.PorterDuff.Mode.CLEAR);
                    let paint = new Paint();
                    paint.setStrokeWidth(4);
                    paint.setStyle(Paint.Style.STROKE);
                    let textPaint = new Paint();
                    textPaint.setTextSize(32);
                    textPaint.setStyle(Paint.Style.FILL);
                    for (let i = 0; i < arr.length; i++) {
                        let item = arr[i];
                        let bounds = getYoloBounds(item);
                        if (!bounds) continue;
                        let name = yName(item);
                        let conf = yConf(item);
                        paint.setColor(android.graphics.Color.rgb(0, 255, 0));
                        textPaint.setColor(android.graphics.Color.rgb(0, 255, 0));
                        c.drawRect(bounds.x1, bounds.y1, bounds.x2, bounds.y2, paint);
                        let label = name + " " + (conf * 100).toFixed(0) + "%";
                        c.drawText(label, bounds.x1, bounds.y1 - 10, textPaint);
                    }
                });
            } catch (e) {
                log("【三角洲YOLO】绘制识别框异常: " + e, hooks);
            }
        });
        sleep(100);
    } catch (e) {
        log("【三角洲YOLO】显示识别框异常: " + e, hooks);
    }
}

function clearDebugOverlay() {
    try {
        if (__mfs_delta_state.debugOverlay) {
            __mfs_delta_state.debugOverlay.close();
            __mfs_delta_state.debugOverlay = null;
        }
    } catch (e) {
    }
}

function createDefaultConfig() {
    return {
        enabled: true,
        task: "main",
        battlefieldBrick: false,
        deltaBattlefieldBrick: false,
        launchMode: "本地启动",
        packageName: "",
        startByPackage: false,
        startByNode: true,
        desktopNodeKeywords: ["三角洲行动", "三角洲"],
        launchTimeoutMs: 90000,
        enterGameTimeoutMs: 120000,
        yoloOnnxPath: __mfs_delta_model_path,
        yoloLabels: DELTA_SJZ_ONNX_LABELS.slice(0),
        yoloForceModelLabelOrder: true,
        yoloBoxThr: 0.25,
        yoloIouThr: 0.35,
        yoloConfidence: 0.60,
        yoloDebugOverlay: false,
        yoloVerboseDiagnostics: false,
        ocrPadding: 32,
        ocrMaxSideLen: 960,
        ocrTimeoutMs: 20000,
        mainCheckTimeoutMs: 5000,
        startActionTimeoutMs: 10000,
        deployCheckTimeoutMs: 1200,
        skipSettleTimeoutMs: 15000,
        skipSettleStableMs: 3000,
        redeployAfterComboTimeoutMs: 5000,
        clickMinDelayMs: 300,
        clickMaxDelayMs: 800,
        comboMinDelayMs: 900,
        comboMaxDelayMs: 1400,
        comboRoundDelayMs: 3000,
        scorePopupCheckMs: 10000,
        loopIdleMs: 600
    };
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
    if (result.length > 0) return result;
    if (fallback && fallback.length && typeof fallback !== "string") return fallback;
    if (typeof fallback === "string") {
        let fallbackParts = fallback.replace(/\n/g, ",").replace(/;/g, ",").replace(/\|/g, ",").split(",");
        for (let j = 0; j < fallbackParts.length; j++) {
            let fallbackItem = String(fallbackParts[j] || "").trim();
            if (fallbackItem) result.push(fallbackItem);
        }
    }
    return result;
}

function cfgMerge(input) {
    let c = createDefaultConfig();
    if (input) for (let k in input) c[k] = input[k];
    c.yoloLabels = parseList(c.yoloLabels, createDefaultConfig().yoloLabels);
    c.desktopNodeKeywords = parseList(c.desktopNodeKeywords, createDefaultConfig().desktopNodeKeywords);
    let numericKeys = ["yoloBoxThr", "yoloIouThr", "yoloConfidence", "ocrPadding", "ocrMaxSideLen", "ocrTimeoutMs", "mainCheckTimeoutMs", "startActionTimeoutMs", "deployCheckTimeoutMs", "skipSettleTimeoutMs", "skipSettleStableMs", "redeployAfterComboTimeoutMs", "clickMinDelayMs", "clickMaxDelayMs", "comboMinDelayMs", "comboMaxDelayMs", "comboRoundDelayMs", "scorePopupCheckMs", "loopIdleMs"];
    for (let i = 0; i < numericKeys.length; i++) {
        let key = numericKeys[i];
        let n = Number(c[key]);
        if (!isNaN(n)) c[key] = n;
    }
    c.yoloDebugOverlay = false;
    if (typeof c.yoloVerboseDiagnostics === "string") {
        c.yoloVerboseDiagnostics = c.yoloVerboseDiagnostics === "true" || c.yoloVerboseDiagnostics === "1" || c.yoloVerboseDiagnostics === "开启" || c.yoloVerboseDiagnostics === "是";
    }
    if (typeof c.yoloForceModelLabelOrder === "string") {
        c.yoloForceModelLabelOrder = c.yoloForceModelLabelOrder !== "false" && c.yoloForceModelLabelOrder !== "0" && c.yoloForceModelLabelOrder !== "关闭" && c.yoloForceModelLabelOrder !== "否";
    }
    if (c.yoloOnnxPath) c.yoloOnnxPath = String(c.yoloOnnxPath).trim();
    if (c.comboMinDelayMs < 800) c.comboMinDelayMs = 900;
    if (c.comboMaxDelayMs < c.comboMinDelayMs) c.comboMaxDelayMs = c.comboMinDelayMs + 500;
    if (!c.comboRoundDelayMs || c.comboRoundDelayMs < 2500) c.comboRoundDelayMs = 3000;
    return c;
}
function log(msg, hooks) { try { hooks && hooks.log ? hooks.log(msg) : logd(msg); } catch (e) {} }
function stop(hooks) { try { return hooks && hooks.shouldStop ? hooks.shouldStop() : false; } catch (e) { return false; } }
function now() { return new Date().getTime(); }
function rnd(a, b) { try { if (typeof random === "function") return random(a, b); } catch (e) {} return Math.floor(Math.random() * (b - a + 1)) + a; }
function delay(c, fast) { sleep(fast ? rnd(c.comboMinDelayMs, c.comboMaxDelayMs) : rnd(c.clickMinDelayMs, c.clickMaxDelayMs)); }
function isNum(v) { return typeof v === "number" && !isNaN(v); }
function safeBack(hooks) {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function") {
            let ret = shell.execShizukuCommand("input keyevent 4");
            let retStr = String(ret || "");
            let ok = ret == null || retStr === "" || (retStr.indexOf("Error") < 0 && retStr.indexOf("error") < 0);
            log("【三角洲】返回键(Shizuku): " + (ok ? "成功" : "失败 -> " + retStr), hooks);
            return ok;
        }
    } catch (e) { log("【三角洲】Shizuku返回键异常: " + e, hooks); }
    log("【三角洲】Shizuku不可用，返回键失败", hooks);
    return false;
}
function safeNativeClick(tx, ty, hooks) {
    let hasShizuku = typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function";
    log("【三角洲】点击通道: Shizuku=" + hasShizuku + " -> (" + tx + "," + ty + ")", hooks);
    if (!hasShizuku) {
        log("【三角洲】Shizuku不可用，点击失败。请确认Shizuku已激活且已授权EasyClick", hooks);
        return false;
    }
    try {
        let cmd = "input tap " + tx + " " + ty;
        let ret = shell.execShizukuCommand(cmd);
        let retStr = String(ret || "");
        let ok = ret == null || retStr === "" || (retStr.indexOf("Error") < 0 && retStr.indexOf("error") < 0 && retStr !== "false");
        if (ok) {
            log("【三角洲】Shizuku点击成功: (" + tx + "," + ty + ")", hooks);
        } else {
            log("【三角洲】Shizuku点击失败: " + retStr, hooks);
        }
        return ok;
    } catch (e) {
        log("【三角洲】Shizuku点击异常: " + e, hooks);
        return false;
    }
}
function tap(x, y, c, fast, desc, hooks) {
    if (!isNum(x) || !isNum(y)) {
        log("【三角洲】点击坐标无效" + (desc ? " -> " + desc : "") + ": x=" + x + ", y=" + y, hooks);
        return false;
    }
    let tx = Math.floor(x);
    let ty = Math.floor(y);
    try {
        log("【三角洲】点击" + (desc ? " -> " + desc : "") + ": (" + tx + "," + ty + ")", hooks);
        let ok = safeNativeClick(tx, ty, hooks);
        if (!ok) {
            log("【三角洲】点击返回失败" + (desc ? " -> " + desc : ""), hooks);
            return false;
        }
        delay(c, fast);
        return true;
    } catch (e) {
        log("【三角洲】点击异常" + (desc ? " -> " + desc : "") + ": " + e, hooks);
        return false;
    }
}
function center(o) {
    if (!o) return null;
    if (isNum(o.x) && isNum(o.y)) return { x: Math.floor(o.x), y: Math.floor(o.y), raw: o };
    if (isNum(o.centerX) && isNum(o.centerY)) return { x: Math.floor(o.centerX), y: Math.floor(o.centerY), raw: o };
    if (isNum(o.cx) && isNum(o.cy)) return { x: Math.floor(o.cx), y: Math.floor(o.cy), raw: o };
    if (isNum(o.left) && isNum(o.right) && isNum(o.top) && isNum(o.bottom)) {
        return { x: Math.floor((o.left + o.right) / 2), y: Math.floor((o.top + o.bottom) / 2), raw: o };
    }
    if (isNum(o.x1) && isNum(o.x2) && isNum(o.y1) && isNum(o.y2)) {
        return { x: Math.floor((o.x1 + o.x2) / 2), y: Math.floor((o.y1 + o.y2) / 2), raw: o };
    }
    if (isNum(o.x) && isNum(o.y) && isNum(o.width) && isNum(o.height)) {
        return { x: Math.floor(o.x + o.width / 2), y: Math.floor(o.y + o.height / 2), raw: o };
    }
    let b = o.bounds || o.rect || o.box || null;
    if (b && isNum(b.left) && isNum(b.right) && isNum(b.top) && isNum(b.bottom)) {
        return { x: Math.floor((b.left + b.right) / 2), y: Math.floor((b.top + b.bottom) / 2), raw: o };
    }
    if (b && isNum(b.x1) && isNum(b.x2) && isNum(b.y1) && isNum(b.y2)) {
        return { x: Math.floor((b.x1 + b.x2) / 2), y: Math.floor((b.y1 + b.y2) / 2), raw: o };
    }
    if (b && isNum(b.x) && isNum(b.y) && isNum(b.width) && isNum(b.height)) {
        return { x: Math.floor(b.x + b.width / 2), y: Math.floor(b.y + b.height / 2), raw: o };
    }
    if (o.box && o.box.length >= 4) {
        let minX = 999999, minY = 999999, maxX = -1, maxY = -1;
        for (let i = 0; i < o.box.length; i++) {
            let p = o.box[i];
            let px = p.x !== undefined ? p.x : p[0];
            let py = p.y !== undefined ? p.y : p[1];
            if (!isNum(px) || !isNum(py)) continue;
            if (px < minX) minX = px; if (py < minY) minY = py; if (px > maxX) maxX = px; if (py > maxY) maxY = py;
        }
        if (maxX >= 0 && maxY >= 0) return { x: Math.floor((minX + maxX) / 2), y: Math.floor((minY + maxY) / 2), raw: o };
    }
    if (o.points && o.points.length >= 2) {
        let minX2 = 999999, minY2 = 999999, maxX2 = -1, maxY2 = -1;
        for (let j = 0; j < o.points.length; j++) {
            let p2 = o.points[j];
            let px2 = p2.x !== undefined ? p2.x : p2[0];
            let py2 = p2.y !== undefined ? p2.y : p2[1];
            if (!isNum(px2) || !isNum(py2)) continue;
            if (px2 < minX2) minX2 = px2; if (py2 < minY2) minY2 = py2; if (px2 > maxX2) maxX2 = px2; if (py2 > maxY2) maxY2 = py2;
        }
        if (maxX2 >= 0 && maxY2 >= 0) return { x: Math.floor((minX2 + maxX2) / 2), y: Math.floor((minY2 + maxY2) / 2), raw: o };
    }
    return null;
}
function inRegion(p, r) { return !r || (p && p.x >= r.x1 && p.x <= r.x2 && p.y >= r.y1 && p.y <= r.y2); }

function ensureCapture(hooks) { try { return image.requestScreenCapture(10000, 0); } catch (e) { log("【三角洲】截图权限异常: " + e, hooks); return false; } }
function ensureOcr(c, hooks) {
    if (__mfs_delta_state.ocrOk && __mfs_delta_state.ocr) return true;
    try {
        if (typeof ocr === "undefined" || !ocr || typeof ocr.newOcr !== "function") return false;
        __mfs_delta_state.ocr = ocr.newOcr();
        if (!__mfs_delta_state.ocr) return false;
        __mfs_delta_state.ocrOk = !!__mfs_delta_state.ocr.initOcr({ type: "paddleOcrNcnnV5", padding: c.ocrPadding, maxSideLen: c.ocrMaxSideLen, numThread: 2 });
        log(__mfs_delta_state.ocrOk ? "【三角洲OCR】初始化成功" : "【三角洲OCR】初始化失败", hooks);
        return __mfs_delta_state.ocrOk;
    } catch (e) { log("【三角洲OCR】异常: " + e, hooks); __mfs_delta_state.ocrOk = false; return false; }
}
function ocrAll(c, hooks) {
    if (!ensureOcr(c, hooks)) return [];
    let img = null;
    try {
        img = (__mfs_vision && __mfs_vision.captureForLandscape) ? __mfs_vision.captureForLandscape() : (image.captureFullScreenEx() || image.captureFullScreen());
        let result = img ? (__mfs_delta_state.ocr.ocrImage(img, c.ocrTimeoutMs, {}) || []) : [];
        if (result && result.length > 0) {
            let preview = [];
            for (let i = 0; i < result.length && i < 20; i++) {
                let item = result[i];
                let label = String(item.label || item.text || item.words || "");
                let p = center(item);
                if (p) {
                    preview.push(label + "@(" + p.x + "," + p.y + ")");
                } else {
                    preview.push(label);
                }
            }
            log("【三角洲OCR】识别到 " + result.length + " 个文字: " + preview.join(", ") + (result.length > 20 ? "..." : ""), hooks);
        }
        return result;
    }
    catch (e) { log("【三角洲OCR】识别异常: " + e, hooks); return []; }
    finally { try { if (img) image.recycle(img); } catch (e2) {} }
}
function findText(txt, c, hooks, opt) {
    opt = opt || {}; let arr = ocrAll(c, hooks), t = String(txt || "").trim();
    let candidates = [];
    for (let i = 0; i < arr.length; i++) {
        let it = arr[i], s = String(it.label || it.text || it.words || "");
        if (s.indexOf(t) >= 0) {
            let p = center(it);
            if (!p) {
                try { log("【三角洲OCR】命中文字但坐标解析失败: " + txt + " -> " + JSON.stringify(it), hooks); } catch (e0) { log("【三角洲OCR】命中文字但坐标解析失败: " + txt, hooks); }
                continue;
            }
            if (inRegion(p, opt.region)) {
                log("【三角洲OCR】命中: " + txt + " -> (" + p.x + "," + p.y + ")", hooks);
                return p;
            } else {
                candidates.push({ text: s, x: p.x, y: p.y, inRegion: false });
            }
        }
    }
    if (candidates.length > 0 && opt.region) {
        let regionStr = "[" + opt.region.x1 + "," + opt.region.y1 + "," + opt.region.x2 + "," + opt.region.y2 + "]";
        log("【三角洲OCR】找到 " + candidates.length + " 个候选但不在区域 " + regionStr + " 内: " + JSON.stringify(candidates), hooks);
    }
    return null;
}
function waitText(txt, c, hooks, opt) {
    opt = opt || {}; let end = now() + (opt.timeoutMs === undefined ? 10000 : opt.timeoutMs), iv = opt.intervalMs || 500;
    while (!stop(hooks) && now() <= end) { let p = findText(txt, c, hooks, opt); if (p) return p; sleep(iv); }
    return null;
}
function clickText(txt, c, hooks, opt) {
    opt = opt || {};
    try {
        log("【三角洲OCR】等待点击文字: " + txt, hooks);
        let p = waitText(txt, c, hooks, opt);
        if (!p || !isNum(p.x) || !isNum(p.y)) {
            log("【三角洲OCR】点击坐标无效: " + txt, hooks);
            return false;
        }
        let tx = Math.floor(p.x);
        let ty = Math.floor(p.y);
        log("【三角洲OCR】准备点击文字: " + txt + " -> (" + tx + "," + ty + ")", hooks);
        let ok = safeNativeClick(tx, ty, hooks);
        if (!ok) {
            log("【三角洲OCR】点击失败: " + txt, hooks);
            return false;
        }
        delay(c, !!opt.fast);
        return true;
    } catch (e) {
        log("【三角洲OCR】点击文字异常: " + txt + " -> " + e, hooks);
        return false;
    }
}

function releaseYolo() { try { if (__mfs_delta_state.yolo) __mfs_delta_state.yolo.release(); } catch (e) {} __mfs_delta_state.yolo = null; __mfs_delta_state.yoloOk = false; __mfs_delta_state.yoloKey = ""; }
function labelsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (String(a[i]) !== String(b[i])) return false;
    return true;
}
function ensureDeltaModelFile(c, hooks) {
    let configured = String(c && c.yoloOnnxPath || "").trim();
    if (configured) {
        try {
            if (file.exists(configured)) {
                c.yoloOnnxPath = configured;
                return true;
            }
        } catch (ec) {}
    }
    let lowerFallback = __mfs_delta_model_dir + "/sjz.onnx";
    let target = __mfs_delta_model_path;
    try { file.mkdirs(__mfs_delta_model_dir); } catch (e) {}
    try {
        if (file.exists(target)) {
            c.yoloOnnxPath = target;
            return true;
        }
        if (file.exists(lowerFallback)) {
            c.yoloOnnxPath = lowerFallback;
            log("【三角洲YOLO】使用小写模型路径: " + lowerFallback, hooks);
            return true;
        }
    } catch (e2) {}
    for (let i = 0; i < __mfs_delta_model_asset_candidates.length; i++) {
        let assetPath = __mfs_delta_model_asset_candidates[i];
        try {
            let ok = file.copy(assetPath, target);
            if (ok && file.exists(target)) {
                c.yoloOnnxPath = target;
                log("【三角洲YOLO】已释放内置模型: " + target, hooks);
                return true;
            }
        } catch (e3) {}
    }
    log("【三角洲YOLO】模型不存在，请确认APK已内置SJZ.onnx或手动放到: " + target + " 或 " + lowerFallback, hooks);
    return false;
}
function ensureYolo(c, hooks) {
    c = c || createDefaultConfig();
    let defaults = createDefaultConfig();
    let labels = parseList(c.yoloLabels, defaults.yoloLabels);
    if (c.yoloForceModelLabelOrder !== false && !labelsEqual(labels, DELTA_SJZ_ONNX_LABELS)) {
        log("【三角洲YOLO诊断】传入labels与SJZ.onnx真实names不一致，已强制改为19类ONNX顺序。旧顺序=" + labels.join(" | "), hooks);
        labels = DELTA_SJZ_ONNX_LABELS.slice(0);
    }
    if (!labels || typeof labels.join !== "function" || labels.length === 0) {
        labels = DELTA_SJZ_ONNX_LABELS.slice(0);
    }
    c.yoloLabels = labels;
    if (!ensureDeltaModelFile(c, hooks)) return false;
    let labelKey = "";
    for (let i = 0; i < labels.length; i++) {
        if (i > 0) labelKey += ",";
        labelKey += String(labels[i]);
    }
    let key = c.yoloOnnxPath + "|" + labelKey + "|" + c.yoloBoxThr + "|" + c.yoloIouThr;
    if (__mfs_delta_state.yoloOk && __mfs_delta_state.yolo && __mfs_delta_state.yoloKey === key) return true;
    releaseYolo();
    try {
        if (typeof yolov8Api === "undefined" || !yolov8Api) return false;
        let ins = yolov8Api.newYolov8Onxx(), tmp = yolov8Api.newYolov8Onxx();
        if (!ins || !tmp) return false;
        let yc = tmp.getOnnxConfig(labels, 0, 0, c.yoloBoxThr, c.yoloIouThr, 2); try { tmp.release(); } catch (e0) {}
        if (!yc || !ins.initYoloModel(yc, c.yoloOnnxPath, null)) { try { ins.release(); } catch (e1) {} return false; }
        __mfs_delta_state.yolo = ins; __mfs_delta_state.yoloOk = true; __mfs_delta_state.yoloKey = key; log("【三角洲YOLO】模型初始化成功: " + c.yoloOnnxPath, hooks); return true;
    } catch (e) { log("【三角洲YOLO】异常: " + e, hooks); releaseYolo(); return false; }
}
function yName(o) { return String(o && (o.name || o.label || o.className) || ""); }
function yConf(o) { let v = parseFloat(o && (o.confidence || o.score || o.prob || o.conf)); return isNaN(v) ? 0 : v; }
function yCenter(o) { let p = center(o); if (!p) return null; p.confidence = yConf(o); return p; }
function getImageSizeInfo(img) {
    let info = { width: 0, height: 0 };
    try {
        if (img && typeof img.getWidth === "function") info.width = Number(img.getWidth()) || 0;
    } catch (e) {}
    try {
        if (img && typeof img.getHeight === "function") info.height = Number(img.getHeight()) || 0;
    } catch (e2) {}
    try {
        if (!info.width && img && img.width !== undefined) info.width = Number(img.width) || 0;
        if (!info.height && img && img.height !== undefined) info.height = Number(img.height) || 0;
    } catch (e3) {}
    return info;
}
function getScreenSizeInfo() {
    let info = { width: 0, height: 0 };
    try { info.width = Number(device.getScreenWidth()) || 0; } catch (e) {}
    try { info.height = Number(device.getScreenHeight()) || 0; } catch (e2) {}
    return info;
}
function getYoloBounds(o) {
    if (!o) return null;
    if (isNum(o.left) && isNum(o.right) && isNum(o.top) && isNum(o.bottom)) return { x1: o.left, y1: o.top, x2: o.right, y2: o.bottom };
    if (isNum(o.x1) && isNum(o.x2) && isNum(o.y1) && isNum(o.y2)) return { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2 };
    if (isNum(o.x) && isNum(o.y) && isNum(o.width) && isNum(o.height)) return { x1: o.x, y1: o.y, x2: o.x + o.width, y2: o.y + o.height };
    let b = o.bounds || o.rect || o.box || null;
    if (b && isNum(b.left) && isNum(b.right) && isNum(b.top) && isNum(b.bottom)) return { x1: b.left, y1: b.top, x2: b.right, y2: b.bottom };
    if (b && isNum(b.x1) && isNum(b.x2) && isNum(b.y1) && isNum(b.y2)) return { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
    if (b && isNum(b.x) && isNum(b.y) && isNum(b.width) && isNum(b.height)) return { x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height };
    return null;
}
function buildYoloCoordinateDiagnosis(arr, img, hooks) {
    let screen = getScreenSizeInfo();
    let imgSize = getImageSizeInfo(img);
    let sw = screen.width, sh = screen.height;
    let iw = imgSize.width, ih = imgSize.height;
    let screenOri = sw > sh ? "横屏" : (sw < sh ? "竖屏" : "方屏");
    let imgOri = iw && ih ? (iw > ih ? "横屏" : (iw < ih ? "竖屏" : "方屏")) : "未知";
    log("【三角洲YOLO诊断】屏幕真实分辨率：宽=" + sw + "，高=" + sh + "，方向=" + screenOri, hooks);
    log("【三角洲YOLO诊断】截图图像尺寸：宽=" + (iw || "未知") + "，高=" + (ih || "未知") + "，方向=" + imgOri, hooks);
    if (sw && sh && iw && ih && ((sw > sh && iw < ih) || (sw < sh && iw > ih))) {
        log("【三角洲YOLO诊断】疑似横竖屏空间错乱：屏幕方向与截图方向不一致", hooks);
    }
    if (!arr || arr.length === 0) return;
    let maxCoord = 0;
    let outsideScreen = 0;
    let relativeLike = 0;
    let square640Like = 0;
    for (let i = 0; i < arr.length; i++) {
        let p = yCenter(arr[i]);
        let b = getYoloBounds(arr[i]);
        if (p) {
            maxCoord = Math.max(maxCoord, Math.abs(p.x), Math.abs(p.y));
            if (sw && sh && (p.x < 0 || p.y < 0 || p.x > sw || p.y > sh)) outsideScreen++;
            if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) relativeLike++;
            if (p.x >= 0 && p.x <= 640 && p.y >= 0 && p.y <= 640) square640Like++;
        }
        if (b) {
            maxCoord = Math.max(maxCoord, Math.abs(b.x1), Math.abs(b.y1), Math.abs(b.x2), Math.abs(b.y2));
            if (b.x1 >= 0 && b.x1 <= 1 && b.y1 >= 0 && b.y1 <= 1 && b.x2 >= 0 && b.x2 <= 1 && b.y2 >= 0 && b.y2 <= 1) relativeLike++;
        }
    }
    log("【三角洲YOLO诊断】坐标统计：数量=" + arr.length + "，最大坐标值=" + maxCoord.toFixed(3) + "，越界中心点=" + outsideScreen, hooks);
    if (relativeLike > 0) {
        log("【三角洲YOLO诊断】疑似相对坐标：检测结果存在 0~1 坐标，若点击偏左上需乘以真实宽高", hooks);
    }
    if (sw && sh && (sw > 640 || sh > 640) && square640Like === arr.length && maxCoord <= 640) {
        log("【三角洲YOLO诊断】疑似 640x640 坐标：所有中心点都落在 640 范围内，若点击缩在左上角需做尺度还原", hooks);
    }
    if (outsideScreen > 0) {
        log("【三角洲YOLO诊断】疑似坐标系不一致：存在超出真实屏幕范围的中心点", hooks);
    }
    if (sw && sh && iw && ih && sw !== iw && sh !== ih) {
        log("【三角洲YOLO诊断】注意：截图尺寸与屏幕分辨率不完全一致，需重点检查旋转/缩放/黑边还原", hooks);
    }
}
function logYoloRawData(raw, arr, img, hooks) {
    try {
        buildYoloCoordinateDiagnosis(arr, img, hooks);
        let rawText = String(raw || "");
        if (rawText.length > 3500) rawText = rawText.substring(0, 3500) + "...(已截断)";
        log("【三角洲YOLO诊断】YOLO返回的原始数据：" + rawText, hooks);
    } catch (e) {
        log("【三角洲YOLO诊断】诊断日志异常: " + e, hooks);
    }
}
function yoloAll(c, hooks) {
    if (!ensureYolo(c, hooks)) return [];
    let img = null;
    let rawImg = null;
    try {
        rawImg = image.captureFullScreenEx() || image.captureFullScreen();
        let needRotate = __mfs_vision && __mfs_vision.isImageRotated && __mfs_vision.isImageRotated(rawImg);
        if (needRotate && __mfs_vision.captureForLandscape) {
            img = __mfs_vision.captureForLandscape();
            try { if (rawImg && rawImg !== img) image.recycle(rawImg); } catch (er) {}
            rawImg = null;
        } else {
            img = rawImg;
            rawImg = null;
        }
        let sizeInfo = getImageSizeInfo(img);
        if (!img || !sizeInfo.width || !sizeInfo.height) {
            log("【三角洲YOLO诊断】截图尺寸无效=" + sizeInfo.width + "x" + sizeInfo.height + "，跳过本次YOLO", hooks);
            return [];
        }
        let raw = __mfs_delta_state.yolo.detectImage(img, c.yoloLabels);
        let arr = raw ? JSON.parse(raw) : [];
        if (c.yoloVerboseDiagnostics) {
            if (__mfs_vision && __mfs_vision.diagnoseLandscapeIssue) {
                __mfs_vision.diagnoseLandscapeIssue(img, function (m) { log(m, hooks); });
            }
            logYoloRawData(raw, arr, img, hooks);
        }
        if (arr && arr.length > 0) {
            let names = [];
            for (let i = 0; i < arr.length && i < 12; i++) {
                let cp = yCenter(arr[i]);
                names.push(yName(arr[i]) + "@" + yConf(arr[i]).toFixed(2) + (cp ? "(" + cp.x + "," + cp.y + ")" : "(no-xy)"));
            }
            log("【三角洲YOLO】识别结果: " + names.join(", "), hooks);
            if (c.yoloDebugOverlay) {
                drawYoloResults(arr, hooks);
            }
        } else {
            log("【三角洲YOLO】识别结果为空", hooks);
            if (c.yoloDebugOverlay) {
                clearDebugOverlay();
            }
        }
        return arr || [];
    }
    catch (e) { log("【三角洲YOLO】识别异常: " + e, hooks); return []; }
    finally {
        try { if (img) image.recycle(img); } catch (e2) {}
        try { if (rawImg) image.recycle(rawImg); } catch (e3) {}
    }
}
function findYolo(label, c, hooks, opt) {
    opt = opt || {};
    let min = opt.confidence === undefined ? c.yoloConfidence : opt.confidence, arr = yoloAll(c, hooks), best = null;
    for (let i = 0; i < arr.length; i++) {
        if (yName(arr[i]) === label && yConf(arr[i]) >= min) {
            let p = yCenter(arr[i]);
            if (!p) {
                try { log("【三角洲YOLO】命中标签但坐标解析失败: " + label + " -> " + JSON.stringify(arr[i]), hooks); } catch (e0) { log("【三角洲YOLO】命中标签但坐标解析失败: " + label, hooks); }
                continue;
            }
            if (opt.region && (p.x < opt.region.x1 || p.x > opt.region.x2 || p.y < opt.region.y1 || p.y > opt.region.y2)) continue;
            if (!best || p.confidence > best.confidence) best = p;
        }
    }
    if (!best) log("【三角洲YOLO】未命中: " + label + "，阈值=" + min, hooks);
    return best;
}
function waitYolo(label, c, hooks, opt) {
    opt = opt || {}; let end = now() + (opt.timeoutMs === undefined ? 10000 : opt.timeoutMs), iv = opt.intervalMs || 400;
    while (!stop(hooks) && now() <= end) { let p = findYolo(label, c, hooks, opt); if (p) return p; sleep(iv); }
    return null;
}
function clickYolo(label, c, hooks, opt) {
    opt = opt || {};
    try {
        let p = waitYolo(label, c, hooks, opt);
        if (!p || !isNum(p.x) || !isNum(p.y)) {
            log("【三角洲YOLO】点击坐标无效: " + label, hooks);
            return false;
        }
        let tx = Math.floor(p.x);
        let ty = Math.floor(p.y);
        log("【三角洲YOLO】准备点击: " + label + " -> (" + tx + "," + ty + ")", hooks);
        let ok = safeNativeClick(tx, ty, hooks);
        if (!ok) {
            log("【三角洲YOLO】点击失败: " + label, hooks);
            return false;
        }
        delay(c, !!opt.fast);
        return true;
    } catch (e) {
        log("【三角洲YOLO】点击异常: " + label + " -> " + e, hooks);
        return false;
    }
}

function isMain(c, hooks, ms) {
    let sw = device.getScreenWidth(), sh = device.getScreenHeight(), r = { x1: Math.floor(sw * 0.55), y1: 0, x2: sw, y2: Math.floor(sh * 0.35) }, end = now() + (ms || c.mainCheckTimeoutMs);
    let checkCount = 0;
    while (!stop(hooks) && now() <= end) {
        checkCount++;
        let foundMail = findText("邮件", c, hooks, { region: r });
        let foundSettings = findText("设置", c, hooks, { region: r });
        if (!foundSettings) {
            foundSettings = findText("设定", c, hooks, { region: r });
        }
        if (!foundSettings) {
            foundSettings = findText("設置", c, hooks, { region: r });
        }
        if (checkCount === 1 || checkCount % 5 === 0) {
            log("【三角洲】主界面检测 #" + checkCount + ": 邮件=" + (foundMail ? "找到@(" + foundMail.x + "," + foundMail.y + ")" : "未找到") + ", 设置=" + (foundSettings ? "找到@(" + foundSettings.x + "," + foundSettings.y + ")" : "未找到") + ", 区域=[" + r.x1 + "," + r.y1 + "," + r.x2 + "," + r.y2 + "]", hooks);
        }
        if (foundMail && foundSettings) return true;
        sleep(500);
    }
    log("【三角洲】主界面检测超时，共检测 " + checkCount + " 次", hooks);
    return false;
}
function waitMain(c, hooks) { log("【三角洲】等待主界面『邮件/设置』", hooks); while (!stop(hooks)) { if (isMain(c, hooks, c.mainCheckTimeoutMs)) return true; sleep(c.loopIdleMs); } return false; }
function isComboButtonPoint(label, p) {
    if (!p) return false;
    let sw = device.getScreenWidth(), sh = device.getScreenHeight();
    let maxX = Math.floor(sw * 0.98);
    let maxY = Math.floor(sh * 0.98);
    if (label === "TuBiao_DaoJuA") {
        let minXForA = Math.floor(sw * 0.35);
        let maxXForA = Math.floor(sw * 0.96);
        let maxYForA = Math.floor(sh * 0.50);
        return p.x >= minXForA && p.x <= maxXForA && p.y >= 0 && p.y <= maxYForA;
    }
    if (label === "TuBiao_DaoJuB") {
        let minXForB = Math.floor(sw * 0.45);
        let maxXForB = Math.floor(sw * 0.92);
        let minYForB = Math.floor(sh * 0.02);
        let maxYForB = Math.floor(sh * 0.60);
        return p.x >= minXForB && p.x <= maxXForB && p.y >= minYForB && p.y <= maxYForB;
    }
    let minX = Math.floor(sw * 0.45);
    let minY = Math.floor(sh * 0.30);
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}
function applyLayoutFallbacks(arr, hooks) {
    let sw = device.getScreenWidth(), sh = device.getScreenHeight();
    let rightReturn = null, lowFire = null, bit = null;
    for (let i = 0; i < arr.length; i++) {
        let name = yName(arr[i]);
        let p = yCenter(arr[i]);
        if (!p) continue;
        if (name === "TuBiao_SheZhiFanHui" && p.x > Math.floor(sw * 0.65) && isComboButtonPoint("TuBiao_SheZhi", p)) {
            if (!rightReturn || p.confidence > rightReturn.confidence) rightReturn = p;
        }
        if (name === "TuBiao_KaiHuo" && p.y > Math.floor(sh * 0.55) && isComboButtonPoint("TuBiao_JiNeng", p)) {
            if (!lowFire || p.confidence > lowFire.confidence) lowFire = p;
        }
        if (name === "TuBiao_BiTe" && isComboButtonPoint("TuBiao_JiNeng", p)) {
            if (!bit || p.confidence > bit.confidence) bit = p;
        }
    }
    if (!__mfs_delta_state.pts.TuBiao_SheZhi && rightReturn) {
        __mfs_delta_state.pts.TuBiao_SheZhi = { x: rightReturn.x, y: rightReturn.y, confidence: rightReturn.confidence, inferred: true };
        log("【三角洲】兜底缓存TuBiao_SheZhi=(" + rightReturn.x + "," + rightReturn.y + ") 来源=右侧SheZhiFanHui", hooks);
    }
    if (!__mfs_delta_state.pts.TuBiao_JiNeng && lowFire) {
        __mfs_delta_state.pts.TuBiao_JiNeng = { x: lowFire.x, y: lowFire.y, confidence: lowFire.confidence, inferred: true };
        log("【三角洲】兜底缓存TuBiao_JiNeng=(" + lowFire.x + "," + lowFire.y + ") 来源=低位KaiHuo", hooks);
    }
    if (!__mfs_delta_state.pts.TuBiao_JiNeng && bit) {
        __mfs_delta_state.pts.TuBiao_JiNeng = { x: bit.x, y: bit.y, confidence: bit.confidence, inferred: true };
        log("【三角洲】兜底缓存TuBiao_JiNeng=(" + bit.x + "," + bit.y + ") 来源=BiTe", hooks);
    }
}
function cacheLayoutButtons(c, hooks) {
    let labels = ["TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_KaiHuo", "TuBiao_PaXia", "TuBiao_SheZhi", "TuBiao_JiNeng"];
    let end = now() + 9000;
    while (!stop(hooks) && now() <= end) {
        let arr = yoloAll(c, hooks);
        for (let i = 0; i < arr.length; i++) {
            let name = yName(arr[i]);
            if (labels.indexOf(name) < 0 || yConf(arr[i]) < 0.35) continue;
            let p = yCenter(arr[i]);
            if (!p) continue;
            if (!isComboButtonPoint(name, p)) {
                log("【三角洲】过滤异常布局坐标: " + name + "=(" + p.x + "," + p.y + ")", hooks);
                continue;
            }
            if (!__mfs_delta_state.pts[name] || p.confidence > (__mfs_delta_state.pts[name].confidence || 0)) {
                __mfs_delta_state.pts[name] = { x: p.x, y: p.y, confidence: p.confidence };
                log("【三角洲】缓存" + name + "=(" + p.x + "," + p.y + ")", hooks);
            }
        }
        if (!__mfs_delta_state.pts.TuBiao_DaoJuB && __mfs_delta_state.pts.TuBiao_DaoJuA && __mfs_delta_state.pts.TuBiao_DaoJuC) {
            let a = __mfs_delta_state.pts.TuBiao_DaoJuA, cc = __mfs_delta_state.pts.TuBiao_DaoJuC;
            let inferredB = { x: Math.floor((a.x + cc.x) / 2), y: Math.floor((a.y + cc.y) / 2), confidence: 0.34, inferred: true };
            if (isComboButtonPoint("TuBiao_DaoJuB", inferredB)) {
                __mfs_delta_state.pts.TuBiao_DaoJuB = inferredB;
                log("【三角洲】推导缓存TuBiao_DaoJuB=(" + inferredB.x + "," + inferredB.y + ")", hooks);
            } else {
                log("【三角洲】放弃异常推导TuBiao_DaoJuB=(" + inferredB.x + "," + inferredB.y + ")", hooks);
            }
        }
        applyLayoutFallbacks(arr, hooks);
        let missing = [];
        for (let j = 0; j < labels.length; j++) if (!__mfs_delta_state.pts[labels[j]]) missing.push(labels[j]);
        if (missing.length === 0) return true;
        log("【三角洲】布局按钮待识别: " + missing.join(","), hooks);
        sleep(700);
    }
    let finalMissing = [];
    for (let k = 0; k < labels.length; k++) if (!__mfs_delta_state.pts[labels[k]]) finalMissing.push(labels[k]);
    if (finalMissing.length > 0) log("【三角洲】布局按钮识别失败: " + finalMissing.join(","), hooks);
    return finalMissing.length === 0;
}
function stageOne(c, hooks) {
    if (!waitMain(c, hooks)) return false;
    log("【三角洲】进入自定义布局", hooks);
    let sw = device.getScreenWidth(), sh = device.getScreenHeight();
    let mainRegion = { x1: Math.floor(sw * 0.55), y1: 0, x2: sw, y2: Math.floor(sh * 0.35) };
    log("【三角洲】步骤1：点击 设置，区域=[" + mainRegion.x1 + "," + mainRegion.y1 + "," + mainRegion.x2 + "," + mainRegion.y2 + "]", hooks);
    if (!clickText("设置", c, hooks, { timeoutMs: 10000, region: mainRegion })) {
        if (!clickText("设定", c, hooks, { timeoutMs: 5000, region: mainRegion }) && !clickText("設置", c, hooks, { timeoutMs: 5000, region: mainRegion })) {
            log("【三角洲】步骤1失败：未能点击设置按钮", hooks);
            return false;
        }
    }
    log("【三角洲】步骤2：点击 操作设置", hooks);
    if (!clickText("操作设置", c, hooks, { timeoutMs: 10000 })) return false;
    log("【三角洲】步骤3：点击 自定义布局", hooks);
    if (!clickText("自定义布局", c, hooks, { timeoutMs: 10000 })) return false;
    sleep(1000);
    log("【三角洲】步骤3.5：在自定义布局界面缓存按钮位置", hooks);
    if (!cacheLayoutButtons(c, hooks)) {
        log("【三角洲】自定义布局按钮缓存失败", hooks);
        return false;
    }
    log("【三角洲】步骤4：返回按键设置页", hooks);
    if (!safeBack(hooks)) { log("【三角洲】按键设置返回失败", hooks); return false; }
    sleep(900);
    log("【三角洲】步骤5：返回设置页", hooks);
    if (!safeBack(hooks)) { log("【三角洲】设置返回失败", hooks); return false; }
    sleep(900);
    log("【三角洲】步骤6：等待返回主界面", hooks);
    return waitMain(c, hooks);
}
function cacheInGameButtons(c, hooks) {
    let labels = ["TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_KaiHuo", "TuBiao_PaXia", "TuBiao_SheZhi", "TuBiao_JiNeng"];
    log("【三角洲】扫描局内按钮坐标...", hooks);
    let end = now() + 8000;
    while (!stop(hooks) && now() <= end) {
        let arr = yoloAll(c, hooks);
        for (let i = 0; i < arr.length; i++) {
            let name = yName(arr[i]);
            if (labels.indexOf(name) < 0 || yConf(arr[i]) < 0.35) continue;
            let p = yCenter(arr[i]);
            if (!p || !isComboButtonPoint(name, p)) continue;
            if (!__mfs_delta_state.pts[name] || p.confidence > (__mfs_delta_state.pts[name].confidence || 0)) {
                __mfs_delta_state.pts[name] = { x: p.x, y: p.y, confidence: p.confidence };
                log("【三角洲】局内缓存" + name + "=(" + p.x + "," + p.y + ")", hooks);
            }
        }
        let sw = device.getScreenWidth(), sh = device.getScreenHeight();
        if (!__mfs_delta_state.pts.TuBiao_DaoJuB) {
            for (let j = 0; j < arr.length; j++) {
                let nm = yName(arr[j]);
                if (nm !== "TuBiao_DaoJuB" || yConf(arr[j]) < 0.25) continue;
                let p2 = yCenter(arr[j]);
                if (!p2) continue;
                if (!__mfs_delta_state.pts.TuBiao_DaoJuB || p2.confidence > (__mfs_delta_state.pts.TuBiao_DaoJuB.confidence || 0)) {
                    __mfs_delta_state.pts.TuBiao_DaoJuB = { x: p2.x, y: p2.y, confidence: p2.confidence };
                    log("【三角洲】局内低阈值缓存TuBiao_DaoJuB=(" + p2.x + "," + p2.y + ")", hooks);
                }
            }
        }
        let missing = [];
        for (let k = 0; k < labels.length; k++) if (!__mfs_delta_state.pts[labels[k]]) missing.push(labels[k]);
        if (missing.length === 0) { log("【三角洲】局内按钮全部缓存完成", hooks); return true; }
        log("【三角洲】局内按钮待识别: " + missing.join(","), hooks);
        sleep(700);
    }
    let finalMissing = [];
    for (let k2 = 0; k2 < labels.length; k2++) if (!__mfs_delta_state.pts[labels[k2]]) finalMissing.push(labels[k2]);
    if (finalMissing.length > 0) {
        log("【三角洲】局内按钮识别失败: " + finalMissing.join(","), hooks);
        return false;
    }
    return true;
}
function enterBattle(c, hooks) {
    if (!isMain(c, hooks, 2000) && !waitMain(c, hooks)) return false;
    if (!clickText("开始行动", c, hooks, { timeoutMs: c.startActionTimeoutMs })) return false;
    log("【三角洲】已点击开始行动，等待局内部署", hooks);
    return true;
}
function tapCached(label, c, hooks) {
    let p = __mfs_delta_state.pts[label];
    if (!p) {
        log("【三角洲】缺少缓存坐标: " + label, hooks);
        return false;
    }
    let tx = Math.floor(p.x), ty = Math.floor(p.y);
    log("【三角洲】缓存点击: " + label + " -> (" + tx + "," + ty + ")", hooks);
    let ok = safeNativeClick(tx, ty, hooks);
    if (!ok) {
        log("【三角洲】缓存点击失败: " + label, hooks);
        return false;
    }
    let pauseMs = rnd(c.comboMinDelayMs, c.comboMaxDelayMs);
    log("【三角洲】按钮点击后停顿" + pauseMs + "ms: " + label, hooks);
    sleep(pauseMs);
    return true;
}
function combo(c, hooks) {
    let a = ["TuBiao_PaXia", "TuBiao_DaoJuB", "TuBiao_KaiHuo", "TuBiao_DaoJuA", "TuBiao_KaiHuo", "TuBiao_JiNeng", "TuBiao_KaiHuo", "TuBiao_SheZhi"];
    log("【三角洲】开始连招，点击间隔=" + c.comboMinDelayMs + "-" + c.comboMaxDelayMs + "ms", hooks);
    for (let i = 0; i < a.length; i++) {
        if (stop(hooks) || !tapCached(a[i], c, hooks)) return false;
    }
    log("【三角洲】连招结束，等待" + c.comboRoundDelayMs + "ms", hooks);
    sleep(c.comboRoundDelayMs);
    return true;
}
function skipSettle(c, hooks) {
    let first = waitText("空白跳过", c, hooks, { timeoutMs: 800, intervalMs: 300 }); if (!first) return false;
    let end = now() + c.skipSettleTimeoutMs, last = 0; log("【三角洲】跳过结算", hooks);
    while (!stop(hooks) && now() <= end) {
        let p = findText("空白跳过", c, hooks, {});
        if (p) {
            let tx = Math.floor(p.x), ty = Math.floor(p.y);
            log("【三角洲】结算点击: 空白跳过 -> (" + tx + "," + ty + ")", hooks);
            if (safeNativeClick(tx, ty, hooks)) {
                delay(c, false);
                last = now();
            }
            sleep(600);
        } else if (last && now() - last >= c.skipSettleStableMs) return true; else sleep(400);
    }
    return true;
}
function looksLikeScoreText(text) {
    let s = String(text || "").replace(/\s+/g, "");
    if (!s) return false;
    if (/^[+＋\-－]?\d{1,6}$/.test(s)) return true;
    if (/^[+＋\-－]?\d{1,6}(分|积分|得分|PTS|pts)$/.test(s)) return true;
    return false;
}
function waitScorePopup(c, hooks, timeoutMs) {
    let sw = device.getScreenWidth(), sh = device.getScreenHeight();
    let region = { x1: Math.floor(sw * 0.28), y1: Math.floor(sh * 0.38), x2: Math.floor(sw * 0.72), y2: Math.floor(sh * 0.78) };
    let end = now() + (timeoutMs || c.scorePopupCheckMs || 10000);
    log("【三角洲】连招后观察得分数字，最长" + Math.floor((timeoutMs || c.scorePopupCheckMs || 10000) / 1000) + "s，区域=[" + region.x1 + "," + region.y1 + "," + region.x2 + "," + region.y2 + "]", hooks);
    while (!stop(hooks) && now() <= end) {
        let arr = ocrAll(c, hooks);
        for (let i = 0; i < arr.length; i++) {
            let txt = String(arr[i].label || arr[i].text || arr[i].words || "");
            if (!looksLikeScoreText(txt)) continue;
            let p = center(arr[i]);
            if (!inRegion(p, region)) continue;
            log("【三角洲】检测到得分数字: " + txt + " -> (" + p.x + "," + p.y + ")，本轮不重新部署", hooks);
            return true;
        }
        sleep(500);
    }
    log("【三角洲】10s内未检测到中心偏下得分数字，准备重新部署", hooks);
    return false;
}
function clickDeployButton(c, hooks, timeoutMs) {
    let words = ["部署", "部暑", "布署"];
    let sw = device.getScreenWidth(), sh = device.getScreenHeight();
    let region = { x1: Math.floor(sw * 0.45), y1: Math.floor(sh * 0.35), x2: sw, y2: sh };
    let end = now() + (timeoutMs || c.deployCheckTimeoutMs || 3000);
    while (!stop(hooks) && now() <= end) {
        for (let i = 0; i < words.length; i++) {
            let p = findText(words[i], c, hooks, { region: region });
            if (!p) continue;
            let tx = Math.floor(p.x), ty = Math.floor(p.y);
            log("【三角洲】局内点击部署按钮: " + words[i] + " -> (" + tx + "," + ty + ")", hooks);
            if (safeNativeClick(tx, ty, hooks)) {
                delay(c, false);
                return true;
            }
            log("【三角洲】部署按钮点击失败，继续重试", hooks);
            sleep(300);
        }
        sleep(350);
    }
    log("【三角洲】未检测到部署文字按钮，区域=[" + region.x1 + "," + region.y1 + "," + region.x2 + "," + region.y2 + "]", hooks);
    return false;
}
function battleLoop(c, hooks) {
    log("【三角洲】进入局内循环", hooks);
    let deployed = false;
    let buttonsCached = false;
    while (!stop(hooks)) {
        if (skipSettle(c, hooks)) {
            log("【三角洲】检测到空白跳过，对局结束", hooks);
            waitMain(c, hooks);
            return "lobby";
        }
        if (!deployed) {
            if (!clickDeployButton(c, hooks, 5000)) {
                log("【三角洲】未点击到部署，继续等待开局", hooks);
                sleep(c.loopIdleMs);
                continue;
            }
            deployed = true;
            sleep(1500);
            let labels = ["TuBiao_DaoJuA", "TuBiao_DaoJuB", "TuBiao_DaoJuC", "TuBiao_KaiHuo", "TuBiao_PaXia", "TuBiao_SheZhi", "TuBiao_JiNeng"];
            let cachedCount = 0;
            for (let i = 0; i < labels.length; i++) {
                if (__mfs_delta_state.pts[labels[i]]) cachedCount++;
            }
            if (cachedCount === labels.length) {
                log("【三角洲】检测到已有完整按钮缓存（来自设置界面），直接使用", hooks);
                buttonsCached = true;
            } else {
                log("【三角洲】未检测到完整按钮缓存（" + cachedCount + "/" + labels.length + "），需要重新扫描", hooks);
                buttonsCached = cacheInGameButtons(c, hooks);
            }
            continue;
        }
        if (!buttonsCached) {
            buttonsCached = cacheInGameButtons(c, hooks);
            if (!buttonsCached) {
                log("【三角洲】局内按钮未缓存完成，暂不连招", hooks);
                sleep(c.loopIdleMs);
                continue;
            }
        }
        if (!combo(c, hooks)) {
            log("【三角洲】连招失败，继续等待空白跳过或重新部署", hooks);
            sleep(c.loopIdleMs);
            continue;
        }
        let hasScore = waitScorePopup(c, hooks, c.scorePopupCheckMs);
        if (hasScore) {
            sleep(c.loopIdleMs);
            continue;
        }
        log("【三角洲】连招完成但未检测到得分，尝试重新部署并等待下一次部署按钮", hooks);
        clickText("重新部署", c, hooks, { timeoutMs: c.redeployAfterComboTimeoutMs });
        deployed = false;
        buttonsCached = false;
        sleep(c.loopIdleMs);
    }
    return "stop";
}
function runAutomation(c, hooks) {
    log("【三角洲】开始前置检查：截图权限/OCR/YOLO", hooks);
    if (!ensureCapture(hooks)) {
        log("【三角洲】前置检查失败：截图权限未获取或截图接口不可用", hooks);
        return;
    }
    if (!ensureOcr(c, hooks)) {
        log("【三角洲】前置检查失败：本地OCR初始化失败", hooks);
        return;
    }
    if (!ensureYolo(c, hooks)) {
        log("【三角洲】前置检查失败：YOLO初始化失败，请检查yolov8Api是否可用，以及模型是否存在: " + c.yoloOnnxPath, hooks);
        return;
    }
    log("【三角洲】前置检查通过", hooks);
    if (!stageOne(c, hooks)) { log("【三角洲】阶段一失败", hooks); clearDebugOverlay(); return; }
    while (!stop(hooks)) { if (!enterBattle(c, hooks)) { sleep(1000); continue; } let r = battleLoop(c, hooks); if (r === "stop") break; if (r === "error") waitMain(c, hooks); sleep(800); }
    clearDebugOverlay();
}
function getNodeCenter(nodeInfo) {
    try {
        if (!nodeInfo) return null;
        if (typeof nodeInfo.centerX === "number" && typeof nodeInfo.centerY === "number") {
            return { x: parseInt(nodeInfo.centerX, 10), y: parseInt(nodeInfo.centerY, 10) };
        }
        if (nodeInfo.bounds) {
            let b = nodeInfo.bounds;
            if (typeof b.centerX === "function" && typeof b.centerY === "function") {
                return { x: parseInt(b.centerX(), 10), y: parseInt(b.centerY(), 10) };
            }
            if (typeof b.left === "number" && typeof b.top === "number" && typeof b.right === "number" && typeof b.bottom === "number") {
                return { x: parseInt((b.left + b.right) / 2, 10), y: parseInt((b.top + b.bottom) / 2, 10) };
            }
        }
        if (typeof nodeInfo.left === "number" && typeof nodeInfo.top === "number" && typeof nodeInfo.right === "number" && typeof nodeInfo.bottom === "number") {
            return { x: parseInt((nodeInfo.left + nodeInfo.right) / 2, 10), y: parseInt((nodeInfo.top + nodeInfo.bottom) / 2, 10) };
        }
    } catch (e) {
    }
    return null;
}
function getNodeByText(textValue, hooks) {
    let keyword = String(textValue || "").trim();
    if (!keyword) return null;
    let creators = [
        { name: "textMatch", fn: function () { if (typeof textMatch === "function") return textMatch(keyword); return null; } },
        { name: "textContains", fn: function () { if (typeof textContains === "function") return textContains(keyword); return null; } },
        { name: "text", fn: function () { if (typeof text === "function") return text(keyword); return null; } }
    ];
    for (let i = 0; i < creators.length; i++) {
        try {
            let selector = creators[i].fn();
            if (!selector) {
                log("【三角洲行动】节点API不可用: " + creators[i].name, hooks);
                continue;
            }
            if (typeof selector.getOneNodeInfo === "function") {
                let n1 = selector.getOneNodeInfo(1000);
                if (n1) {
                    log("【三角洲行动】通过 " + creators[i].name + ".getOneNodeInfo 找到节点: " + keyword, hooks);
                    return n1;
                }
            }
            if (typeof selector.findOne === "function") {
                let n2 = selector.findOne(1000);
                if (n2) {
                    log("【三角洲行动】通过 " + creators[i].name + ".findOne 找到节点: " + keyword, hooks);
                    return n2;
                }
            }
            log("【三角洲行动】" + creators[i].name + " 未找到节点: " + keyword, hooks);
        } catch (e) {
            log("【三角洲行动】节点查找异常 " + creators[i].name + ": " + e, hooks);
        }
    }
    return null;
}
function waitAndClickDesktopNode(c, hooks) {
    let keywords = c.desktopNodeKeywords || ["三角洲行动", "三角洲"];
    log("【三角洲行动】开始节点启动，关键词: " + keywords.join(", "), hooks);
    let start = now();
    let loopCount = 0;
    while (!stop(hooks) && now() - start < c.launchTimeoutMs) {
        loopCount++;
        if (loopCount % 5 === 1) {
            log("【三角洲行动】节点查找循环 #" + loopCount + "，已耗时 " + Math.floor((now() - start) / 1000) + "s", hooks);
        }
        for (let i = 0; i < keywords.length; i++) {
            let keyword = keywords[i];
            let nodeInfo = getNodeByText(keyword, hooks);
            if (!nodeInfo) {
                if (loopCount % 10 === 1) {
                    log("【三角洲行动】未找到桌面节点: " + keyword, hooks);
                }
                continue;
            }
            let p = getNodeCenter(nodeInfo);
            if (!p) {
                log("【三角洲行动】检测到桌面节点但无法计算坐标: " + keyword, hooks);
                continue;
            }
            safeNativeClick(p.x, p.y, hooks);
            log("【三角洲行动】已通过节点点击桌面图标: " + keyword + " -> (" + p.x + "," + p.y + ")", hooks);
            sleep(2000);
            return true;
        }
        sleep(1000);
    }
    log("【三角洲行动】节点启动超时，共尝试 " + loopCount + " 次，耗时 " + Math.floor((now() - start) / 1000) + "s", hooks);
    return false;
}
function normalizeOcrLabel(text) {
    return String(text || "").replace(/\s+/g, "").replace(/：/g, ":").trim();
}
function getOcrItemLabel(item) {
    return String(item && item.label ? item.label : "").trim();
}
function findOcrTarget(items, keywords) {
    let list = items || [];
    let words = keywords || [];
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let label = normalizeOcrLabel(getOcrItemLabel(item));
        if (!label) continue;
        for (let j = 0; j < words.length; j++) {
            let keyword = normalizeOcrLabel(words[j]);
            if (keyword && label.indexOf(keyword) >= 0) return item;
        }
    }
    return null;
}
function waitAndClickDesktopOcr(c, hooks) {
    if (!ensureCapture(hooks) || !ensureOcr(c, hooks)) {
        log("【三角洲行动】OCR启动失败：截图或OCR初始化失败", hooks);
        return false;
    }
    let keywords = c.desktopNodeKeywords || ["三角洲行动", "三角洲"];
    log("【三角洲行动】开始OCR识别桌面图标，关键词: " + keywords.join(", "), hooks);
    let start = now();
    let loopCount = 0;
    while (!stop(hooks) && now() - start < c.launchTimeoutMs) {
        loopCount++;
        if (loopCount % 3 === 1) {
            log("【三角洲行动】OCR识别循环 #" + loopCount + "，已耗时 " + Math.floor((now() - start) / 1000) + "s", hooks);
        }
        let img = null;
        try {
            img = image.captureFullScreenEx() || image.captureFullScreen();
            if (!img) {
                log("【三角洲行动】OCR截图失败", hooks);
                sleep(1500);
                continue;
            }
            let items = ocrAll(c, hooks);
            if (!items || items.length === 0) {
                if (loopCount % 5 === 1) {
                    log("【三角洲行动】OCR未识别到任何文字", hooks);
                }
                sleep(1500);
                continue;
            }
            if (loopCount % 5 === 1) {
                log("【三角洲行动】OCR识别到 " + items.length + " 个文字区域", hooks);
            }
            let target = findOcrTarget(items, keywords);
            if (target) {
                let p = center(target);
                if (p) {
                    safeNativeClick(p.x, p.y, hooks);
                    log("【三角洲行动】已通过OCR点击桌面图标: " + getOcrItemLabel(target) + " -> (" + p.x + "," + p.y + ")", hooks);
                    sleep(2000);
                    return true;
                } else {
                    log("【三角洲行动】OCR找到目标但无法计算坐标: " + getOcrItemLabel(target), hooks);
                }
            }
        } catch (e) {
            log("【三角洲行动】OCR查找桌面图标异常: " + e, hooks);
        } finally {
            try { if (img) image.recycle(img); } catch (e2) {}
        }
        sleep(1500);
    }
    log("【三角洲行动】OCR识别超时，共尝试 " + loopCount + " 次，耗时 " + Math.floor((now() - start) / 1000) + "s", hooks);
    return false;
}
function launchByPackage(c, hooks) {
    let pkg = String(c.packageName || "").trim();
    if (!pkg) {
        log("【三角洲行动】未配置包名，无法包名启动", hooks);
        return false;
    }
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function") {
            let ret = shell.execShizukuCommand("monkey -p " + pkg + " -c android.intent.category.LAUNCHER 1");
            let retStr = String(ret || "");
            let ok = ret == null || retStr === "" || (retStr.indexOf("Error") < 0 && retStr.indexOf("error") < 0);
            log("【三角洲行动】Shizuku启动(" + pkg + ") -> " + (ok ? "成功" : "失败: " + retStr), hooks);
            return ok;
        }
    } catch (e1) {
        log("【三角洲行动】Shizuku启动异常: " + e1, hooks);
    }
    try {
        if (typeof utils !== "undefined" && utils && typeof utils.openApp === "function") {
            let ok = !!utils.openApp(pkg);
            log("【三角洲行动】utils.openApp(" + pkg + ") -> " + ok, hooks);
            return ok;
        }
    } catch (e2) {
        log("【三角洲行动】utils.openApp异常: " + e2, hooks);
    }
    return false;
}
function doLaunch(inputConfig, hooks) {
    let c = cfgMerge(inputConfig);
    log("【三角洲行动】开始执行游戏启动流程", hooks);
    try { home(); } catch (e) {}
    sleep(2000);
    let started = false;
    if (c.startByPackage) {
        started = launchByPackage(c, hooks);
    }
    if (!started && c.startByNode) {
        log("【三角洲行动】尝试节点启动桌面图标", hooks);
        started = waitAndClickDesktopNode(c, hooks);
    }
    if (!started) {
        log("【三角洲行动】节点启动失败，尝试OCR识别桌面图标", hooks);
        started = waitAndClickDesktopOcr(c, hooks);
    }
    if (!started) {
        log("【三角洲行动】游戏启动失败：未找到桌面节点/图标", hooks);
        return false;
    }
    log("【三角洲行动】已点击游戏入口，等待进入游戏界面", hooks);
    let end = now() + c.enterGameTimeoutMs;
    while (!stop(hooks) && now() < end) {
        if (isMain(c, hooks, 2000)) {
            log("【三角洲行动】已检测到游戏主界面", hooks);
            return true;
        }
        sleep(1500);
    }
    log("【三角洲行动】启动后未确认进入主界面，请手动检查登录/公告/权限弹窗", hooks);
    return true;
}
function runTrade(inputConfig, hooks) { runAutomation(cfgMerge(inputConfig), hooks); }
function start(inputConfig, hooks) { let c = cfgMerge(inputConfig); if (!c.enabled) return; log("【三角洲行动】模块启动，任务=大战场刷砖，点击通道=v23，YOLO=score_guard_redeploy", hooks); if (c.task === "launch") { doLaunch(c, hooks); log("【三角洲行动】模块结束", hooks); return; } if (!(c.battlefieldBrick === true || c.battlefieldBrick === "true" || c.battlefieldBrick === "1" || c.deltaBattlefieldBrick === true || c.deltaBattlefieldBrick === "true" || c.deltaBattlefieldBrick === "1")) { log("【三角洲行动】未勾选大战场刷砖，跳过。", hooks); return; } runAutomation(c, hooks); log("【三角洲行动】模块结束", hooks); }

module.exports = { createDefaultConfig: createDefaultConfig, start: start, doLaunch: doLaunch, runTrade: runTrade, runAutomation: runAutomation, clickOcrText: clickText, clickYoloLabel: clickYolo, findOcrText: findText, findYoloLabel: findYolo, releaseYolo: releaseYolo, clearDebugOverlay: clearDebugOverlay };
try { if (typeof global !== "undefined") global.__mfs_delta = module.exports; else this.__mfs_delta = module.exports; } catch (e) {}
