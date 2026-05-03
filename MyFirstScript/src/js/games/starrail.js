// 崩坏：星穹铁道任务模块（参考任务化结构，适配 EasyClick）
var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

var __mfs_sjz_yolo = null;
try { __mfs_sjz_yolo = require("../core/sjz_yolo.js"); } catch (e) {}
if (!__mfs_sjz_yolo) try { __mfs_sjz_yolo = (typeof global !== "undefined" ? global.__mfs_sjz_yolo : this.__mfs_sjz_yolo) || null; } catch (e2) {}

function createDefaultConfig() {
    return {
        enabled: true,
        task: "main", // main | launch | daily | power | notify
        autoBattle: true,
        useSkill: true,
        staminaTimes: 4,
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
        log("【崩铁YOLO】通用SJZ YOLO模块未加载", hooks);
        return [];
    }
    let arr = __mfs_sjz_yolo.detectAll(cfg, hooks, "崩铁");
    log("【崩铁YOLO】" + scene + " 检测数量=" + arr.length, hooks);
    return arr;
}

function doLaunch(config, hooks) {
    log("【崩铁】开始执行游戏启动流程", hooks);
    probeYolo(config, hooks, "启动阶段");
    sleep(1000);
    log("【崩铁】游戏启动流程完成", hooks);
}

function doDaily(config, hooks) {
    log("【崩铁】开始执行每日实训流程", hooks);
    probeYolo(config, hooks, "每日实训");
    sleep(1200);
    log("【崩铁】每日实训流程完成", hooks);
}

function doPower(config, hooks) {
    var times = config.staminaTimes > 0 ? config.staminaTimes : 4;
    log("【崩铁】开始清体力，轮次=" + times, hooks);
    for (var i = 0; i < times; i++) {
        if (shouldStop(hooks)) return;
        log("【崩铁】清体力第 " + (i + 1) + "/" + times + " 轮", hooks);
        probeYolo(config, hooks, "清体力第" + (i + 1) + "轮");
        sleep(900);
    }
    log("【崩铁】清体力流程完成", hooks);
}

function doNotify(config, hooks) {
    log("【崩铁】通知测试任务触发", hooks);
    sleep(500);
}

function runMain(config, hooks) {
    doLaunch(config, hooks);
    if (shouldStop(hooks)) return;
    doDaily(config, hooks);
    if (shouldStop(hooks)) return;
    doPower(config, hooks);
}

function start(inputConfig, hooks) {
    var cfg = createDefaultConfig();
    if (inputConfig) {
        for (var k in inputConfig) cfg[k] = inputConfig[k];
    }
    if (!cfg.enabled) {
        log("【崩铁】模块未启用，跳过。", hooks);
        return;
    }
    log("【崩铁】模块启动，任务=" + cfg.task + "，YOLO=" + (cfg.useYolo ? "开启" : "关闭"), hooks);

    if (cfg.task === "launch") doLaunch(cfg, hooks);
    else if (cfg.task === "daily") doDaily(cfg, hooks);
    else if (cfg.task === "power") doPower(cfg, hooks);
    else if (cfg.task === "notify") doNotify(cfg, hooks);
    else runMain(cfg, hooks);

    log("【崩铁】模块结束", hooks);
}

module.exports = {
    createDefaultConfig: createDefaultConfig,
    start: start,
    doLaunch: doLaunch,
    doDaily: doDaily,
    doPower: doPower,
    probeYolo: probeYolo
};

try {
    if (typeof global !== "undefined") global.__mfs_starrail = module.exports;
    else this.__mfs_starrail = module.exports;
} catch (e) {
}
