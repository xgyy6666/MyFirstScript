var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_vision = null;
try { __mfs_vision = require("../core/vision.js"); } catch (e) {}
if (!__mfs_vision) try { __mfs_vision = (typeof global !== "undefined" ? global.__mfs_vision : this.__mfs_vision) || null; } catch (e2) {}

const ROCO_YOLO_MODEL_PATH = "/sdcard/roco_ui_v1.onnx";
const ROCO_YOLO_LABELS = ["TuBiao_CangKu", "TuBiao_DiTu", "TuBiao_DuiWu", "TuBiao_GaoJiGuLuQiu", "TuBiao_GuLuQiuSouHui", "TuBiao_GuLuQiuTouZhi", "TuBiao_HuoDong", "TuBiao_JingLingFangChu", "TuBiao_LiaoTian", "TuBiao_QiLiYe", "TuBiao_RenWu", "TuBiao_ShouCe", "TuBiao_TiaoZhan", "TuBiao_TuJian", "TuBiao_TuiChu", "TuBiao_XingPan", "TuBiao_XingXingMoFa", "TuBiao_XingXingMoFaGongJi", "TuBiao_YiDongLunPan", "TuBiao_ZhaoXiang"];
const ROCO_YOLO_PROB = 0.75;
const ROCO_YOLO_IMGSZ = 640;
const ROCO_YOLO_IOU = 0.55;

function rocoLog(msg, hooks) {
    try {
        if (hooks && hooks.log) {
            hooks.log(msg);
        } else {
            logd(msg);
        }
    } catch (e) {
    }
}

function rocoShouldStop(hooks) {
    try {
        return hooks && hooks.shouldStop ? hooks.shouldStop() : false;
    } catch (e) {
        return false;
    }
}

function rocoNowMs() {
    return new Date().getTime();
}

function createDefaultConfig() {
    return {
        enabled: false,
        task: "main",
        dailyQuest: true,
        collectReward: true,
        flowerPage: false,
        dailyTimes: 2,
        similarity: 0.82,
        launchTimeoutMs: 90000,
        enterWorldTimeoutMs: 120000
    };
}

function rocoGetScreenWidth() {
    try {
        return device.getScreenWidth();
    } catch (e) {
        return 0;
    }
}

function rocoGetScreenHeight() {
    try {
        return device.getScreenHeight();
    } catch (e) {
        return 0;
    }
}

function rocoBuildRegion(region) {
    let width = rocoGetScreenWidth();
    let height = rocoGetScreenHeight();
    return {
        x: region && typeof region.x === "number" ? region.x : 0,
        y: region && typeof region.y === "number" ? region.y : 0,
        ex: region && typeof region.ex === "number" ? region.ex : width,
        ey: region && typeof region.ey === "number" ? region.ey : height
    };
}

function rocoFindImagePoint(imageName, region, similarity) {
    let area = rocoBuildRegion(region);
    let sim = similarity || 0.8;
    try {
        return image.findImage(imageName, area.x, area.y, area.ex, area.ey, 0, sim);
    } catch (e) {
        return null;
    }
}

function rocoParseYoloResult(raw) {
    if (!raw) {
        return [];
    }
    if (typeof raw === "string") {
        try {
            let parsed = JSON.parse(raw);
            return parsed || [];
        } catch (e) {
            return [];
        }
    }
    try {
        if (typeof raw.length === "number") {
            return raw;
        }
    } catch (e1) {
    }
    try {
        if (typeof raw.size === "function" && typeof raw.get === "function") {
            let list = [];
            let size = raw.size();
            for (let i = 0; i < size; i++) {
                let item = raw.get(i);
                try {
                    if (typeof item === "string") {
                        list.push(JSON.parse(item));
                    } else if (item && typeof item.toString === "function") {
                        let text = String(item);
                        if (text && text.indexOf("{") === 0) {
                            list.push(JSON.parse(text));
                        } else {
                            list.push(item);
                        }
                    } else {
                        list.push(item);
                    }
                } catch (e2) {
                    list.push(item);
                }
            }
            return list;
        }
    } catch (e3) {
    }
    try {
        let rawText = String(raw || "");
        if (rawText && rawText.indexOf("[") === 0) {
            let parsed2 = JSON.parse(rawText);
            return parsed2 || [];
        }
    } catch (e4) {
    }
    return [];
}

function rocoGetResultCount(result) {
    if (!result) return 0;
    try {
        if (typeof result.length === "number") return result.length;
    } catch (e) {
    }
    try {
        if (typeof result.size === "function") return result.size();
    } catch (e2) {
    }
    return 0;
}

function rocoGetResultItem(result, index) {
    if (!result) return null;
    try {
        if (typeof result.length === "number") return result[index];
    } catch (e) {
    }
    try {
        if (typeof result.get === "function") return result.get(index);
    } catch (e2) {
    }
    return null;
}

function rocoGetYoloConfidence(item) {
    if (!item) return 0;
    if (typeof item.prob === "number") return item.prob;
    if (typeof item.confidence === "number") return item.confidence;
    if (typeof item.score === "number") return item.score;
    return 0;
}

function rocoNormalizeTargetName(targetName) {
    return String(targetName || "").trim();
}

function rocoBuildTargetResult(targetName, item) {
    let prob = rocoGetYoloConfidence(item);
    return {
        name: rocoNormalizeTargetName(targetName),
        prob: prob,
        left: item.left,
        top: item.top,
        right: item.right,
        bottom: item.bottom,
        x: parseInt((item.left + item.right) / 2, 10),
        y: parseInt((item.top + item.bottom) / 2, 10)
    };
}

function findTarget(targetName) {
    let target = rocoNormalizeTargetName(targetName);
    if (!target) {
        logd("【洛克王国世界】findTarget: 目标名称为空");
        return null;
    }

    let yolo = null;
    let img = null;
    try {
        if (typeof yolov8Api === "undefined" || !yolov8Api) {
            logd("【洛克王国世界】findTarget: 当前环境不支持 yolov8Api");
            return null;
        }

        yolo = yolov8Api.newYolov8Onxx();
        if (!yolo) {
            logd("【洛克王国世界】findTarget: YOLO实例创建失败");
            return null;
        }

        let yoloCfg = yolo.getOnnxConfig(ROCO_YOLO_LABELS, ROCO_YOLO_IMGSZ, ROCO_YOLO_IMGSZ, ROCO_YOLO_PROB, ROCO_YOLO_IOU, 2);
        let initOk = yolo.initYoloModel(yoloCfg, ROCO_YOLO_MODEL_PATH, "");
        if (!initOk) {
            logd("【洛克王国世界】findTarget: YOLO模型初始化失败: " + (yolo.getErrorMsg ? yolo.getErrorMsg() : "未知错误"));
            return null;
        }

        img = (__mfs_vision && __mfs_vision.captureForLandscape) ? __mfs_vision.captureForLandscape() : image.captureFullScreen();
        if (!img) {
            logd("【洛克王国世界】findTarget: 截图失败");
            return null;
        }

        let result = rocoParseYoloResult(yolo.detectImage(img, []));
        let resultCount = rocoGetResultCount(result);
        if (resultCount <= 0) {
            logd("【洛克王国世界】findTarget: 未检测到任何目标");
            return null;
        }

        logd("【洛克王国世界】findTarget: 本次共检测到 " + resultCount + " 个目标，开始查找 -> " + target);
        for (let d = 0; d < resultCount; d++) {
            let debugItem = rocoGetResultItem(result, d);
            if (!debugItem) continue;
            let debugName = rocoNormalizeTargetName(debugItem.name);
            let debugProb = rocoGetYoloConfidence(debugItem);
            let debugLeft = typeof debugItem.left === "number" ? debugItem.left : "null";
            let debugTop = typeof debugItem.top === "number" ? debugItem.top : "null";
            let debugRight = typeof debugItem.right === "number" ? debugItem.right : "null";
            let debugBottom = typeof debugItem.bottom === "number" ? debugItem.bottom : "null";
            logd("【洛克王国世界】YOLO调试: index=" + d + ", name=" + debugName + ", prob=" + debugProb + ", box=[" + debugLeft + "," + debugTop + "," + debugRight + "," + debugBottom + "]");
        }

        for (let i = 0; i < resultCount; i++) {
            let item = rocoGetResultItem(result, i);
            if (!item) continue;

            let name = rocoNormalizeTargetName(item.name);
            let prob = rocoGetYoloConfidence(item);
            if (name !== target) {
                continue;
            }
            if (prob < ROCO_YOLO_PROB) {
                logd("【洛克王国世界】findTarget: 找到目标但置信度不足 -> " + target + "，prob=" + prob);
                continue;
            }
            if (typeof item.left !== "number" || typeof item.top !== "number" || typeof item.right !== "number" || typeof item.bottom !== "number") {
                logd("【洛克王国世界】findTarget: 目标坐标字段缺失 -> " + target);
                continue;
            }

            let found = rocoBuildTargetResult(target, item);
            logd("【洛克王国世界】findTarget: 找到目标 " + target + " -> (" + found.x + "," + found.y + ")，prob=" + found.prob + "，imgsz=" + ROCO_YOLO_IMGSZ);
            return found;
        }

        logd("【洛克王国世界】findTarget: 未找到目标 -> " + target);
        return null;
    } catch (e) {
        logd("【洛克王国世界】findTarget异常: " + e);
        return null;
    } finally {
        try {
            if (img) img.recycle();
        } catch (e1) {
        }
        try {
            if (yolo) yolo.release();
        } catch (e2) {
        }
    }
}

function findAndClickTarget(targetName) {
    let found = findTarget(targetName);
    if (!found) {
        return false;
    }
    clickPoint(found.x, found.y);
    logd("【洛克王国世界】findAndClickTarget: 点击目标 " + found.name + " -> (" + found.x + "," + found.y + ")，prob=" + found.prob + "，imgsz=" + ROCO_YOLO_IMGSZ);
    return true;
}

function findAndClickTargetRetry(targetName, retryCount, intervalMs) {
    let target = rocoNormalizeTargetName(targetName);
    let totalRetry = typeof retryCount === "number" && retryCount > 0 ? parseInt(retryCount, 10) : 3;
    let waitMs = typeof intervalMs === "number" && intervalMs >= 0 ? parseInt(intervalMs, 10) : 1000;

    if (!target) {
        logd("【洛克王国世界】findAndClickTargetRetry: 目标名称为空");
        return false;
    }

    for (let i = 0; i < totalRetry; i++) {
        let attempt = i + 1;
        logd("【洛克王国世界】findAndClickTargetRetry: 第 " + attempt + "/" + totalRetry + " 次尝试查找 -> " + target);
        if (findAndClickTarget(target)) {
            logd("【洛克王国世界】findAndClickTargetRetry: 点击成功 -> " + target);
            return true;
        }
        if (attempt < totalRetry && waitMs > 0) {
            sleep(waitMs);
        }
    }

    logd("【洛克王国世界】findAndClickTargetRetry: 多次尝试后仍未找到目标 -> " + target);
    return false;
}

function clickTarget(targetName) {
    return findAndClickTarget(targetName);
}

function rocoWaitForImage(imageName, timeoutMs, hooks, desc, region, similarity) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return null;
        rocoTouchHeartbeat();
        let pt = rocoFindImagePoint(imageName, region, similarity);
        if (pt) {
            rocoLog("【洛克王国世界】检测到" + desc + " -> (" + pt.x + "," + pt.y + ")", hooks);
            return pt;
        }
        sleep(1000);
    }
    return null;
}

function rocoFindWhiteClosePoint() {
    let width = rocoGetScreenWidth();
    let height = rocoGetScreenHeight();
    let points = image.findColorEx("#FFFFFF", 0.9, parseInt(width * 0.7, 10), 0, width, parseInt(height * 0.22, 10), 20, 0);
    if (!points || points.length <= 0) {
        return null;
    }
    let best = points[0];
    for (let i = 1; i < points.length; i++) {
        let item = points[i];
        if (!item) continue;
        if (item.x > best.x || (item.x === best.x && item.y < best.y)) {
            best = item;
        }
    }
    return { x: best.x, y: best.y };
}

function rocoWaitForWhiteClosePoint(timeoutMs, hooks) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return null;
        rocoTouchHeartbeat();
        let pt = rocoFindWhiteClosePoint();
        if (pt) {
            rocoLog("【洛克王国世界】检测到右上角白色关闭点 -> (" + pt.x + "," + pt.y + ")", hooks);
            return pt;
        }
        sleep(800);
    }
    return null;
}

function rocoClickPointAndLog(x, y, desc, hooks) {
    clickPoint(parseInt(x, 10), parseInt(y, 10));
    rocoLog("【洛克王国世界】点击" + desc + " -> (" + parseInt(x, 10) + "," + parseInt(y, 10) + ")", hooks);
    sleep(1500);
    return true;
}

function rocoPauseScript(reason, hooks) {
    rocoLog(reason, hooks);
    try {
        toast(reason);
    } catch (e) {
    }
    try {
        if (typeof GlobalState !== "undefined" && GlobalState) {
            GlobalState.暂停信号 = 1;
        }
    } catch (e2) {
    }
    return false;
}

function rocoCollectImagePointsByScan(imageName, region, similarity, stepY, maxCount) {
    let area = rocoBuildRegion(region);
    let step = stepY > 0 ? stepY : 80;
    let limitCount = maxCount > 0 ? maxCount : 10;
    let points = [];
    let searchY = area.y;
    while (searchY < area.ey && points.length < limitCount) {
        rocoTouchHeartbeat();
        let pt = rocoFindImagePoint(imageName, {
            x: area.x,
            y: searchY,
            ex: area.ex,
            ey: area.ey
        }, similarity);
        if (!pt) {
            break;
        }
        points.push({ x: pt.x, y: pt.y });
        searchY = pt.y + step;
    }
    return points;
}

function rocoWaitForMainUi(timeoutMs, hooks) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return false;
        rocoTouchHeartbeat();

        let xingPan = findTarget("TuBiao_XingPan");
        if (xingPan) {
            rocoLog("【洛克王国世界】检测到 YOLO 主界面标记 TuBiao_XingPan -> (" + xingPan.x + "," + xingPan.y + ")", hooks);
            return true;
        }

        let pt = rocoFindImagePoint("roco_main_ui.png", null, 0.8);
        if (pt) {
            rocoLog("【洛克王国世界】检测到主界面判定图 roco_main_ui.png -> (" + pt.x + "," + pt.y + ")", hooks);
            return true;
        }

        let tuiChu = findTarget("TuBiao_TuiChu");
        if (tuiChu) {
            clickPoint(tuiChu.x, tuiChu.y);
            rocoLog("【洛克王国世界】进入游戏阶段检测到 TuBiao_TuiChu，执行点击 -> (" + tuiChu.x + "," + tuiChu.y + ")", hooks);
            sleep(1500);
            continue;
        }

        sleep(1000);
    }
    rocoLog("【洛克王国世界】未检测到主界面判定图 roco_main_ui.png 或 YOLO 主界面标记 TuBiao_XingPan", hooks);
    return false;
}

function rocoGetOfficialOcrConfig() {
    return {
        enabled: true,
        baseUrl: "local",
        ocrType: "paddleOcrNcnnV5",
        padding: 32,
        maxSideLen: 640,
        timeoutMs: 20000
    };
}

let RocoLocalOcrHolder = {
    instance: null,
    inited: false
};

function rocoGetLocalOcrInstance() {
    if (RocoLocalOcrHolder.instance) {
        return RocoLocalOcrHolder.instance;
    }
    try {
        if (typeof ocr === "undefined" || !ocr || typeof ocr.newOcr !== "function") {
            rocoLog("【洛克王国世界】本地OCR接口不可用", null);
            return null;
        }
        RocoLocalOcrHolder.instance = ocr.newOcr();
        if (!RocoLocalOcrHolder.instance) {
            rocoLog("【洛克王国世界】创建本地OCR实例失败", null);
            return null;
        }
        return RocoLocalOcrHolder.instance;
    } catch (e) {
        rocoLog("【洛克王国世界】创建本地OCR实例异常: " + e, null);
        return null;
    }
}

function rocoEnsureLocalOcrReady(hooks) {
    if (RocoLocalOcrHolder.inited) {
        return true;
    }
    let ins = rocoGetLocalOcrInstance();
    if (!ins) {
        return false;
    }
    let ok = false;
    try {
        ok = !!ins.initOcr({
            type: "paddleOcrNcnnV5",
            padding: 32,
            maxSideLen: 640,
            numThread: 2
        });
    } catch (e) {
        rocoLog("【洛克王国世界】本地OCR初始化异常: " + e, hooks);
        return false;
    }
    if (!ok) {
        try {
            rocoLog("【洛克王国世界】本地OCR初始化失败: " + (ins.getErrorMsg ? ins.getErrorMsg() : "未知错误"), hooks);
        } catch (e2) {
            rocoLog("【洛克王国世界】本地OCR初始化失败", hooks);
        }
        return false;
    }
    RocoLocalOcrHolder.inited = true;
    return true;
}

function rocoCallOfficialOcrByImage(img, overrideCfg, hooks) {
    let cfg = rocoGetOfficialOcrConfig();
    let ext = overrideCfg || {};
    if (typeof ext.enabled !== "undefined") cfg.enabled = !!ext.enabled;
    if (ext.ocrType) cfg.ocrType = String(ext.ocrType);
    if (typeof ext.padding !== "undefined") cfg.padding = ext.padding;
    if (typeof ext.maxSideLen !== "undefined") cfg.maxSideLen = ext.maxSideLen;
    if (typeof ext.timeoutMs !== "undefined") cfg.timeoutMs = ext.timeoutMs;

    if (!cfg.enabled) {
        rocoLog("【洛克王国世界】本地OCR未启用，无法执行OCR启动流程", hooks);
        return [];
    }
    if (!img) {
        rocoLog("【洛克王国世界】OCR图片对象为空", hooks);
        return [];
    }
    if (!rocoEnsureLocalOcrReady(hooks)) {
        return [];
    }

    try {
        let ins = rocoGetLocalOcrInstance();
        if (!ins) {
            return [];
        }
        let result = ins.ocrImage(img, cfg.timeoutMs, {});
        if (!result || !result.length) {
            return [];
        }
        return result;
    } catch (e) {
        rocoLog("【洛克王国世界】本地OCR调用失败: " + e, hooks);
        return [];
    }
}

function rocoCaptureAndCallOfficialOcr(overrideCfg, hooks) {
    let needRecycle = false;
    let img = null;
    try {
        if (!image.requestScreenCapture(10000, 0)) {
            rocoLog("【洛克王国世界】申请本地OCR截图权限失败", hooks);
            return [];
        }
        sleep(1000);
        img = image.captureFullScreenEx();
        if (!img) {
            rocoLog("【洛克王国世界】截图失败", hooks);
            return [];
        }
        needRecycle = true;
        return rocoCallOfficialOcrByImage(img, overrideCfg, hooks);
    } catch (e) {
        rocoLog("【洛克王国世界】本地OCR截图识别失败: " + e, hooks);
        return [];
    } finally {
        if (needRecycle && img) {
            try {
                image.recycle(img);
            } catch (e2) {
            }
        }
    }
}

function rocoNormalizeLabel(text) {
    return String(text || "")
        .replace(/\s+/g, "")
        .replace(/：/g, ":")
        .trim();
}

function rocoGetOcrItemLabel(item) {
    return String(item && item.label ? item.label : "").trim();
}

function rocoGetOcrItemCenter(item) {
    try {
        if (!item) return null;
        if (typeof item.x === "number" && typeof item.y === "number") {
            return { x: parseInt(item.x, 10), y: parseInt(item.y, 10) };
        }
        if (typeof item.left === "number" && typeof item.top === "number" && typeof item.right === "number" && typeof item.bottom === "number") {
            return {
                x: parseInt((item.left + item.right) / 2, 10),
                y: parseInt((item.top + item.bottom) / 2, 10)
            };
        }
        if (item.rect && typeof item.rect.left === "number") {
            return {
                x: parseInt((item.rect.left + item.rect.right) / 2, 10),
                y: parseInt((item.rect.top + item.rect.bottom) / 2, 10)
            };
        }
        if (item.box && item.box.length >= 4) {
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            for (let i = 0; i < item.box.length; i++) {
                let p = item.box[i];
                if (p && p.length >= 2) {
                    sumX += Number(p[0]);
                    sumY += Number(p[1]);
                    count += 1;
                }
            }
            if (count > 0) {
                return {
                    x: parseInt(sumX / count, 10),
                    y: parseInt(sumY / count, 10)
                };
            }
        }
        if (item.points && item.points.length >= 4) {
            let sumX2 = 0;
            let sumY2 = 0;
            let count2 = 0;
            for (let j = 0; j < item.points.length; j++) {
                let p2 = item.points[j];
                if (p2 && p2.length >= 2) {
                    sumX2 += Number(p2[0]);
                    sumY2 += Number(p2[1]);
                    count2 += 1;
                }
            }
            if (count2 > 0) {
                return {
                    x: parseInt(sumX2 / count2, 10),
                    y: parseInt(sumY2 / count2, 10)
                };
            }
        }
    } catch (e) {
    }
    return null;
}

function rocoFindOcrTarget(items, keywords) {
    let list = items || [];
    let words = keywords || [];
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let rawLabel = rocoGetOcrItemLabel(item);
        if (!rawLabel) continue;
        if (rawLabel.indexOf("【洛克王国世界】") >= 0 || rawLabel.indexOf("识别到进入世界") >= 0) {
            continue;
        }
        let label = rocoNormalizeLabel(rawLabel);
        if (!label) continue;
        for (let j = 0; j < words.length; j++) {
            let keyword = rocoNormalizeLabel(words[j]);
            if (keyword && label.indexOf(keyword) >= 0) {
                return item;
            }
        }
    }
    return null;
}

function rocoClickOcrItem(item, desc, hooks) {
    let center = rocoGetOcrItemCenter(item);
    if (!center) {
        rocoLog("【洛克王国世界】未能计算OCR点击坐标: " + desc, hooks);
        return false;
    }
    clickPoint(center.x, center.y);
    rocoLog("【洛克王国世界】点击" + desc + " -> (" + center.x + "," + center.y + ")", hooks);
    sleep(2000);
    return true;
}

function rocoExtractNodeCenter(nodeInfo) {
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
                return {
                    x: parseInt((b.left + b.right) / 2, 10),
                    y: parseInt((b.top + b.bottom) / 2, 10)
                };
            }
        }
        if (typeof nodeInfo.left === "number" && typeof nodeInfo.top === "number" && typeof nodeInfo.right === "number" && typeof nodeInfo.bottom === "number") {
            return {
                x: parseInt((nodeInfo.left + nodeInfo.right) / 2, 10),
                y: parseInt((nodeInfo.top + nodeInfo.bottom) / 2, 10)
            };
        }
    } catch (e) {
    }
    return null;
}

function rocoGetNodeByText(textValue) {
    let keyword = String(textValue || "").trim();
    if (!keyword) return null;

    let creators = [
        function () {
            if (typeof textMatch === "function") return textMatch(keyword);
            return null;
        },
        function () {
            if (typeof textContains === "function") return textContains(keyword);
            return null;
        },
        function () {
            if (typeof text === "function") return text(keyword);
            return null;
        }
    ];

    for (let i = 0; i < creators.length; i++) {
        try {
            let selector = creators[i]();
            if (!selector) continue;
            if (typeof selector.getOneNodeInfo === "function") {
                let n1 = selector.getOneNodeInfo(1000);
                if (n1) return n1;
            }
            if (typeof selector.findOne === "function") {
                let n2 = selector.findOne(1000);
                if (n2) return n2;
            }
        } catch (e) {
        }
    }
    return null;
}

function rocoWaitAndClickDesktopNode(timeoutMs, hooks) {
    let start = rocoNowMs();
    let keywords = ["洛克王国：世界", "洛克王国:世界", "洛克王国世界"];
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return false;
        for (let i = 0; i < keywords.length; i++) {
            let keyword = keywords[i];
            let nodeInfo = rocoGetNodeByText(keyword);
            if (!nodeInfo) continue;
            let center = rocoExtractNodeCenter(nodeInfo);
            if (!center) {
                rocoLog("【洛克王国世界】检测到桌面节点但无法计算坐标: " + keyword, hooks);
                continue;
            }
            clickPoint(center.x, center.y);
            rocoLog("【洛克王国世界】已通过节点点击桌面图标: " + keyword + " -> (" + center.x + "," + center.y + ")", hooks);
            sleep(2000);
            return true;
        }
        sleep(1000);
    }
    return false;
}

function rocoWaitForOcrTarget(keywords, timeoutMs, hooks, stepDesc) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return null;
        let items = rocoCaptureAndCallOfficialOcr(null, hooks);
        let target = rocoFindOcrTarget(items, keywords);
        if (target) {
            let label = rocoGetOcrItemLabel(target);
            rocoLog("【洛克王国世界】检测到" + stepDesc + ": " + label, hooks);
            return {
                item: target,
                items: items,
                label: label
            };
        }
        sleep(1500);
    }
    return null;
}

function rocoWaitForConfirmedOcrTarget(keywords, timeoutMs, hooks, stepDesc, confirmCount) {
    let start = rocoNowMs();
    let needCount = confirmCount > 1 ? confirmCount : 2;
    let hitCount = 0;
    let lastKeyword = "";
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return null;
        rocoTouchHeartbeat();
        let items = rocoCaptureAndCallOfficialOcr(null, hooks);
        let matchedTarget = null;
        let matchedKeyword = "";
        let matchedLabel = "";
        for (let j = 0; j < keywords.length; j++) {
            let currentKeyword = String(keywords[j] || "");
            if (!currentKeyword) continue;
            let target = rocoFindOcrTarget(items, [currentKeyword]);
            if (target) {
                matchedTarget = target;
                matchedKeyword = rocoNormalizeLabel(currentKeyword);
                matchedLabel = rocoGetOcrItemLabel(target);
                break;
            }
        }
        if (matchedTarget) {
            if (matchedKeyword === lastKeyword) {
                hitCount += 1;
            } else {
                lastKeyword = matchedKeyword;
                hitCount = 1;
            }
            rocoLog("【洛克王国世界】识别到" + stepDesc + "(" + hitCount + "/" + needCount + "): " + matchedLabel, hooks);
            if (hitCount >= needCount) {
                return {
                    item: matchedTarget,
                    items: items,
                    label: matchedLabel
                };
            }
        } else {
            hitCount = 0;
            lastKeyword = "";
        }
        sleep(1500);
    }
    return null;
}

function rocoWaitForOcrTextGone(keywords, timeoutMs, hooks, stepDesc) {
    let start = rocoNowMs();
    let missCount = 0;
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return false;
        rocoTouchHeartbeat();
        let items = rocoCaptureAndCallOfficialOcr(null, hooks);
        let target = rocoFindOcrTarget(items, keywords);
        if (target) {
            missCount = 0;
            rocoLog("【洛克王国世界】等待" + stepDesc + "完成，当前仍识别到: " + rocoGetOcrItemLabel(target), hooks);
        } else {
            missCount += 1;
            if (missCount >= 2) {
                rocoLog("【洛克王国世界】已确认" + stepDesc + "完成", hooks);
                return true;
            }
        }
        sleep(1500);
    }
    rocoLog("【洛克王国世界】等待" + stepDesc + "完成超时", hooks);
    return false;
}

function rocoTouchHeartbeat() {
    try {
        if (typeof 更新心跳 === "function") {
            更新心跳();
        }
    } catch (e) {
    }
}

function rocoDetectLoginOrEnterWorld(timeoutMs, hooks) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < timeoutMs) {
        if (rocoShouldStop(hooks)) return null;
        let remainMs = timeoutMs - (rocoNowMs() - start);
        let enterWorld = rocoWaitForConfirmedOcrTarget(["进入世界"], remainMs, hooks, "进入世界", 2);
        if (enterWorld) {
            return {
                type: "enter_world",
                item: enterWorld.item,
                label: enterWorld.label
            };
        }
        let items = rocoCaptureAndCallOfficialOcr(null, hooks);
        let wechatLogin = rocoFindOcrTarget(items, ["微信登录", "微信登陆"]);
        if (wechatLogin) {
            rocoLog("【洛克王国世界】检测到微信登录，后续可按UI设置决定是否点击", hooks);
            return {
                type: "wechat_login",
                item: wechatLogin,
                label: rocoGetOcrItemLabel(wechatLogin)
            };
        }
        let qqLogin = rocoFindOcrTarget(items, ["QQ登录", "QQ登陆"]);
        if (qqLogin) {
            rocoLog("【洛克王国世界】检测到QQ登录，后续可按UI设置决定是否点击", hooks);
            return {
                type: "qq_login",
                item: qqLogin,
                label: rocoGetOcrItemLabel(qqLogin)
            };
        }
        sleep(1500);
    }
    return null;
}

function rocoWaitAndClickEnterWorld(cfg, hooks) {
    let start = rocoNowMs();
    while (rocoNowMs() - start < cfg.enterWorldTimeoutMs) {
        if (rocoShouldStop(hooks)) return false;
        let remainMs = cfg.enterWorldTimeoutMs - (rocoNowMs() - start);
        let enterWorldState = rocoWaitForConfirmedOcrTarget(["进入世界"], remainMs, hooks, "进入世界", 2);
        if (enterWorldState && enterWorldState.item) {
            if (!rocoClickOcrItem(enterWorldState.item, "进入世界", hooks)) {
                return false;
            }
            return rocoWaitForOcrTextGone(["进入世界"], 20000, hooks, "点击进入世界");
        }
        sleep(1500);
    }
    rocoLog("【洛克王国世界】等待进入世界超时", hooks);
    return false;
}

function rocoDoLaunch(cfg, hooks) {
    rocoLog("【洛克王国世界】开始执行桌面启动流程", hooks);
    rocoLog("【洛克王国世界】先回到桌面，再通过节点点击游戏图标", hooks);
    let desktopClicked = rocoWaitAndClickDesktopNode(cfg.launchTimeoutMs, hooks);
    if (!desktopClicked) {
        rocoLog("【洛克王国世界】桌面节点点击失败，改用OCR识别桌面图标", hooks);
        let desktopNode = rocoWaitForConfirmedOcrTarget(["洛克王国:世界", "洛克王国世界", "洛克王国：世界"], cfg.launchTimeoutMs, hooks, "桌面节点", 2);
        if (!desktopNode || !desktopNode.item) {
            rocoLog("【洛克王国世界】未在桌面检测到“洛克王国：世界”", hooks);
            return false;
        }
        if (!rocoClickOcrItem(desktopNode.item, "桌面上的洛克王国：世界", hooks)) {
            return false;
        }
    }

    rocoLog("【洛克王国世界】已点击游戏图标，等待登录页或进入世界", hooks);
    let loginState = rocoDetectLoginOrEnterWorld(cfg.enterWorldTimeoutMs, hooks);
    if (!loginState) {
        rocoLog("【洛克王国世界】未检测到登录页或进入世界按钮", hooks);
        return false;
    }

    if (loginState.type === "enter_world") {
        rocoLog("【洛克王国世界】已确认识别到进入世界按钮，准备点击", hooks);
        if (!rocoClickOcrItem(loginState.item, "进入世界", hooks)) {
            return false;
        }
        if (!rocoWaitForOcrTextGone(["进入世界"], 20000, hooks, "点击进入世界")) {
            return false;
        }
        return rocoWaitForMainUi(30000, hooks);
    }

    if (loginState.type === "wechat_login" || loginState.type === "qq_login") {
        rocoLog("【洛克王国世界】当前检测到登录方式按钮，暂不自动点击，等待后续UI设置逻辑", hooks);
        if (!rocoWaitAndClickEnterWorld(cfg, hooks)) {
            return false;
        }
        return rocoWaitForMainUi(30000, hooks);
    }

    return false;
}

function rocoDoDaily(cfg, hooks) {
    let times = cfg.dailyTimes > 0 ? cfg.dailyTimes : 2;
    rocoLog("【洛克王国世界】开始执行日常任务，轮次=" + times, hooks);
    for (let i = 0; i < times; i++) {
        if (rocoShouldStop(hooks)) return;
        rocoLog("【洛克王国世界】日常任务第 " + (i + 1) + "/" + times + " 轮", hooks);
        sleep(1200);
    }
    rocoLog("【洛克王国世界】日常任务流程完成", hooks);
}

function rocoDoCollectReward(cfg, hooks) {
    rocoLog("【洛克王国世界】开始领取奖励", hooks);
    sleep(1000);
    rocoLog("【洛克王国世界】奖励领取流程完成", hooks);
}

function rocoDoFlowerPage(cfg, hooks) {
    rocoLog("【洛克王国世界】开始执行奇丽页自动刷花", hooks);
    if (!rocoWaitForMainUi(15000, hooks)) {
        rocoLog("【洛克王国世界】未进入主界面，无法执行刷花", hooks);
        return;
    }

    let teamBtn = rocoWaitForImage("roco_btn_team.png", 15000, hooks, "编队按钮", null, cfg.similarity);
    if (!teamBtn) {
        rocoLog("【洛克王国世界】未找到编队按钮 roco_btn_team.png", hooks);
        return;
    }
    rocoClickPointAndLog(teamBtn.x, teamBtn.y, "编队按钮", hooks);

    let leftArea = {
        x: 0,
        y: 0,
        ex: parseInt(rocoGetScreenWidth() / 2, 10),
        ey: rocoGetScreenHeight()
    };
    let rightArea = {
        x: parseInt(rocoGetScreenWidth() / 2, 10),
        y: 0,
        ex: rocoGetScreenWidth(),
        ey: rocoGetScreenHeight()
    };

    let leftPets = rocoCollectImagePointsByScan("roco_icon_left_pet.png", leftArea, cfg.similarity, 90, 12);
    if (!leftPets || leftPets.length < 5) {
        rocoPauseScript("【洛克王国世界】编队奇丽叶少于5个，请检查后再继续", hooks);
        return;
    }
    rocoLog("【洛克王国世界】已确认左侧奇丽叶数量: " + leftPets.length, hooks);

    let whiteClose = rocoWaitForWhiteClosePoint(8000, hooks);
    if (!whiteClose) {
        rocoLog("【洛克王国世界】未找到右上角白色关闭点", hooks);
        return;
    }
    rocoClickPointAndLog(whiteClose.x, whiteClose.y, "右上角白色关闭点", hooks);

    for (let i = 0; i < leftPets.length; i++) {
        if (rocoShouldStop(hooks)) return;
        let leftPet = leftPets[i];
        rocoClickPointAndLog(leftPet.x, leftPet.y, "左侧奇丽叶" + (i + 1), hooks);
        sleep(1000);

        let rightPet = rocoWaitForImage("roco_icon_left_pet.png", 8000, hooks, "右侧奇丽叶", rightArea, cfg.similarity);
        if (!rightPet) {
            rocoLog("【洛克王国世界】第" + (i + 1) + "只奇丽叶未在右侧出现，继续下一个", hooks);
            continue;
        }
        rocoClickPointAndLog(rightPet.x, rightPet.y, "右侧奇丽叶" + (i + 1), hooks);
        sleep(1000);

        let throwBtn = rocoWaitForImage("roco_btn_throw.png", 5000, hooks, "投掷按钮", rightArea, cfg.similarity);
        if (!throwBtn) {
            rocoLog("【洛克王国世界】第" + (i + 1) + "只奇丽叶未出现投掷按钮，继续下一个", hooks);
            continue;
        }
        rocoLog("【洛克王国世界】第" + (i + 1) + "只奇丽叶已出现投掷按钮", hooks);
    }

    rocoLog("【洛克王国世界】奇丽页自动刷花流程完成", hooks);
}

function rocoRunMain(cfg, hooks) {
    let launchOk = rocoDoLaunch(cfg, hooks);
    if (!launchOk) {
        rocoLog("【洛克王国世界】启动阶段未完成，停止后续流程", hooks);
        return;
    }
    if (rocoShouldStop(hooks)) return;
    if (cfg.dailyQuest) rocoDoDaily(cfg, hooks);
    if (rocoShouldStop(hooks)) return;
    if (cfg.collectReward) rocoDoCollectReward(cfg, hooks);
    if (rocoShouldStop(hooks)) return;
    if (cfg.flowerPage) rocoDoFlowerPage(cfg, hooks);
}

function start(inputConfig, hooks) {
    let cfg = createDefaultConfig();
    if (inputConfig) {
        for (let k in inputConfig) cfg[k] = inputConfig[k];
    }
    if (!cfg.enabled) {
        rocoLog("【洛克王国世界】模块未启用，跳过", hooks);
        return;
    }
    rocoLog("【洛克王国世界】模块启动，任务=" + cfg.task, hooks);

    if (cfg.task === "launch") rocoDoLaunch(cfg, hooks);
    else if (cfg.task === "daily") rocoDoDaily(cfg, hooks);
    else if (cfg.task === "reward") rocoDoCollectReward(cfg, hooks);
    else if (cfg.task === "flower") rocoDoFlowerPage(cfg, hooks);
    else rocoRunMain(cfg, hooks);

    rocoLog("【洛克王国世界】模块结束", hooks);
}

module.exports = {
    createDefaultConfig: createDefaultConfig,
    start: start,
    doLaunch: rocoDoLaunch,
    doDaily: rocoDoDaily,
    doCollectReward: rocoDoCollectReward,
    doFlowerPage: rocoDoFlowerPage,
    findTarget: findTarget,
    findAndClickTarget: findAndClickTarget,
    findAndClickTargetRetry: findAndClickTargetRetry,
    clickTarget: clickTarget
};

try {
    if (typeof global !== "undefined") global.__mfs_roco = module.exports;
    else this.__mfs_roco = module.exports;
} catch (e) {
}
