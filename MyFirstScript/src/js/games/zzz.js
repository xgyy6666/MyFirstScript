// 绝区零任务模块（参考“一条龙”任务化思路，适配 EasyClick）
var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_sjz_yolo = null;
try { __mfs_sjz_yolo = require("../core/sjz_yolo.js"); } catch (e) {}
if (!__mfs_sjz_yolo) try { __mfs_sjz_yolo = (typeof global !== "undefined" ? global.__mfs_sjz_yolo : this.__mfs_sjz_yolo) || null; } catch (e2) {}

function createDefaultConfig() {
    return {
        enabled: true,
        task: "main", // main | launch | daily | hollow | combat
        autoBattle: true,
        dodgeAssist: true,
        coffee: true,
        roundTimes: 3,
        similarity: 0.82,
        useYolo: true,
        yoloOnnxPath: "/sdcard/MyFirstScript/models/SJZ.onnx",
        yoloLabels: __mfs_sjz_yolo ? __mfs_sjz_yolo.labels.slice(0) : [],
        yoloBoxThr: 0.25,
        yoloIouThr: 0.35,
        yoloConfidence: 0.60,
        yoloForceModelLabelOrder: true,
        yoloVerboseDiagnostics: false
    };
}

function log(msg, hooks) {
    try {
        if (hooks && hooks.log) hooks.log(msg);
        else logd(msg);
    } catch (e) {
    }
}

function shouldStop(hooks) {
    try {
        return hooks && hooks.shouldStop ? hooks.shouldStop() : false;
    } catch (e) {
        return false;
    }
}

function probeYolo(cfg, hooks, scene) {
    if (!cfg.useYolo) return [];
    if (!__mfs_sjz_yolo) {
        log("【绝区零YOLO】通用SJZ YOLO模块未加载", hooks);
        return [];
    }
    let arr = __mfs_sjz_yolo.detectAll(cfg, hooks, "绝区零");
    log("【绝区零YOLO】" + scene + " 检测数量=" + arr.length, hooks);
    return arr;
}

function doLaunch(cfg, hooks) {
    log("【绝区零】开始执行游戏启动流程", hooks);
    probeYolo(cfg, hooks, "启动阶段");
    sleep(1000);
    log("【绝区零】游戏启动流程完成", hooks);
}

function doDaily(cfg, hooks) {
    log("【绝区零】开始日常清理流程（影像店/咖啡/奖励）", hooks);
    if (cfg.coffee) {
        log("【绝区零】执行咖啡店步骤", hooks);
        sleep(600);
    }
    probeYolo(cfg, hooks, "日常清理");
    sleep(1000);
    log("【绝区零】日常清理完成", hooks);
}

function doCombat(cfg, hooks) {
    var rounds = cfg.roundTimes > 0 ? cfg.roundTimes : 3;
    log("【绝区零】开始自动战斗，轮次=" + rounds, hooks);
    for (var i = 0; i < rounds; i++) {
        if (shouldStop(hooks)) return;
        log("【绝区零】战斗第 " + (i + 1) + "/" + rounds + " 轮", hooks);
        probeYolo(cfg, hooks, "战斗第" + (i + 1) + "轮");
        if (cfg.dodgeAssist) {
            log("【绝区零】闪避助手已开启（占位逻辑）", hooks);
        }
        sleep(900);
    }
    log("【绝区零】自动战斗流程完成", hooks);
}

function doHollow(cfg, hooks) {
    log("【绝区零】开始空洞作战流程", hooks);
    probeYolo(cfg, hooks, "空洞作战");
    sleep(1200);
    log("【绝区零】空洞作战完成", hooks);
}

function runMain(cfg, hooks) {
    doLaunch(cfg, hooks);
    if (shouldStop(hooks)) return;
    doDaily(cfg, hooks);
    if (shouldStop(hooks)) return;
    if (cfg.autoBattle) doCombat(cfg, hooks);
}

function start(inputConfig, hooks) {
    var cfg = createDefaultConfig();
    if (inputConfig) {
        for (var k in inputConfig) cfg[k] = inputConfig[k];
    }
    if (!cfg.enabled) {
        log("【绝区零】模块未启用，跳过。", hooks);
        return;
    }
    log("【绝区零】模块启动，任务=" + cfg.task + "，YOLO=" + (cfg.useYolo ? "开启" : "关闭"), hooks);

    if (cfg.task === "launch") doLaunch(cfg, hooks);
    else if (cfg.task === "daily") doDaily(cfg, hooks);
    else if (cfg.task === "hollow") doHollow(cfg, hooks);
    else if (cfg.task === "combat") doCombat(cfg, hooks);
    else runMain(cfg, hooks);

    log("【绝区零】模块结束", hooks);
}

module.exports = {
    createDefaultConfig: createDefaultConfig,
    start: start,
    doLaunch: doLaunch,
    doDaily: doDaily,
    doCombat: doCombat,
    doHollow: doHollow,
    probeYolo: probeYolo
};

try {
    if (typeof global !== "undefined") global.__mfs_zzz = module.exports;
    else this.__mfs_zzz = module.exports;
} catch (e) {
}
