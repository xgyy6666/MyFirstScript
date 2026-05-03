// 原神任务模块（参考 BetterGI 脚本仓库的任务化组织思路）
var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

function createDefaultConfig() {
    return {
        enabled: true,
        task: "main", // main | launch | daily | leyline | pathing | combat
        autoCombat: true,
        leylineTimes: 4,
        pathingName: "",
        similarity: 0.82
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

function doLaunch(cfg, hooks) {
    log("【原神】开始执行游戏启动流程", hooks);
    // TODO: 补充启动游戏、等待进入主界面的真实步骤
    sleep(1000);
    log("【原神】游戏启动流程完成", hooks);
}

function doDaily(cfg, hooks) {
    log("【原神】开始执行日常委托/奖励流程", hooks);
    sleep(1000);
    log("【原神】日常流程完成", hooks);
}

function doLeyline(cfg, hooks) {
    var times = cfg.leylineTimes > 0 ? cfg.leylineTimes : 4;
    log("【原神】开始地脉循环，次数=" + times, hooks);
    for (var i = 0; i < times; i++) {
        if (shouldStop(hooks)) return;
        log("【原神】地脉第 " + (i + 1) + "/" + times + " 轮", hooks);
        sleep(900);
    }
    log("【原神】地脉流程完成", hooks);
}

function doPathing(cfg, hooks) {
    log("【原神】开始路径追踪: " + (cfg.pathingName || "未指定"), hooks);
    sleep(1200);
    log("【原神】路径追踪流程完成", hooks);
}

function doCombat(cfg, hooks) {
    log("【原神】开始自动战斗流程", hooks);
    sleep(1000);
    log("【原神】自动战斗流程完成", hooks);
}

function runMain(cfg, hooks) {
    doLaunch(cfg, hooks);
    if (shouldStop(hooks)) return;
    doDaily(cfg, hooks);
    if (shouldStop(hooks)) return;
    doLeyline(cfg, hooks);
}

function start(inputConfig, hooks) {
    var cfg = createDefaultConfig();
    if (inputConfig) {
        for (var k in inputConfig) cfg[k] = inputConfig[k];
    }
    if (!cfg.enabled) {
        log("【原神】模块未启用，跳过。", hooks);
        return;
    }

    log("【原神】模块启动，任务=" + cfg.task, hooks);
    if (cfg.task === "launch") doLaunch(cfg, hooks);
    else if (cfg.task === "daily") doDaily(cfg, hooks);
    else if (cfg.task === "leyline") doLeyline(cfg, hooks);
    else if (cfg.task === "pathing") doPathing(cfg, hooks);
    else if (cfg.task === "combat") doCombat(cfg, hooks);
    else runMain(cfg, hooks);
    log("【原神】模块结束", hooks);
}

module.exports = {
    createDefaultConfig: createDefaultConfig,
    start: start,
    doLaunch: doLaunch,
    doDaily: doDaily,
    doLeyline: doLeyline,
    doPathing: doPathing,
    doCombat: doCombat
};

try {
    if (typeof global !== "undefined") global.__mfs_genshin = module.exports;
    else this.__mfs_genshin = module.exports;
} catch (e) {
}
