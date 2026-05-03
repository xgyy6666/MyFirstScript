// 鸣潮自动战斗（轻量版，适配 EasyClick）
// 目标：分辨率自适配、UI 参数可注入、仅检测到敌人时才启动战斗节奏

var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_vision = null;
try { __mfs_vision = require("../core/vision.js"); } catch (e) {}
if (!__mfs_vision) try { __mfs_vision = (typeof global !== "undefined" ? global.__mfs_vision : this.__mfs_vision) || null; } catch (e2) {}

var __mfs_sjz_yolo = null;
try { __mfs_sjz_yolo = require("../core/sjz_yolo.js"); } catch (e3) {}
if (!__mfs_sjz_yolo) try { __mfs_sjz_yolo = (typeof global !== "undefined" ? global.__mfs_sjz_yolo : this.__mfs_sjz_yolo) || null; } catch (e4) {}

function createDefaultConfig() {
    return {
        enabled: true,
        autoTarget: true,
        useLiberation: true,
        enemyGate: true,
        similarity: 0.82,
        stepSleepMs: 80,
        noEnemyExitMs: 10000,
        useYolo: false,
        yoloOnnxPath: "/sdcard/MyFirstScript/models/SJZ.onnx",
        yoloLabels: __mfs_sjz_yolo ? __mfs_sjz_yolo.labels.slice(0) : ["enemy"],
        yoloInputSize: 640,
        yoloBoxThr: 0.25,
        yoloIouThr: 0.35,
        yoloConfidence: 0.60,
        yoloUseGpu: 0,
        yoloForceModelLabelOrder: true,
        yoloVerboseDiagnostics: false,

        imgEnemy: "wuwa_enemy_mark.png",
        imgInCombat: "wuwa_in_combat.png",
        imgResonanceReady: "wuwa_resonance_ready.png",
        imgEchoReady: "wuwa_echo_ready.png",
        imgLiberationReady: "wuwa_liberation_ready.png",

        baseWidth: 1080,
        baseHeight: 2400,
        points: {
            attack: [990, 2050],
            resonance: [900, 1880],
            echo: [790, 1980],
            liberation: [945, 1710],
            target: [1020, 1520]
        }
    };
}

let WuwaYoloHolder = {
    instance: null,
    inited: false,
    key: ""
};

function nowMs() {
    return new Date().getTime();
}

function safeFindPointByResImage(imageName, similarity) {
    var tpl = null;
    try {
        tpl = image.readResAutoImage(imageName);
        if (!tpl) return null;
        var w = device.getScreenWidth();
        var h = device.getScreenHeight();
        var sim = similarity || 0.82;
        var arr = image.findImageEx(tpl, 0, 0, w, h, sim, sim, 1, 5);
        if (!arr || arr.length <= 0) return null;
        var c = arr[0].center();
        return { x: c.x, y: c.y, s: arr[0].similarity };
    } catch (e) {
        return null;
    } finally {
        try {
            if (tpl) tpl.recycle();
        } catch (e2) {
        }
    }
}

function buildYoloKey(cfg) {
    return [
        cfg.yoloOnnxPath,
        (cfg.yoloLabels || []).join(","),
        cfg.yoloInputSize,
        cfg.yoloBoxThr,
        cfg.yoloIouThr,
        cfg.yoloUseGpu
    ].join("|");
}

function releaseYoloIfNeeded() {
    if (!WuwaYoloHolder.instance) {
        WuwaYoloHolder.inited = false;
        WuwaYoloHolder.key = "";
        return;
    }
    try {
        WuwaYoloHolder.instance.release();
    } catch (e) {
    }
    WuwaYoloHolder.instance = null;
    WuwaYoloHolder.inited = false;
    WuwaYoloHolder.key = "";
}

function buildOnnxYoloConfig(cfg) {
    let tmp = yolov8Api.newYolov8Onxx();
    if (!tmp) return null;
    let result = tmp.getOnnxConfig(cfg.yoloLabels || [], 0, 0, cfg.yoloBoxThr, cfg.yoloIouThr, 2);
    try {
        tmp.release();
    } catch (e) {
    }
    return result;
}

function ensureYoloReady(cfg, log) {
    if (!cfg.useYolo) {
        return false;
    }
    if (__mfs_sjz_yolo) {
        return __mfs_sjz_yolo.ensure(__mfs_sjz_yolo.normalizeConfig(cfg, "鸣潮"), { log: log });
    }
    if (typeof yolov8Api === "undefined" || !yolov8Api) {
        log("【鸣潮YOLO】当前环境不支持 yolov8Api");
        return false;
    }

    let key = buildYoloKey(cfg);
    if (WuwaYoloHolder.instance && WuwaYoloHolder.inited && WuwaYoloHolder.key === key) {
        return true;
    }

    releaseYoloIfNeeded();

    try {
        let ins = yolov8Api.newYolov8Onxx();
        if (!ins) {
            log("【鸣潮YOLO】创建实例失败");
            return false;
        }
        let yoloCfg = buildOnnxYoloConfig(cfg);
        if (!yoloCfg) {
            log("【鸣潮YOLO】生成配置失败");
            try {
                ins.release();
            } catch (e0) {
            }
            return false;
        }
        let ok = ins.initYoloModel(yoloCfg, cfg.yoloOnnxPath, null);
        if (!ok) {
            log("【鸣潮YOLO】模型初始化失败: " + (ins.getErrorMsg ? ins.getErrorMsg() : "未知错误"));
            try {
                ins.release();
            } catch (e1) {
            }
            return false;
        }
        WuwaYoloHolder.instance = ins;
        WuwaYoloHolder.inited = true;
        WuwaYoloHolder.key = key;
        log("【鸣潮YOLO】ONNX模型初始化成功");
        return true;
    } catch (e) {
        log("【鸣潮YOLO】初始化异常: " + e);
        releaseYoloIfNeeded();
        return false;
    }
}

function detectEnemyByYolo(cfg, log) {
    if (!ensureYoloReady(cfg, log)) {
        return null;
    }
    let img = null;
    try {
        if (__mfs_sjz_yolo) {
            return __mfs_sjz_yolo.detectBest(cfg, { log: log }, "鸣潮");
        }
        img = (__mfs_vision && __mfs_vision.captureForLandscape) ? __mfs_vision.captureForLandscape() : image.captureFullScreen();
        if (!img) {
            return null;
        }
        let raw = WuwaYoloHolder.instance.detectImage(img, cfg.yoloLabels);
        if (!raw) {
            return null;
        }
        let arr = JSON.parse(raw);
        if (!arr || arr.length <= 0) {
            return null;
        }
        let best = arr[0];
        for (let i = 1; i < arr.length; i++) {
            if ((arr[i].confidence || 0) > (best.confidence || 0)) {
                best = arr[i];
            }
        }
        return {
            x: Math.floor((best.left + best.right) / 2),
            y: Math.floor((best.top + best.bottom) / 2),
            s: best.confidence || 0,
            name: best.name || ""
        };
    } catch (e) {
        log("【鸣潮YOLO】识别异常: " + e);
        return null;
    } finally {
        try {
            if (img) img.recycle();
        } catch (e2) {
        }
    }
}

function findEnemyPoint(cfg, log) {
    if (cfg.useYolo) {
        return detectEnemyByYolo(cfg, log);
    }
    return safeFindPointByResImage(cfg.imgEnemy, cfg.similarity);
}

function adaptPointsByScreen(cfg) {
    var sw = device.getScreenWidth();
    var sh = device.getScreenHeight();
    var sx = sw / cfg.baseWidth;
    var sy = sh / cfg.baseHeight;

    function scale(p) {
        return [Math.floor(p[0] * sx), Math.floor(p[1] * sy)];
    }

    return {
        attack: scale(cfg.points.attack),
        resonance: scale(cfg.points.resonance),
        echo: scale(cfg.points.echo),
        liberation: scale(cfg.points.liberation),
        target: scale(cfg.points.target)
    };
}

function tap(pt) {
    clickPoint(pt[0], pt[1]);
}

function checkResourceImages(cfg) {
    if (cfg.useYolo) {
        let missing = [];
        if (!cfg.yoloOnnxPath) missing.push("yoloOnnxPath");
        if (!cfg.imgInCombat) missing.push("imgInCombat");
        if (!cfg.imgResonanceReady) missing.push("imgResonanceReady");
        if (!cfg.imgEchoReady) missing.push("imgEchoReady");
        if (!cfg.imgLiberationReady) missing.push("imgLiberationReady");
        return missing;
    }

    var required = [
        cfg.imgEnemy,
        cfg.imgInCombat,
        cfg.imgResonanceReady,
        cfg.imgEchoReady,
        cfg.imgLiberationReady
    ];
    var missing2 = [];
    for (var i = 0; i < required.length; i++) {
        var name = required[i];
        var img = null;
        try {
            img = image.readResAutoImage(name);
            if (!img) missing2.push(name);
        } catch (e) {
            missing2.push(name);
        } finally {
            try {
                if (img) img.recycle();
            } catch (e2) {
            }
        }
    }
    return missing2;
}

function runAutoCombat(inputConfig, hooks) {
    var cfg = createDefaultConfig();
    if (inputConfig) {
        for (var k in inputConfig) cfg[k] = inputConfig[k];
    }
    if (!cfg.enabled) return;

    var points = adaptPointsByScreen(cfg);
    var lastEnemyTs = nowMs();
    var step = 0;
    var log = hooks && hooks.log ? hooks.log : function () {};
    var shouldStop = hooks && hooks.shouldStop ? hooks.shouldStop : function () { return false; };

    var missing = checkResourceImages(cfg);
    if (missing.length > 0) {
        log("【鸣潮战斗】缺少资源/配置：" + missing.join(", "));
    } else {
        log("【鸣潮战斗】资源自检通过。");
    }

    if (cfg.useYolo) {
        log("【鸣潮YOLO】已启用，固定使用 ONNX 模型识别敌人");
    }
    log("【鸣潮战斗】线程启动，等待敌人出现。");

    while (!shouldStop()) {
        var enemyPoint = findEnemyPoint(cfg, log);
        var enemyFound = !!enemyPoint;
        var inCombat = !!safeFindPointByResImage(cfg.imgInCombat, cfg.similarity);
        if (enemyFound || inCombat) {
            lastEnemyTs = nowMs();
        } else if (cfg.enemyGate) {
            if (nowMs() - lastEnemyTs > cfg.noEnemyExitMs) {
                log("【鸣潮战斗】长时间未检测到敌人，自动退出战斗线程。");
                return;
            }
            sleep(200);
            continue;
        }

        if (cfg.autoTarget && step % 10 === 0) {
            if (enemyPoint && cfg.useYolo) {
                tap([enemyPoint.x, enemyPoint.y]);
            } else {
                tap(points.target);
            }
        }

        if (cfg.useLiberation && safeFindPointByResImage(cfg.imgLiberationReady, cfg.similarity)) {
            tap(points.liberation);
        } else if (safeFindPointByResImage(cfg.imgEchoReady, cfg.similarity)) {
            tap(points.echo);
        } else if (safeFindPointByResImage(cfg.imgResonanceReady, cfg.similarity)) {
            tap(points.resonance);
        } else {
            tap(points.attack);
        }

        step += 1;
        sleep(cfg.stepSleepMs);
    }

    log("【鸣潮战斗】收到停止信号，线程结束。");
}

module.exports = {
    createDefaultConfig: createDefaultConfig,
    adaptPointsByScreen: adaptPointsByScreen,
    checkResourceImages: checkResourceImages,
    runAutoCombat: runAutoCombat,
    releaseYoloIfNeeded: releaseYoloIfNeeded
};

try {
    if (typeof global !== "undefined") global.__mfs_wuwa = module.exports;
    else this.__mfs_wuwa = module.exports;
} catch (e) {}
