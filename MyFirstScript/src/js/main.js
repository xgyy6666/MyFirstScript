// ======================================== 
// 全局状态管理 (利用 JS 对象替代散装的全局变量)
// ======================================== 
let GlobalState = {
    当前运行游戏: "",       // "鸣潮", "星穹铁道", "绝区零", ""
    当前任务状态: "未开始", 
    网易云时间耗尽: 0,
    异常_时间耗尽: 0,
    重启信号: 0,
    停止信号: 0,
    暂停信号: 0,
    停止倒计时: 0,
    超时触发: 0,
    心跳时间戳: 0,
    异常计数: 0,

    
    // 鸣潮专属
    鸣潮_任务阶段: "未开始",
    
    // 绝区零专属
    绝区零_任务阶段: "未开始",
    绝区零_已喝咖啡: false,
    绝区零_目标副本: "",
    绝区零战斗点击坐标: [
        [118, 1014], [118, 1014], [109, 897], [118, 1014], 
        [118, 1014], [118, 1014], [213, 1131], [105, 1128], [384, 1130]
    ] // JS 里用数组存坐标更优雅，不用再 split 字符串了
};

function safeRequire(id) {
    try {
        return require(id);
    } catch (e) {
        return null;
    }
}

let wuwa = safeRequire("./games/wuwa.js") || (typeof global !== "undefined" ? global.__mfs_wuwa : this.__mfs_wuwa);
let starrail = safeRequire("./games/starrail.js") || (typeof global !== "undefined" ? global.__mfs_starrail : this.__mfs_starrail);
let zzz = safeRequire("./games/zzz.js") || (typeof global !== "undefined" ? global.__mfs_zzz : this.__mfs_zzz);
let genshin = safeRequire("./games/genshin.js") || (typeof global !== "undefined" ? global.__mfs_genshin : this.__mfs_genshin);
let roco = safeRequire("./games/roco.js") || (typeof global !== "undefined" ? global.__mfs_roco : this.__mfs_roco);
let delta = safeRequire("./games/delta.js") || (typeof global !== "undefined" ? global.__mfs_delta : this.__mfs_delta);
let cs = safeRequire("./games/cs.js") || (typeof global !== "undefined" ? global.__mfs_cs : this.__mfs_cs);

function parseTaskSequence(rawText) {
    if (!rawText) return [];
    let text = String(rawText).replace(/\n/g, "->");
    let parts = text.split("->");
    let result = [];
    for (let i = 0; i < parts.length; i++) {
        let item = parts[i].trim();
        if (!item) continue;
        let game = item;
        let task = "默认任务";
        if (item.indexOf(":") >= 0) {
            let arr = item.split(":");
            game = (arr[0] || "").trim();
            task = (arr[1] || "").trim() || "默认任务";
        }
        result.push({ game: game, task: task });
    }
    return result;
}

function parseAccountList(rawText) {
    if (!rawText) return [];
    let text = String(rawText).replace(/\n/g, ",").replace(/;/g, ",").replace(/\|/g, ",");
    let arr = text.split(",");
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        let a = (arr[i] || "").trim();
        if (a) result.push(a);
    }
    return result;
}

function getAccountSwitchConfigByGame(gameName) {
    if (gameName === "鸣潮") {
        return {
            enable: readConfigBoolean("wuwaAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("wuwaAccountList")),
            intervalMin: readConfigInt("wuwaSwitchIntervalMin")
        };
    }
    if (gameName === "星穹铁道") {
        return {
            enable: readConfigBoolean("starrailAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("starrailAccountList")),
            intervalMin: readConfigInt("starrailSwitchIntervalMin")
        };
    }
    if (gameName === "绝区零") {
        return {
            enable: readConfigBoolean("zzzAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("zzzAccountList")),
            intervalMin: readConfigInt("zzzSwitchIntervalMin")
        };
    }
    if (gameName === "洛克王国世界") {
        return {
            enable: readConfigBoolean("rocoAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("rocoAccountList")),
            intervalMin: readConfigInt("rocoSwitchIntervalMin")
        };
    }
    if (gameName === "三角洲行动") {
        return {
            enable: readConfigBoolean("deltaAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("deltaAccountList")),
            intervalMin: readConfigInt("deltaSwitchIntervalMin")
        };
    }
    if (gameName === "原神") {
        return {
            enable: readConfigBoolean("genshinAccountSwitchEnable"),
            accounts: parseAccountList(readConfigString("genshinAccountList")),
            intervalMin: readConfigInt("genshinSwitchIntervalMin")
        };
    }
    return { enable: false, accounts: [], intervalMin: 0 };
}

function 切换到账号(gameName, accountName) {
    // 这里是自动换号的执行入口：后续补具体找图+点击流程
    LogSave("【自动换号】准备切换账号，游戏[" + gameName + "] -> 账号[" + accountName + "]");
    sleep(800);
    LogSave("【自动换号】切号动作完成（占位逻辑）");
}

function 执行游戏启动流程(gameName) {
    LogSave("【" + gameName + "】开始执行游戏启动流程");
    // TODO: 补充启动游戏、等待进入主界面的真实步骤
    sleep(1000);
    LogSave("【" + gameName + "】游戏启动流程完成");
}

// ========================================
// 异常处理配置（按需把你的截图文件名补齐）
// ========================================
let ExceptionConfig = {
    // 主线程如果多久不更新心跳，则视为卡死/阻塞
    主线程卡死阈值毫秒: 60 * 1000,
    // 弹窗处理节流：同一类弹窗连续处理过多次会触发重启信号
    单类弹窗最大处理次数: 10,
    // 通用“新弹窗”关闭规则：把常见关闭按钮截图放这里
    弹窗规则: [
        { name: "通用关闭X", image: "关闭.png", offsetX: 0, offsetY: 0 },
        { name: "通用关闭X2", image: "关闭2.png", offsetX: 0, offsetY: 0 },
        { name: "确定按钮", image: "确定.png", offsetX: 0, offsetY: 0 },
        { name: "取消按钮", image: "取消.png", offsetX: 0, offsetY: 0 },
        { name: "返回按钮", image: "返回.png", offsetX: 0, offsetY: 0 }
    ],
    // 网络/断线/加载卡住相关截图（按你的实际素材改名/补充）
    网络异常规则: [
        { name: "网络异常", image: "网络异常.png", offsetX: 0, offsetY: 0 },
        { name: "重新连接", image: "重新连接.png", offsetX: 0, offsetY: 0 },
        { name: "重试", image: "重试.png", offsetX: 0, offsetY: 0 }
    ]
};

// ======================================== 
// 日志与提示模块
// ======================================== 
function LogSave(content) {
    // 1. 打印到 EasyClick 控制台
    logd(content);
    // 2. 屏幕悬浮提示
    toast(content);
    // 3. 写入本地文件 (EC文件操作)
    let logText = "[" + new Date().toLocaleString() + "] " + content + "\n";
    file.appendLine("/sdcard/脚本日志.txt", logText);
}

function 信息提示(内容) {
    LogSave(内容);
    sleep(1500);
}

function getOfficialOcrConfig() {
    return {
        enabled: true,
        baseUrl: "local",
        ocrType: "paddleOcrNcnnV5",
        padding: 32,
        maxSideLen: 640,
        timeoutMs: 20000
    };
}

let LocalOcrHolder = {
    instance: null,
    inited: false
};

function getLocalOcrInstance() {
    if (LocalOcrHolder.instance) {
        return LocalOcrHolder.instance;
    }
    try {
        if (typeof ocr === "undefined" || !ocr || typeof ocr.newOcr !== "function") {
            LogSave("【本地OCR】OCR接口不可用");
            return null;
        }
        LocalOcrHolder.instance = ocr.newOcr();
        if (!LocalOcrHolder.instance) {
            LogSave("【本地OCR】创建OCR实例失败");
            return null;
        }
        return LocalOcrHolder.instance;
    } catch (e) {
        LogSave("【本地OCR】创建实例异常: " + e);
        return null;
    }
}

function ensureLocalOcrReady() {
    if (LocalOcrHolder.inited) {
        return true;
    }
    let ins = getLocalOcrInstance();
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
        LogSave("【本地OCR】初始化异常: " + e);
        return false;
    }
    if (!ok) {
        try {
            LogSave("【本地OCR】初始化失败: " + (ins.getErrorMsg ? ins.getErrorMsg() : "未知错误"));
        } catch (e2) {
            LogSave("【本地OCR】初始化失败");
        }
        return false;
    }
    LocalOcrHolder.inited = true;
    return true;
}

function callOfficialOcrByImage(img, overrideCfg) {
    let cfg = getOfficialOcrConfig();
    let ext = overrideCfg || {};
    if (typeof ext.enabled !== "undefined") cfg.enabled = !!ext.enabled;
    if (ext.ocrType) cfg.ocrType = String(ext.ocrType);
    if (typeof ext.padding !== "undefined") cfg.padding = ext.padding;
    if (typeof ext.maxSideLen !== "undefined") cfg.maxSideLen = ext.maxSideLen;
    if (typeof ext.timeoutMs !== "undefined") cfg.timeoutMs = ext.timeoutMs;

    if (!cfg.enabled) {
        LogSave("【本地OCR】未启用，跳过调用。");
        return [];
    }
    if (!img) {
        LogSave("【本地OCR】图片对象为空。");
        return [];
    }
    if (!ensureLocalOcrReady()) {
        return [];
    }

    try {
        let ins = getLocalOcrInstance();
        if (!ins) {
            return [];
        }
        let result = ins.ocrImage(img, cfg.timeoutMs, {});
        if (!result || !result.length) {
            return [];
        }
        return result;
    } catch (e) {
        LogSave("【本地OCR】调用失败: " + e);
        return [];
    }
}

function captureAndCallOfficialOcr(overrideCfg) {
    let needRecycle = false;
    let img = null;
    try {
        if (!image.requestScreenCapture(10000, 0)) {
            LogSave("【本地OCR】申请截图权限失败");
            return [];
        }
        sleep(1000);
        img = image.captureFullScreenEx();
        if (!img) {
            LogSave("【本地OCR】截图失败");
            return [];
        }
        needRecycle = true;
        return callOfficialOcrByImage(img, overrideCfg);
    } catch (e) {
        LogSave("【本地OCR】截图识别失败: " + e);
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

function findOfficialOcrText(targetText, overrideCfg) {
    let result = captureAndCallOfficialOcr(overrideCfg);
    let target = String(targetText || "").trim();
    if (!target) return null;
    for (let i = 0; i < result.length; i++) {
        let item = result[i];
        let label = String(item.label || "").trim();
        if (label.indexOf(target) >= 0) {
            return item;
        }
    }
    return null;
}

function nowMs() {
    return new Date().getTime();
}

function 更新心跳() {
    GlobalState.心跳时间戳 = nowMs();
}

function 应该停止() {
    return GlobalState.停止信号 === 1 || GlobalState.重启信号 === 1;
}

function 应该暂停() {
    return GlobalState.暂停信号 === 1;
}

function 等待如果暂停() {
    while (应该暂停() && !应该停止()) {
        sleep(300);
    }
}



function goHomeScreen() {
    try {
        let r = home();
        if (r) return true;
    } catch (e) {
    }
    try {
        let r2 = home2();
        if (r2) return true;
    } catch (e2) {
    }
    return false;
}

function getEnabledGameNames(enableSeq, queue) {
    if (enableSeq && queue && queue.length > 0) {
        let result = [];
        let map = {};
        for (let i = 0; i < queue.length; i++) {
            let game = String(queue[i].game || "").trim();
            if (game && !map[game]) {
                map[game] = true;
                result.push(game);
            }
        }
        return result;
    }
    let result2 = [];
    if (readConfigString("run_wuwa") === "true" || readConfigString("run_wuwa") === "1") result2.push("鸣潮");
    if (readConfigString("run_starrail") === "true" || readConfigString("run_starrail") === "1") result2.push("星穹铁道");
    if (readConfigString("run_zzz") === "true" || readConfigString("run_zzz") === "1") result2.push("绝区零");
    if (readConfigString("run_genshin") === "true" || readConfigString("run_genshin") === "1") result2.push("原神");
    if (readConfigString("run_roco") === "true" || readConfigString("run_roco") === "1") result2.push("洛克王国世界");
    if (readConfigString("run_delta") === "true" || readConfigString("run_delta") === "1") result2.push("三角洲行动");
    if (readConfigString("run_cs") === "true" || readConfigString("run_cs") === "1") result2.push("CS测试");
    return result2;
}



function 在屏幕找图点(imageName, similarity) {
    let tpl = null;
    try {
        tpl = image.readResAutoImage(imageName);
        if (!tpl) return null;
        let w = device.getScreenWidth();
        let h = device.getScreenHeight();
        let sim = similarity ? similarity : 0.8;
        let arr = image.findImageEx(tpl, 0, 0, w, h, sim, sim, 1, 5);
        if (!arr || arr.length <= 0) return null;
        let c = arr[0].center();
        return { x: c.x, y: c.y, similarity: arr[0].similarity };
    } catch (e) {
        return null;
    } finally {
        try {
            if (tpl) tpl.recycle();
        } catch (e2) {
        }
    }
}

function 安全点击(x, y, desc) {
    if (应该停止()) return false;
    clickPoint(x, y);
    if (desc) LogSave("点击：" + desc + " (" + x + "," + y + ")");
    return true;
}

function 查找并点击(imageName, offsetX, offsetY, desc, similarity) {
    if (应该停止()) return false;
    let sim = similarity ? similarity : 0.8;
    let pt = 在屏幕找图点(imageName, sim);
    if (!pt) return false;
    return 安全点击(pt.x + (offsetX || 0), pt.y + (offsetY || 0), desc || imageName);
}

function 尝试处理异常一次() {
    if (应该停止()) return true;

    // 1) 网易云时间耗尽：交给主线程决定如何退出/切换账号等
    if (GlobalState.异常_时间耗尽 === 1) {
        LogSave("【异常】检测到时间耗尽标记，等待主线程处理。");
        return true;
    }

    // 2) 网络相关弹窗（优先处理）
    for (let i = 0; i < ExceptionConfig.网络异常规则.length; i++) {
        let rule = ExceptionConfig.网络异常规则[i];
        if (查找并点击(rule.image, rule.offsetX, rule.offsetY, "网络处理：" + rule.name, 0.8)) {
            GlobalState.异常计数 += 1;
            sleep(1000);
            return true;
        }
    }

    // 3) 通用新弹窗关闭
    for (let j = 0; j < ExceptionConfig.弹窗规则.length; j++) {
        let pr = ExceptionConfig.弹窗规则[j];
        if (查找并点击(pr.image, pr.offsetX, pr.offsetY, "弹窗处理：" + pr.name, 0.8)) {
            GlobalState.异常计数 += 1;
            sleep(600);
            return true;
        }
    }

    return false;
}

// ======================================== 
// 核心监控线程 (EasyClick 多线程语法)
// ======================================== 
function 独立监测线程() {
    GlobalState.异常_时间耗尽 = 0;

    while (true) {
        if (应该停止()) return;
        等待如果暂停();

        // 1. 检测网易云游戏时间不足
        let point = 在屏幕找图点("网易云时间耗尽.png", 0.8);
        
        if (point) {
            LogSave("【监测】严重警告：网易云游戏时间耗尽！");
            GlobalState.异常_时间耗尽 = 1; 
            
            // 原地等待主线程处理
            while (GlobalState.异常_时间耗尽 === 1) {
                if (应该停止()) return;
                sleep(1000);
                LogSave("【监测】等待主线程处理时间耗尽问题...");
            }
            LogSave("【监测】主线程已处理，恢复监控。");
        }
        
        // 顺便做一次轻量异常处理（新弹窗/断线提示等）
        尝试处理异常一次();

        // 每2秒看一次屏幕
        sleep(2000); 
    }
}

// ========================================
// 看门狗线程：处理弹窗 + 卡死检测 + 自动重启信号
// ========================================
function 看门狗线程() {
    let lastHeartbeat = nowMs();
    let popupHandledCount = 0;

    while (true) {
        if (应该停止()) return;
        等待如果暂停();

        let hb = GlobalState.心跳时间戳 || 0;
        if (hb > 0) lastHeartbeat = hb;

        // 1) 卡死/阻塞检测：主线程长时间不更新心跳
        if (nowMs() - lastHeartbeat > ExceptionConfig.主线程卡死阈值毫秒) {
            LogSave("【看门狗】主线程疑似卡死，触发重启信号。");
            GlobalState.重启信号 = 1;
            return;
        }

        // 2) 统一弹窗/断线处理
        let handled = 尝试处理异常一次();
        if (handled) {
            popupHandledCount += 1;
            if (popupHandledCount >= ExceptionConfig.单类弹窗最大处理次数) {
                LogSave("【看门狗】异常处理次数过多，触发重启信号防止死循环。");
                GlobalState.重启信号 = 1;
                return;
            }
        } else {
            // 没有异常则慢慢衰减计数，避免偶发弹窗导致误判
            if (popupHandledCount > 0) popupHandledCount -= 1;
        }

        sleep(800);
    }
}

// ======================================== 
// 核心功能封装：循环找图 (带中断保护)
// ======================================== 
function 循环找图(imageName, offsetX, offsetY, showme, timeoutMs, similarity) {
    LogSave(showme);
    sleep(3000);

    let start = nowMs();
    let sim = similarity ? similarity : 0.8;

    while (true) {
        更新心跳();
        等待如果暂停();

        // 1. 随时响应中断信号
        if (应该停止()) {
            LogSave("【循环找图】检测到重启信号，强制退出！");
            return false; 
        }

        // 2. 超时保护（避免网络卡顿/黑屏时永远等待）
        if (timeoutMs && (nowMs() - start > timeoutMs)) {
            GlobalState.超时触发 = 1;
            LogSave("【循环找图】超时未找到：" + imageName);
            return false;
        }

        // 3. 先尝试处理一次异常（新弹窗/断线提示等）
        尝试处理异常一次();

        // 4. 屏幕找图（兼容 DEX 环境）
        let result = 在屏幕找图点(imageName, sim);

        if (result) {
            // 找到了，计算偏移并点击
            let tapX = result.x + offsetX;
            let tapY = result.y + offsetY;
            LogSave("找到[" + showme + "]，点击坐标：" + tapX + "," + tapY);
            
            // EC 特有的绝对坐标点击
            安全点击(tapX, tapY, showme);
            sleep(1000);
            return true; // 找图成功，退出循环
        } else {
            sleep(1000); // 没找到，等1秒继续找
        }
    }
}

// ======================================== 
// 绝区零特化：疯狂点击打桩机
// ======================================== 
function 疯狂点击循环(coordArray) {
    while (true) {
        更新心跳();
        等待如果暂停();
        if (应该停止()) return;

        for (let i = 0; i < coordArray.length; i++) {
            if (应该停止()) return;
            let x = coordArray[i][0];
            let y = coordArray[i][1];
            
            clickPoint(x, y);
            sleep(50); // 技能停顿
        }
        sleep(50); // 打完一套喘口气
    }
}

// ======================================== 
// 主程序入口
// ======================================== 
function main() {
    LogSave("初始化引擎与环境...");
    let officialOcrCfg = getOfficialOcrConfig();
    if (officialOcrCfg.enabled) {
        LogSave("【本地OCR】已启用: " + officialOcrCfg.ocrType);
    } else {
        LogSave("【本地OCR】未启用，将跳过文字识别流程。");
    }

    // 找图前初始化 OpenCV（首次可能略慢）
    let cvOk = false;
    try {
        cvOk = image.initOpenCV();
    } catch (e) {
        cvOk = false;
    }
    LogSave("OpenCV 初始化结果: " + cvOk);

    try {
        let watchdogDeadThresholdSec = readConfigInt("watchdogDeadThresholdSec");
        if (watchdogDeadThresholdSec > 0) {
            ExceptionConfig.主线程卡死阈值毫秒 = watchdogDeadThresholdSec * 1000;
        }
    } catch (e1) {
    }
    try {
        let watchdogPopupMaxCount = readConfigInt("watchdogPopupMaxCount");
        if (watchdogPopupMaxCount > 0) {
            ExceptionConfig.单类弹窗最大处理次数 = watchdogPopupMaxCount;
        }
    } catch (e2) {
    }
    LogSave("【看门狗】卡死阈值=" + parseInt(ExceptionConfig.主线程卡死阈值毫秒 / 1000, 10) + "秒，异常处理上限=" + ExceptionConfig.单类弹窗最大处理次数);

    GlobalState.停止信号 = 0;
    GlobalState.重启信号 = 0;
    GlobalState.超时触发 = 0;
    GlobalState.异常计数 = 0;
    更新心跳();
    
    // 启动监测线程
    let monitorThread = thread.execAsync(独立监测线程);
    let watchdogThread = thread.execAsync(看门狗线程);

    // 读取UI中的任务队列配置
    let selectedGame = null;
    let enableTaskQueue = readConfigBoolean("enableTaskQueue");
    let enableSeq = enableTaskQueue && readConfigBoolean("enableTaskSequence");
    let seqRaw = enableTaskQueue ? readConfigString("taskSequence") : "";
    let queue = enableTaskQueue ? parseTaskSequence(seqRaw) : [];
    LogSave("【任务队列】" + (enableTaskQueue ? "已开启" : "未开启") + "，顺序执行=" + (enableSeq ? "开启" : "关闭"));
    if (enableSeq && queue.length > 0) {
        selectedGame = queue[0].game;
        LogSave("【顺序执行】已启用，当前步骤: " + queue[0].game + " - " + queue[0].task);
        if (queue.length > 1) {
            LogSave("【顺序执行】后续待执行数量: " + (queue.length - 1));
        }
    } else {
        // 单游戏模式由复选框决定，优先级：鸣潮 > 星穹铁道 > 绝区零 > 原神
        let runWuwa = readConfigString("run_wuwa");
        let runStarrail = readConfigString("run_starrail");
        let runZzz = readConfigString("run_zzz");
        let runGenshin = readConfigString("run_genshin");
        let runRoco = readConfigString("run_roco");
        let runDelta = readConfigString("run_delta");
        let runCs = readConfigString("run_cs");
        if (runWuwa === "true" || runWuwa === "1") selectedGame = "鸣潮";
        else if (runStarrail === "true" || runStarrail === "1") selectedGame = "星穹铁道";
        else if (runZzz === "true" || runZzz === "1") selectedGame = "绝区零";
        else if (runGenshin === "true" || runGenshin === "1") LogSave("【原神】敬请期待，当前版本暂不开放");
        if (runRoco === "true" || runRoco === "1") LogSave("【洛克王国世界】敬请期待，当前版本暂不开放");
        else if (runDelta === "true" || runDelta === "1") selectedGame = "三角洲行动";
        else if (runCs === "true" || runCs === "1") selectedGame = "CS测试";
        LogSave("【顺序执行】未启用，使用勾选模式: " + (selectedGame || "未勾选"));
    }

    let enabledGames = getEnabledGameNames(enableSeq, queue);
    if ((!enableSeq && enabledGames.length <= 0) || (enableSeq && queue.length <= 0)) {
        LogSave("【启动准备】未选择任何任务，脚本停止");
        GlobalState.停止信号 = 1;
        return;
    }

    goHomeScreen();
    sleep(5000); // 等待5秒后开始

    // 自动换号总开关 + 游戏细化配置
    let autoSwitchAccount = readConfigBoolean("autoSwitchAccount");
    if (autoSwitchAccount && selectedGame) {
        let switchCfg = getAccountSwitchConfigByGame(selectedGame);
        if (switchCfg.enable && switchCfg.accounts.length > 0) {
            let interval = switchCfg.intervalMin > 0 ? switchCfg.intervalMin : 30;
            LogSave("【自动换号】已启用，当前游戏[" + selectedGame + "]账号数=" + switchCfg.accounts.length + "，间隔=" + interval + "分钟");
            // 第一版先在启动时切到第一个账号，后续可扩展定时轮换
            切换到账号(selectedGame, switchCfg.accounts[0]);
        } else {
            LogSave("【自动换号】总开关已开，但当前游戏未配置账号列表或未启用细化换号。");
        }
    }

    // 启动鸣潮自动战斗线程（仅当当前步骤是鸣潮且开关开启）
    let combatThread = null;
    let wuwaEnable = readConfigBoolean("wuwaEnable");
    if ((selectedGame === "鸣潮" || selectedGame === "" || selectedGame == null) && wuwaEnable && wuwa && wuwa.runAutoCombat) {
        let sim = readConfigDouble("wuwaSimilarity");
        let noEnemySec = readConfigInt("wuwaNoEnemySec");
        let cfg = wuwa.createDefaultConfig();
        cfg.enabled = true;
        cfg.autoTarget = readConfigBoolean("wuwaAutoTarget");
        cfg.useLiberation = readConfigBoolean("wuwaUseLiberation");
        cfg.enemyGate = readConfigBoolean("wuwaEnemyGate");
        cfg.similarity = sim > 0 ? sim : cfg.similarity;
        cfg.noEnemyExitMs = (noEnemySec > 0 ? noEnemySec : 10) * 1000;
        cfg.useYolo = readConfigBoolean("wuwaUseYolo");
        cfg.yoloOnnxPath = readConfigString("wuwaYoloOnnxPath") || cfg.yoloOnnxPath;
        let wyConf = readConfigDouble("wuwaYoloConfidence");
        cfg.yoloConfidence = wyConf > 0 ? wyConf : cfg.yoloConfidence;

        // 资源自检（提前输出缺失项）
        if (wuwa.checkResourceImages) {
            let missing = wuwa.checkResourceImages(cfg);
            if (missing && missing.length > 0) {
                LogSave("【资源自检】缺少鸣潮战斗图片/配置: " + missing.join(", "));
            } else {
                LogSave("【资源自检】鸣潮战斗图片齐全。");
            }
        }

        combatThread = thread.execAsync(function () {
            wuwa.runAutoCombat(cfg, {
                log: function (s) { LogSave(s); },
                shouldStop: function () { return 应该停止(); }
            });
        });
    } else if (selectedGame === "星穹铁道") {
        let starrailCfg = starrail ? starrail.createDefaultConfig() : null;
        if (starrailCfg && starrail && starrail.start) {
            starrailCfg.enabled = readConfigBoolean("starrailEnable");
            starrailCfg.autoBattle = readConfigBoolean("starrailAutoBattle");
            starrailCfg.useSkill = readConfigBoolean("starrailUseSkill");
            starrailCfg.staminaTimes = readConfigInt("starrailStaminaTimes") || 4;
            let srSim = readConfigDouble("starrailSimilarity");
            starrailCfg.similarity = srSim > 0 ? srSim : starrailCfg.similarity;
            starrailCfg.useYolo = readConfigBoolean("starrailUseYolo");
            starrailCfg.yoloOnnxPath = readConfigString("starrailYoloOnnxPath") || starrailCfg.yoloOnnxPath;
            let srYConf = readConfigDouble("starrailYoloConfidence");
            starrailCfg.yoloConfidence = srYConf > 0 ? srYConf : starrailCfg.yoloConfidence;
            // 顺序执行里若带 task 字段，可映射具体任务
            if (enableSeq && queue.length > 0) {
                let t = (queue[0].task || "").toLowerCase();
                if (t.indexOf("启动") >= 0 || t.indexOf("launch") >= 0) starrailCfg.task = "launch";
                else if (t.indexOf("日常") >= 0 || t === "daily") starrailCfg.task = "daily";
                else if (t.indexOf("体力") >= 0 || t === "power") starrailCfg.task = "power";
                else starrailCfg.task = "main";
            }
            starrail.start(starrailCfg, {
                log: function (s) { LogSave(s); },
                shouldStop: function () { return 应该停止(); }
            });
        } else {
            LogSave("【崩铁】模块未加载成功，已跳过。");
        }
    } else if (selectedGame === "绝区零") {
        let zzzCfg = zzz ? zzz.createDefaultConfig() : null;
        if (zzzCfg && zzz && zzz.start) {
            zzzCfg.enabled = readConfigBoolean("zzzEnable");
            zzzCfg.coffee = readConfigBoolean("zzzCoffee");
            zzzCfg.autoBattle = readConfigBoolean("zzzAutoBattle");
            zzzCfg.roundTimes = readConfigInt("zzzRoundTimes") || 3;
            let zSim = readConfigDouble("zzzSimilarity");
            zzzCfg.similarity = zSim > 0 ? zSim : zzzCfg.similarity;
            zzzCfg.useYolo = readConfigBoolean("zzzUseYolo");
            zzzCfg.yoloOnnxPath = readConfigString("zzzYoloOnnxPath") || zzzCfg.yoloOnnxPath;
            let zYConf = readConfigDouble("zzzYoloConfidence");
            zzzCfg.yoloConfidence = zYConf > 0 ? zYConf : zzzCfg.yoloConfidence;
            if (enableSeq && queue.length > 0) {
                let t2 = (queue[0].task || "").toLowerCase();
                if (t2.indexOf("启动") >= 0 || t2.indexOf("launch") >= 0) zzzCfg.task = "launch";
                else if (t2.indexOf("空洞") >= 0 || t2 === "hollow") zzzCfg.task = "hollow";
                else if (t2.indexOf("战斗") >= 0 || t2 === "combat") zzzCfg.task = "combat";
                else if (t2.indexOf("日常") >= 0 || t2 === "daily") zzzCfg.task = "daily";
                else zzzCfg.task = "main";
            }
            zzz.start(zzzCfg, {
                log: function (s) { LogSave(s); },
                shouldStop: function () { return 应该停止(); }
            });
        } else {
            LogSave("【绝区零】模块未加载成功，已跳过。");
        }
    } else if (selectedGame === "原神") {
        let gCfg = genshin ? genshin.createDefaultConfig() : null;
        if (gCfg && genshin && genshin.start) {
            gCfg.enabled = readConfigBoolean("genshinEnable");
            gCfg.autoCombat = readConfigBoolean("genshinAutoCombat");
            gCfg.leylineTimes = readConfigInt("genshinLeylineTimes") || 4;
            gCfg.pathingName = readConfigString("genshinPathingName") || "";
            let gSim = readConfigDouble("genshinSimilarity");
            gCfg.similarity = gSim > 0 ? gSim : gCfg.similarity;
            if (enableSeq && queue.length > 0) {
                let tg = (queue[0].task || "").toLowerCase();
                if (tg.indexOf("启动") >= 0 || tg.indexOf("launch") >= 0) gCfg.task = "launch";
                else if (tg.indexOf("日常") >= 0 || tg === "daily") gCfg.task = "daily";
                else if (tg.indexOf("地脉") >= 0 || tg === "leyline") gCfg.task = "leyline";
                else if (tg.indexOf("路径") >= 0 || tg === "pathing") gCfg.task = "pathing";
                else if (tg.indexOf("战斗") >= 0 || tg === "combat") gCfg.task = "combat";
                else gCfg.task = "main";
            }
            genshin.start(gCfg, {
                log: function (s) { LogSave(s); },
                shouldStop: function () { return 应该停止(); }
            });
        } else {
            LogSave("【原神】模块未加载成功，已跳过。");
        }
    }

    // 新增游戏模块开关（按UI复选框执行）
    let runRoco = readConfigString("run_roco");
    let runDelta = readConfigString("run_delta");
    let runCs = readConfigString("run_cs");

    let allowRocoRun = false;
    let allowDeltaRun = (runDelta === "true" || runDelta === "1") && selectedGame === "三角洲行动";
    let allowCsRun = (runCs === "true" || runCs === "1") && selectedGame === "CS测试";

    if (allowRocoRun && roco && roco.start) {
        LogSave("【主控】触发洛克王国世界模块");
        let rocoCfg = roco.createDefaultConfig ? roco.createDefaultConfig() : {};
        let rocoRunSelected = runRoco === "true" || runRoco === "1";
        rocoCfg.enabled = rocoRunSelected;
        rocoCfg.dailyQuest = readConfigBoolean("rocoDailyQuest");
        rocoCfg.collectReward = readConfigBoolean("rocoCollectReward");
        rocoCfg.flowerPage = readConfigBoolean("rocoFlowerPage");
        rocoCfg.dailyTimes = readConfigInt("rocoDailyTimes") || 2;
        let rocoSim = readConfigDouble("rocoSimilarity");
        rocoCfg.similarity = rocoSim > 0 ? rocoSim : 0.82;
        if (enableSeq && queue.length > 0) {
            let tr = (queue[0].task || "").toLowerCase();
            if (tr.indexOf("启动") >= 0 || tr.indexOf("launch") >= 0) {
                rocoCfg.task = "launch";
                roco.start(rocoCfg, {
                    shouldStop: function () { return 应该停止() || 应该暂停(); }
                });
            } else {
                roco.start(rocoCfg, {
                    shouldStop: function () { return 应该停止() || 应该暂停(); }
                });
            }
        } else {
            roco.start(rocoCfg, {
                shouldStop: function () { return 应该停止() || 应该暂停(); }
            });
        }
    }
    if (allowDeltaRun && delta && delta.start) {
        LogSave("【主控】触发三角洲行动模块");
        let deltaCfg = delta.createDefaultConfig ? delta.createDefaultConfig() : {};
        deltaCfg.enabled = readConfigBoolean("deltaEnable");
        deltaCfg.launchMode = readConfigString("deltaLaunchMode") || deltaCfg.launchMode;
        deltaCfg.packageName = readConfigString("deltaPackageName") || deltaCfg.packageName;
        deltaCfg.startByPackage = readConfigBoolean("deltaStartByPackage");
        deltaCfg.startByNode = readConfigBoolean("deltaStartByNode");
        deltaCfg.deltaBattlefieldBrick = readConfigBoolean("deltaBattlefieldBrick");
        deltaCfg.battlefieldBrick = deltaCfg.deltaBattlefieldBrick;
        deltaCfg.yoloOnnxPath = readConfigString("deltaYoloOnnxPath") || deltaCfg.yoloOnnxPath || "/sdcard/MyFirstScript/models/sjz.onnx";
        let dConf = readConfigDouble("deltaYoloConfidence");
        let dOcrTimeout = readConfigInt("deltaOcrTimeoutMs");
        let dStartTimeout = readConfigInt("deltaStartActionTimeoutMs");
        let dDeployTimeout = readConfigInt("deltaDeployCheckTimeoutMs");
        let dClickMin = readConfigInt("deltaClickMinDelayMs");
        let dClickMax = readConfigInt("deltaClickMaxDelayMs");
        let dComboMin = readConfigInt("deltaComboMinDelayMs");
        let dComboMax = readConfigInt("deltaComboMaxDelayMs");
        deltaCfg.yoloConfidence = dConf > 0 ? dConf : deltaCfg.yoloConfidence;
        deltaCfg.ocrTimeoutMs = dOcrTimeout > 0 ? dOcrTimeout : deltaCfg.ocrTimeoutMs;
        deltaCfg.startActionTimeoutMs = dStartTimeout > 0 ? dStartTimeout : deltaCfg.startActionTimeoutMs;
        deltaCfg.deployCheckTimeoutMs = dDeployTimeout > 0 ? dDeployTimeout : deltaCfg.deployCheckTimeoutMs;
        deltaCfg.clickMinDelayMs = dClickMin > 0 ? dClickMin : deltaCfg.clickMinDelayMs;
        deltaCfg.clickMaxDelayMs = dClickMax > 0 ? dClickMax : deltaCfg.clickMaxDelayMs;
        deltaCfg.comboMinDelayMs = dComboMin > 0 ? dComboMin : deltaCfg.comboMinDelayMs;
        deltaCfg.comboMaxDelayMs = dComboMax > 0 ? dComboMax : deltaCfg.comboMaxDelayMs;
        if (enableSeq && queue.length > 0) {
            let td = (queue[0].task || "").toLowerCase();
            if (td.indexOf("启动") >= 0 || td.indexOf("launch") >= 0) {
                deltaCfg.task = "launch";
                delta.start(deltaCfg, {
                    log: function (s) { LogSave(s); },
                    shouldStop: function () { return 应该停止() || 应该暂停(); }
                });
            } else {
                delta.start(deltaCfg, {
                    log: function (s) { LogSave(s); },
                    shouldStop: function () { return 应该停止() || 应该暂停(); }
                });
            }
        } else {
            delta.start(deltaCfg, {
                log: function (s) { LogSave(s); },
                shouldStop: function () { return 应该停止() || 应该暂停(); }
            });
        }
    }
    if (allowCsRun && cs && cs.start) {
        LogSave("【主控】触发CS YOLO识别测试模块");
        let csCfg = cs.createDefaultConfig ? cs.createDefaultConfig() : {};
        csCfg.enabled = true;
        csCfg.modelPath = readConfigString("csYoloOnnxPath") || csCfg.modelPath || "/sdcard/MyFirstScript/models/SJZ.onnx";
        csCfg.labels = readConfigString("csYoloLabels") || csCfg.labels;
        let csConf = readConfigDouble("csYoloConfidence");
        let csIntervalMs = readConfigInt("csYoloIntervalMs");
        let csToastIntervalMs = readConfigInt("csYoloToastIntervalMs");
        csCfg.confidence = csConf >= 0 ? csConf : csCfg.confidence;
        csCfg.loopTimes = 0;
        csCfg.intervalMs = csIntervalMs > 0 ? csIntervalMs : csCfg.intervalMs;
        csCfg.toastIntervalMs = csToastIntervalMs > 0 ? csToastIntervalMs : csCfg.toastIntervalMs;
        csCfg.saveDebugImage = readConfigBoolean("csYoloSaveDebugImage");
        let csSaveAnnotatedRaw = readConfigString("csYoloSaveAnnotatedImage");
        csCfg.saveAnnotatedImage = csSaveAnnotatedRaw === "false" || csSaveAnnotatedRaw === "0" ? false : csCfg.saveAnnotatedImage;
        csCfg.annotatedImagePath = readConfigString("csYoloAnnotatedImagePath") || csCfg.annotatedImagePath;
        let csDiagnoseLandscapeRaw = readConfigString("csYoloDiagnoseLandscape");
        csCfg.diagnoseLandscape = csDiagnoseLandscapeRaw === "false" || csDiagnoseLandscapeRaw === "0" ? false : csCfg.diagnoseLandscape;
        cs.start(csCfg, {
            log: function (s) { LogSave(s); },
            shouldStop: function () { return 应该停止() || 应该暂停(); }
        });
    } else if (allowCsRun) {
        LogSave("【CS-YOLO】模块未加载成功，已跳过。");
    }
    
    // 测试调用循环找图
    // 循环找图("鸣潮图标.png", 0, 0, "正在查找鸣潮桌面图标", 30 * 1000, 0.8);

    // 测试调用打桩机 (模拟多线程战斗)
    /*
    LogSave("开始自动战斗...");
    let battleThread = thread.execAsync(function() {
        疯狂点击循环(GlobalState.绝区零战斗点击坐标);
    });
    sleep(5000); // 模拟打了5秒钟
    thread.cancelThread(battleThread); // 战斗结束，杀死连点线程
    LogSave("战斗胜利！");
    */
    
    // 保持主线程，直到外部发停止/重启信号
    while (!应该停止()) {
        更新心跳();
        等待如果暂停();
        sleep(1000);
    }

    // 停止监控线程
    thread.cancelThread(monitorThread);
    thread.cancelThread(watchdogThread);
    if (combatThread) thread.cancelThread(combatThread);
}

main();