/**
 * 该文件由EasyClick开发工具自动创建
 */
var AutoEnvState = {
    starting: false
};

var ActivityState = {
    lastResumeTs: 0,
    lifecycleLogEnabled: false
};

function main() {
    ui.toast("UI已加载");
    var setMain = ui.layout("参数设置", "main.xml");
    var setWuwa = ui.layout("鸣潮设置", "wuwa.xml");
    var setStarrail = ui.layout("星穹铁道设置", "starrail.xml");
    var setZzz = ui.layout("绝区零设置", "zzz.xml");
    var setGenshin = ui.layout("原神设置", "genshin.xml");
    var setRoco = ui.layout("洛克王国世界设置", "roco.xml");
    var setDelta = ui.layout("三角洲行动设置", "delta.xml");
    ui.logd("设置UI结果: main=" + setMain + ", wuwa=" + setWuwa + ", starrail=" + setStarrail + ", zzz=" + setZzz + ", genshin=" + setGenshin + ", roco=" + setRoco + ", delta=" + setDelta);

    refreshTopStatus();
    appendRuntimeLog("UI已加载完成");

    //监听Activity的事件设置
    ui.onActivityEvent("onResume", function (eventType) {
        let nowTs = new Date().getTime();
        if (ActivityState.lifecycleLogEnabled) {
            ui.logd("activity onResume " + ui.isServiceOk());
        }
        if (nowTs - ActivityState.lastResumeTs < 5000) {
            return;
        }
        ActivityState.lastResumeTs = nowTs;
        refreshTopStatus();
    });

    ui.onActivityEvent("onPause", function (eventType) {
        if (ActivityState.lifecycleLogEnabled) {
            ui.logd("activity onPause");
        }
    });

    ui.onActivityEvent("onStop", function (eventType) {
        if (ActivityState.lifecycleLogEnabled) {
            ui.logd("activity onStop");
        }
    });
    ui.onActivityEvent("onDestroy", function (eventType) {
        if (ActivityState.lifecycleLogEnabled) {
            ui.logd("activity onDestroy");
        }
    });


    //Switch 开关按钮的用法
    var auto_env = ui.getViewValue(ui.auto_env);
    ui.logd("tag为 auto_env 的值: " + auto_env);
    //开关按钮的事件
    ui.setEvent(ui.auto_env, "checkedChange", function (view, isChecked) {
        ui.logd("tag为 auto_env isChecked " + isChecked);
        if (AutoEnvState.starting) {
            return;
        }
        if (isChecked && !ui.isServiceOk()) {
            startAutoEnv();
        }
    });
    if (ui.isServiceOk()) {
        ui.auto_env.setChecked(true);
    } else {
        ui.auto_env.setChecked(false);
    }

    // 为新版界面设置合理默认值（仅在未设置时）
    setDefaultIfEmpty(ui.wuwaSimilarity, "0.82");
    setDefaultIfEmpty(ui.wuwaNoEnemySec, "10");
    setDefaultIfEmpty(ui.taskSequence, "鸣潮:游戏启动 -> 鸣潮:日常 -> 星穹铁道:游戏启动 -> 星穹铁道:体力 -> 绝区零:游戏启动 -> 绝区零:咖啡");
    setDefaultChecked(ui.enableTaskQueue, false);
    setDefaultChecked(ui.autoSwitchAccount, false);
    setDefaultChecked(ui.run_wuwa, true);
    setDefaultChecked(ui.run_starrail, false);
    setDefaultChecked(ui.run_zzz, false);
    setDefaultChecked(ui.run_genshin, false);
    setDefaultChecked(ui.run_roco, false);
    setDefaultChecked(ui.run_delta, false);
    setDefaultChecked(ui.notifyEnable, false);
    setDefaultChecked(ui.permissionModeRoot, false);
    setDefaultChecked(ui.permissionModeAccessibility, true);
    setDefaultIfEmpty(ui.watchdogDeadThresholdSec, "180");
    setDefaultIfEmpty(ui.watchdogPopupMaxCount, "10");
    setDefaultIfEmpty(ui.notifyBaseUrl, "https://");
    setDefaultIfEmpty(ui.notifyToken, "");
    setDefaultChecked(ui.notifyOnStart, true);
    setDefaultChecked(ui.notifyOnError, true);
    setDefaultChecked(ui.notifyOnFinish, true);
    setDefaultChecked(ui.notifyGameWuwa, true);
    setDefaultChecked(ui.notifyGameStarrail, true);
    setDefaultChecked(ui.notifyGameZzz, true);
    setDefaultChecked(ui.notifyGameRoco, true);
    setDefaultChecked(ui.notifyGameDelta, true);
    setDefaultChecked(ui.wuwaEnable, true);
    setDefaultIfEmpty(ui.wuwaLaunchMode, "本地启动");
    setDefaultChecked(ui.wuwaStartByPackage, false);
    setDefaultChecked(ui.wuwaStartByNode, true);
    setDefaultChecked(ui.wuwaAutoTarget, true);
    setDefaultChecked(ui.wuwaUseLiberation, true);
    setDefaultChecked(ui.wuwaEnemyGate, true);
    setDefaultChecked(ui.wuwaUseYolo, true);
    setDefaultIfEmpty(ui.wuwaYoloOnnxPath, "/sdcard/MyFirstScript/models/SJZ.onnx");
    setDefaultIfEmpty(ui.wuwaYoloConfidence, "0.60");
    setDefaultChecked(ui.enableTaskSequence, false);
    setDefaultChecked(ui.starrailEnable, false);
    setDefaultIfEmpty(ui.starrailLaunchMode, "本地启动");
    setDefaultChecked(ui.starrailStartByPackage, false);
    setDefaultChecked(ui.starrailStartByNode, true);
    setDefaultChecked(ui.starrailAutoBattle, true);
    setDefaultChecked(ui.starrailUseSkill, true);
    setDefaultChecked(ui.starrailUseYolo, true);
    setDefaultIfEmpty(ui.starrailYoloOnnxPath, "/sdcard/MyFirstScript/models/SJZ.onnx");
    setDefaultIfEmpty(ui.starrailYoloConfidence, "0.60");
    setDefaultIfEmpty(ui.starrailStaminaTimes, "4");
    setDefaultIfEmpty(ui.starrailSimilarity, "0.82");
    setDefaultChecked(ui.starrailAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.starrailAccountList, "");
    setDefaultIfEmpty(ui.starrailSwitchIntervalMin, "30");
    setDefaultChecked(ui.zzzEnable, false);
    setDefaultIfEmpty(ui.zzzLaunchMode, "本地启动");
    setDefaultChecked(ui.zzzStartByPackage, false);
    setDefaultChecked(ui.zzzStartByNode, true);
    setDefaultChecked(ui.zzzCoffee, true);
    setDefaultChecked(ui.zzzAutoBattle, true);
    setDefaultChecked(ui.zzzUseYolo, true);
    setDefaultIfEmpty(ui.zzzYoloOnnxPath, "/sdcard/MyFirstScript/models/SJZ.onnx");
    setDefaultIfEmpty(ui.zzzYoloConfidence, "0.60");
    setDefaultIfEmpty(ui.zzzRoundTimes, "3");
    setDefaultIfEmpty(ui.zzzSimilarity, "0.82");
    setDefaultChecked(ui.zzzAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.zzzAccountList, "");
    setDefaultIfEmpty(ui.zzzSwitchIntervalMin, "30");
    setDefaultChecked(ui.genshinEnable, false);
    setDefaultChecked(ui.run_genshin, false);
    setDefaultChecked(ui.run_roco, false);
    try { ui.run_genshin.setEnabled(false); ui.run_roco.setEnabled(false); } catch (eDisabledGames) {}
    setDefaultIfEmpty(ui.genshinLaunchMode, "本地启动");
    setDefaultChecked(ui.genshinStartByPackage, false);
    setDefaultChecked(ui.genshinStartByNode, true);
    setDefaultChecked(ui.genshinAutoCombat, true);
    setDefaultIfEmpty(ui.genshinLeylineTimes, "4");
    setDefaultIfEmpty(ui.genshinPathingName, "");
    setDefaultIfEmpty(ui.genshinSimilarity, "0.82");
    setDefaultChecked(ui.genshinAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.genshinAccountList, "");
    setDefaultIfEmpty(ui.genshinSwitchIntervalMin, "30");
    setDefaultIfEmpty(ui.rocoLaunchMode, "本地启动");
    setDefaultChecked(ui.rocoStartByPackage, false);
    setDefaultChecked(ui.rocoStartByNode, true);
    setDefaultChecked(ui.rocoDailyQuest, true);
    setDefaultChecked(ui.rocoCollectReward, true);
    setDefaultChecked(ui.rocoFlowerPage, false);
    setDefaultIfEmpty(ui.rocoDailyTimes, "2");
    setDefaultIfEmpty(ui.rocoSimilarity, "0.82");
    setDefaultChecked(ui.rocoAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.rocoAccountList, "");
    setDefaultIfEmpty(ui.rocoSwitchIntervalMin, "30");
    setDefaultChecked(ui.deltaEnable, false);
    setDefaultIfEmpty(ui.deltaLaunchMode, "本地启动");
    setDefaultChecked(ui.deltaStartByPackage, false);
    setDefaultChecked(ui.deltaStartByNode, true);
    setDefaultChecked(ui.deltaBattlefieldBrick, false);
    setDefaultIfEmpty(ui.deltaYoloOnnxPath, "/sdcard/MyFirstScript/models/sjz.onnx");
    setDefaultIfEmpty(ui.deltaYoloConfidence, "0.60");
    setDefaultChecked(ui.deltaYoloDebugOverlay, false);
    setDefaultIfEmpty(ui.deltaOcrTimeoutMs, "20000");
    setDefaultIfEmpty(ui.deltaStartActionTimeoutMs, "10000");
    setDefaultIfEmpty(ui.deltaDeployCheckTimeoutMs, "1200");
    setDefaultIfEmpty(ui.deltaClickMinDelayMs, "300");
    setDefaultIfEmpty(ui.deltaClickMaxDelayMs, "800");
    setDefaultIfEmpty(ui.deltaComboMinDelayMs, "120");
    setDefaultIfEmpty(ui.deltaComboMaxDelayMs, "260");
    setDefaultChecked(ui.deltaAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.deltaAccountList, "");
    setDefaultIfEmpty(ui.deltaSwitchIntervalMin, "30");
    setDefaultChecked(ui.run_cs, false);
    setDefaultIfEmpty(ui.csYoloOnnxPath, "/sdcard/MyFirstScript/models/SJZ.onnx");
    setDefaultIfEmpty(ui.csYoloLabels, "TuBiao_DaoJuA,TuBiao_DaoJuB,TuBiao_DaoJuC,TuBiao_KaiHuo,TuBiao_PaXia,TuBiao_SheZhi,TuBiao_JiNeng,TuBiao_AnJianSheZhiFanHui,TuBiao_SheZhiFanHui,TuBiao_BiTe");
    setDefaultIfEmpty(ui.csYoloConfidence, "0.60");
    setDefaultIfEmpty(ui.csYoloLoopTimes, "1");
    setDefaultIfEmpty(ui.csYoloIntervalMs, "1000");
    setDefaultChecked(ui.wuwaAccountSwitchEnable, false);
    setDefaultIfEmpty(ui.wuwaAccountList, "");
    setDefaultIfEmpty(ui.wuwaSwitchIntervalMin, "30");
    ui.setEvent(ui.permissionModeRoot, "checkedChange", function (view, isChecked) {
        if (isChecked && !checkRootPermission()) {
            ui.permissionModeRoot.setChecked(false);
            ui.permissionModeAccessibility.setChecked(true);
            appendRuntimeLog("root 未获取，无法选择 root 权限模式");
            refreshTopStatus();
            return;
        }
        if (isChecked) {
            ui.permissionModeAccessibility.setChecked(false);
        } else if (!toBoolValue(ui.getViewValue(ui.permissionModeAccessibility))) {
            ui.permissionModeAccessibility.setChecked(true);
        }
        refreshTopStatus();
    });

    ui.setEvent(ui.permissionModeAccessibility, "checkedChange", function (view, isChecked) {
        if (isChecked) {
            ui.permissionModeRoot.setChecked(false);
        } else if (!toBoolValue(ui.getViewValue(ui.permissionModeRoot)) && checkRootPermission()) {
            ui.permissionModeRoot.setChecked(true);
        } else if (!checkRootPermission()) {
            ui.permissionModeAccessibility.setChecked(true);
        }
        refreshTopStatus();
    });

    refreshPermissionModeUi();
    ensureLaunchMethodPair(ui.wuwaPackageName, ui.wuwaStartByPackage, ui.wuwaStartByNode, "鸣潮");
    ensureLaunchMethodPair(ui.starrailPackageName, ui.starrailStartByPackage, ui.starrailStartByNode, "星穹铁道");
    ensureLaunchMethodPair(ui.zzzPackageName, ui.zzzStartByPackage, ui.zzzStartByNode, "绝区零");
    ensureLaunchMethodPair(ui.genshinPackageName, ui.genshinStartByPackage, ui.genshinStartByNode, "原神");
    ensureLaunchMethodPair(ui.rocoPackageName, ui.rocoStartByPackage, ui.rocoStartByNode, "洛克王国世界");
    ensureLaunchMethodPair(ui.deltaPackageName, ui.deltaStartByPackage, ui.deltaStartByNode, "三角洲行动");
    refreshAllLaunchMethodUis();

    //saveAllBtn 保存参数事件
    ui.setEvent(ui.saveAllBtn, "click", function (view) {
        var s = ui.saveAllConfig();
        ui.logd("保存所有参数结果 " + s)
        appendRuntimeLog("保存参数结果: " + s);
        refreshTopStatus();
    });

    ui.setEvent(ui.selfCheckBtn, "click", function (view) {
        let result = runFeatureSelfCheck();
        appendRuntimeLog("功能自检已执行");
        appendRuntimeLog(result.replace(/\n/g, "；"));
        refreshTopStatus();
    });

    ui.setEvent(ui.refreshPackageBtn, "click", function (view) {
        let allList = refreshAllPackageSpinners(true);
        appendRuntimeLog("已刷新手机内软件包名，包名下拉框已加载 " + allList.length + " 个包名");
        refreshTopStatus();
    });

    refreshAllLaunchMethodUis();

    //系统设置按钮
    ui.setEvent(ui.systemSetting, "click", function (view) {
        appendRuntimeLog("打开系统设置");
        ui.openECSystemSetting();

    });
    //启动脚本按钮
    ui.setEvent(ui.startBtn, "click", function (view) {
        ui.logd("启动脚本，当前参数: " + ui.getConfigJSON());
        appendRuntimeLog("启动脚本");
        refreshTopStatus();
        ui.start();
    });
    //启动环境按钮
    ui.setEvent(ui.envBtn, "click", function (view) {
        //异步启动环境，如果成功了就设置auto_env 按钮的状态
        appendRuntimeLog("开始启动环境");
        startAutoEnv();
    });
    //获取所有的UI参数
    ui.logd("获取所有的UI参数：" + ui.getConfigJSON());
    regFuncToScript();

}

function regFuncToScript() {
    // 脚本可主动读取UI当前配置
    ui.registeFunctionToScript("getUIConfig", function () {
        return ui.getConfigJSON();
    });
    ui.registeFunctionToScript("appendUIRuntimeLog", function (text) {
        appendRuntimeLog(text || "脚本写入日志");
        return true;
    });
}

function setDefaultIfEmpty(view, value) {
    try {
        var cur = ui.getViewValue(view);
        if (cur === null || cur === undefined || cur === "") {
            view.setText(value);
        }
    } catch (e) {
    }
}

function setDefaultChecked(view, value) {
    try {
        var cur = ui.getViewValue(view);
        if (cur === null || cur === undefined || cur === "") {
            view.setChecked(value);
        }
    } catch (e) {
    }
}

function toBoolValue(value) {
    return value === true || value === "true" || value === "1";
}

function getSelectedPermissionMode() {
    let useRoot = false;
    try {
        useRoot = toBoolValue(ui.getViewValue(ui.permissionModeRoot));
    } catch (e) {
    }
    return useRoot ? "root" : "shizuku";
}

function refreshPermissionModeUi() {
    let rootOk = checkRootPermission();
    try {
        ui.permissionModeRoot.setEnabled(rootOk);
        if (!rootOk) {
            ui.permissionModeRoot.setChecked(false);
            ui.permissionModeAccessibility.setChecked(true);
        } else if (!toBoolValue(ui.getViewValue(ui.permissionModeRoot)) && !toBoolValue(ui.getViewValue(ui.permissionModeAccessibility))) {
            ui.permissionModeAccessibility.setChecked(true);
        }
    } catch (e) {
    }
}

function ensureLaunchMethodPair(packageView, packageRadio, nodeRadio, gameLabel) {
    let packageValue = "";
    try {
        packageValue = extractPackageNameFromDisplay(ui.getViewValue(packageView));
    } catch (e) {
    }
    let hasPackage = !!String(packageValue || "").trim();
    try {
        packageRadio.setEnabled(hasPackage);
        if (!hasPackage) {
            packageRadio.setChecked(false);
            nodeRadio.setChecked(true);
        } else if (!toBoolValue(ui.getViewValue(packageRadio)) && !toBoolValue(ui.getViewValue(nodeRadio))) {
            nodeRadio.setChecked(true);
        }
    } catch (e2) {
    }
    try {
        ui.setEvent(packageRadio, "checkedChange", function (view, isChecked) {
            if (isChecked && !String(extractPackageNameFromDisplay(ui.getViewValue(packageView)) || "").trim()) {
                packageRadio.setChecked(false);
                nodeRadio.setChecked(true);
                appendRuntimeLog("【" + gameLabel + "】未识别到包名，无法选择包名启动");
                return;
            }
            if (isChecked) {
                nodeRadio.setChecked(false);
            } else if (!toBoolValue(ui.getViewValue(nodeRadio))) {
                nodeRadio.setChecked(true);
            }
        });
        ui.setEvent(nodeRadio, "checkedChange", function (view, isChecked) {
            if (isChecked) {
                packageRadio.setChecked(false);
            } else if (String(extractPackageNameFromDisplay(ui.getViewValue(packageView)) || "").trim()) {
                packageRadio.setChecked(true);
            } else {
                nodeRadio.setChecked(true);
            }
        });
    } catch (e3) {
    }
}

function refreshAllLaunchMethodUis() {
    ensureLaunchMethodAvailability(ui.wuwaPackageName, ui.wuwaStartByPackage, ui.wuwaStartByNode);
    ensureLaunchMethodAvailability(ui.starrailPackageName, ui.starrailStartByPackage, ui.starrailStartByNode);
    ensureLaunchMethodAvailability(ui.zzzPackageName, ui.zzzStartByPackage, ui.zzzStartByNode);
    ensureLaunchMethodAvailability(ui.genshinPackageName, ui.genshinStartByPackage, ui.genshinStartByNode);
    ensureLaunchMethodAvailability(ui.rocoPackageName, ui.rocoStartByPackage, ui.rocoStartByNode);
    ensureLaunchMethodAvailability(ui.deltaPackageName, ui.deltaStartByPackage, ui.deltaStartByNode);
}

function ensureLaunchMethodAvailability(packageView, packageRadio, nodeRadio) {
    let packageValue = "";
    try {
        packageValue = extractPackageNameFromDisplay(ui.getViewValue(packageView));
    } catch (e) {
    }
    let hasPackage = !!String(packageValue || "").trim();
    try {
        packageRadio.setEnabled(hasPackage);
        if (!hasPackage) {
            packageRadio.setChecked(false);
            nodeRadio.setChecked(true);
        } else if (!toBoolValue(ui.getViewValue(packageRadio)) && !toBoolValue(ui.getViewValue(nodeRadio))) {
            nodeRadio.setChecked(true);
        }
    } catch (e2) {
    }
}

function filterPackageListForSpinner(packageList) {
    let list = packageList || [];
    let skipPrefixes = [
        "android",
        "android.",
        "com.android.",
        "com.google.android.",
        "com.qualcomm.",
        "com.qti.",
        "com.oplus.",
        "com.coloros.",
        "com.heytap.",
        "com.miui.",
        "com.xiaomi.",
        "com.samsung.",
        "com.sec.",
        "com.oneplus.",
        "com.vivo.",
        "com.iqoo.",
        "com.huawei.",
        "com.honor.",
        "com.transsion.",
        "org.codeaurora."
    ];
    let result = [];
    for (let i = 0; i < list.length; i++) {
        let pkg = String(list[i] || "").trim();
        if (!pkg) continue;
        let skip = false;
        for (let j = 0; j < skipPrefixes.length; j++) {
            let prefix = skipPrefixes[j];
            if (pkg === prefix || pkg.indexOf(prefix) === 0) {
                skip = true;
                break;
            }
        }
        if (!skip) {
            result.push(pkg);
        }
    }
    return result.length > 0 ? result : list;
}

function extractPackageNameFromDisplay(text) {
    let value = String(text || "").trim();
    if (!value) return "";
    let idx = value.lastIndexOf("｜");
    if (idx >= 0) {
        return value.substring(idx + 1).trim();
    }
    return value;
}

function getAppLabelByPackage(packageName) {
    let pkg = String(packageName || "").trim();
    if (!pkg) return "";
    if (InstalledPackageCache.labelMap && InstalledPackageCache.labelMap[pkg]) {
        return InstalledPackageCache.labelMap[pkg];
    }

    let label = "";
    try {
        let pm = null;
        if (typeof context !== "undefined" && context && typeof context.getPackageManager === "function") {
            pm = context.getPackageManager();
        }
        if (!pm && typeof runtime !== "undefined" && runtime && typeof runtime.getApplicationContext === "function") {
            let appContext = runtime.getApplicationContext();
            if (appContext && typeof appContext.getPackageManager === "function") {
                pm = appContext.getPackageManager();
            }
        }
        if (!pm && typeof activity !== "undefined" && activity && typeof activity.getPackageManager === "function") {
            pm = activity.getPackageManager();
        }
        if (pm && typeof pm.getApplicationInfo === "function" && typeof pm.getApplicationLabel === "function") {
            let appInfo = pm.getApplicationInfo(pkg, 0);
            if (appInfo) {
                let cs = pm.getApplicationLabel(appInfo);
                label = String(cs || "").trim();
            }
        }
    } catch (e) {
    }

    if (!label) {
        try {
            let out = safeSudoCommand("dumpsys package " + pkg);
            let text = String(out || "");
            let match = text.match(/application-label(?:-[A-Za-z0-9_-]+)?:'([^']+)'/);
            if (match && match[1]) {
                label = String(match[1]).trim();
            }
        } catch (e2) {
        }
    }

    if (!label) {
        try {
            let out2 = safeExecCommand("dumpsys package " + pkg);
            let text2 = String(out2 || "");
            let match2 = text2.match(/application-label(?:-[A-Za-z0-9_-]+)?:'([^']+)'/);
            if (match2 && match2[1]) {
                label = String(match2[1]).trim();
            }
        } catch (e3) {
        }
    }

    if (label) {
        InstalledPackageCache.labelMap[pkg] = label;
        return label;
    }
    return "";
}

function buildPackageDisplayText(packageName) {
    let pkg = String(packageName || "").trim();
    if (!pkg) return "";
    let label = getAppLabelByPackage(pkg);
    if (!label || label === pkg) {
        return pkg;
    }
    return label + "｜" + pkg;
}

function buildPackageSpinnerText(packageList, currentValue) {
    let list = filterPackageListForSpinner(packageList);
    let current = String(currentValue || "").trim();
    let finalList = [];
    let map = {};
    if (current && current.indexOf("|") < 0 && list.indexOf(current) >= 0) {
        let currentDisplay = buildPackageDisplayText(current);
        finalList.push(currentDisplay);
        map[current] = true;
    }
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (!item || map[item]) continue;
        map[item] = true;
        finalList.push(buildPackageDisplayText(item));
    }
    return finalList.join("|");
}

function setSpinnerPackageOptions(view, packageList) {
    try {
        let currentValue = extractPackageNameFromDisplay(ui.getViewValue(view));
        let spinnerText = buildPackageSpinnerText(packageList, currentValue);
        if (spinnerText) {
            ui.setViewValue(view, spinnerText);
        }
    } catch (e) {
        try {
            let currentValue2 = extractPackageNameFromDisplay(ui.getViewValue(view));
            let spinnerText2 = buildPackageSpinnerText(packageList, currentValue2);
            if (spinnerText2) {
                view.setText(spinnerText2);
            }
        } catch (e2) {
        }
    }
}

function refreshAllPackageSpinners(forceRefresh) {
    let list = getInstalledPackageList(!!forceRefresh);
    setSpinnerPackageOptions(ui.wuwaPackageName, list);
    setSpinnerPackageOptions(ui.genshinPackageName, list);
    setSpinnerPackageOptions(ui.starrailPackageName, list);
    setSpinnerPackageOptions(ui.zzzPackageName, list);
    setSpinnerPackageOptions(ui.rocoPackageName, list);
    setSpinnerPackageOptions(ui.deltaPackageName, list);
    refreshAllLaunchMethodUis();
    return list;
}

function getShizukuStatusText() {
    let parts = [];
    let shizukuOk = false;
    let shizukuCommandOk = false;
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.isShizukuOk === "function") {
            shizukuOk = shell.isShizukuOk() === true || shell.isShizukuOk() === "true";
        }
    } catch (e) {
    }
    try {
        if (shizukuOk && typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function") {
            let ret = shell.execShizukuCommand("echo test");
            shizukuCommandOk = ret && ret.length > 0 && !ret.includes("exception") && !ret.includes("error");
        }
    } catch (e2) {
    }
    parts.push("Shizuku服务: " + (shizukuOk ? "已激活" : "未激活"));
    parts.push("Shizuku命令: " + (shizukuCommandOk ? "可用" : "不可用"));
    if (!shizukuOk) {
        parts.push("提示: 请安装 Shizuku 并授权 EasyClick");
    }
    return parts.join("\n");
}

function getShizukuStatusShortText() {
    let shizukuOk = false;
    let shizukuCommandOk = false;
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.isShizukuOk === "function") {
            shizukuOk = shell.isShizukuOk() === true || shell.isShizukuOk() === "true";
        }
    } catch (e) {
    }
    try {
        if (shizukuOk && typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function") {
            let ret = shell.execShizukuCommand("echo test");
            shizukuCommandOk = ret && ret.length > 0 && !ret.includes("exception") && !ret.includes("error");
        }
    } catch (e2) {
    }
    if (shizukuOk && shizukuCommandOk) {
        return "正常";
    } else if (shizukuOk) {
        return "命令不可用";
    } else {
        return "未激活";
    }
}

function getPermissionStatusText() {
    let parts = [];
    let serviceOk = false;
    let envChecked = false;
    let logWriteOk = false;
    let imageApiOk = false;
    let rootOk = false;
    let shizukuOk = false;
    let mode = "shizuku";
    try {
        serviceOk = ui.isServiceOk();
    } catch (e) {
    }
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.isShizukuOk === "function") {
            shizukuOk = shell.isShizukuOk() === true || shell.isShizukuOk() === "true";
        }
    } catch (e) {
    }
    try {
        let envValue = ui.getViewValue(ui.auto_env);
        envChecked = envValue === true || envValue === "true" || envValue === "1";
    } catch (e2) {
    }
    logWriteOk = canWriteRuntimeLogFile();
    imageApiOk = isImageApiReady();
    rootOk = checkRootPermission();
    mode = getSelectedPermissionMode();
    parts.push("当前模式: " + (mode === "root" ? "root" : "Shizuku"));
    parts.push("root: " + (rootOk ? "已获取" : "未获取"));
    parts.push("Shizuku: " + (shizukuOk ? "已激活" : "未激活"));
    parts.push("自动化服务: " + (serviceOk ? "已开启" : "未开启"));
    parts.push("环境开关: " + (envChecked ? "已勾选" : "未勾选"));
    parts.push("日志写入能力: " + (logWriteOk ? "正常" : "异常"));
    parts.push("图像能力接口: " + (imageApiOk ? "可用" : "不可用"));
    parts.push("系统设置入口: 可用");
    return parts.join("\n");
}

function runFeatureSelfCheck() {
    let items = [];
    let serviceOk = false;
    let shizukuOk = false;
    let rootOk = false;
    let configOk = false;
    let launchModeOk = false;
    let envApiOk = false;
    let cvOk = false;
    let resCheck = null;
    let logWriteOk = false;
    let mode = "shizuku";
    let rocoYoloApiOk = false;
    let rocoYoloModelCheck = null;
    let rocoYoloModuleCheck = null;
    let ocrScreenCaptureCheck = null;
    let deltaBattlefieldConfigCheck = null;
    let deltaYoloModelCheck = null;
    let deltaLaunchConfigCheck = null;
    try {
        serviceOk = ui.isServiceOk();
    } catch (e) {
    }
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.isShizukuOk === "function") {
            shizukuOk = shell.isShizukuOk() === true || shell.isShizukuOk() === "true";
        }
    } catch (e) {
    }
    try {
        configOk = !!ui.getConfigJSON();
    } catch (e2) {
    }
    try {
        launchModeOk = !!ui.getViewValue(ui.wuwaLaunchMode) && !!ui.getViewValue(ui.starrailLaunchMode) && !!ui.getViewValue(ui.zzzLaunchMode) && !!ui.getViewValue(ui.genshinLaunchMode) && !!ui.getViewValue(ui.rocoLaunchMode) && !!ui.getViewValue(ui.deltaLaunchMode);
    } catch (e3) {
    }
    try {
        envApiOk = typeof ui.startEnvAsync === "function";
    } catch (e4) {
    }
    try {
        mode = getSelectedPermissionMode();
    } catch (e5) {
    }
    rootOk = checkRootPermission();
    cvOk = checkOpenCvReady();
    resCheck = checkCoreResourceReady();
    logWriteOk = canWriteRuntimeLogFile();
    rocoYoloApiOk = checkRocoYoloApiReady();
    rocoYoloModelCheck = checkRocoYoloModelReady();
    rocoYoloModuleCheck = checkRocoYoloModuleReady();
    ocrScreenCaptureCheck = checkOcrScreenCapturePermission();
    deltaBattlefieldConfigCheck = checkDeltaBattlefieldConfig();
    deltaYoloModelCheck = checkDeltaYoloModelReady();
    deltaLaunchConfigCheck = checkDeltaLaunchConfig();
    items.push("[系统] 权限模式: " + (mode === "root" ? "root" : "Shizuku"));
    items.push("[系统] Root 权限: " + (rootOk ? "正常" : "未获取"));
    items.push("[系统] Shizuku 权限: " + getShizukuStatusShortText());
    items.push("[系统] 自动化服务: " + (serviceOk ? "正常" : "未就绪"));
    items.push("[系统] 环境接口: " + (envApiOk ? "可用" : "不可用"));
    items.push("[系统] OpenCV: " + (cvOk ? "正常" : "初始化失败"));
    items.push("[系统] 日志写入: " + (logWriteOk ? "正常" : "失败"));
    items.push("[配置] 配置读取: " + (configOk ? "正常" : "异常"));
    items.push("[配置] 启动方式控件: " + (launchModeOk ? "正常" : "缺失"));
    items.push("[设备] 已安装包名数量: " + getInstalledPackageCountText());
    items.push("[设备] 包名获取来源: " + (InstalledPackageCache.source || "未获取"));
    items.push("[OCR] 识别引擎: " + getOfficialOcrStatusText());
    items.push("[OCR] 截图权限: " + (ocrScreenCaptureCheck.ok ? "正常" : ocrScreenCaptureCheck.reason));
    items.push("[资源] 基础资源图: " + (resCheck.ok ? "正常" : "缺失 -> " + resCheck.missing.join(", ")));
    items.push("[洛克王国] YOLO API: " + (rocoYoloApiOk ? "可用" : "不可用"));
    items.push("[洛克王国] YOLO 模型文件: " + (rocoYoloModelCheck.ok ? "正常 -> " + rocoYoloModelCheck.path : "缺失 -> " + rocoYoloModelCheck.path));
    items.push("[洛克王国] YOLO 脚本接口: " + (rocoYoloModuleCheck.ok ? "正常" : rocoYoloModuleCheck.reason));
    items.push("[洛克王国] YOLO 参数: " + getRocoYoloConfigStatusText());
    items.push("[三角洲] 启动配置: " + (deltaLaunchConfigCheck.ok ? "正常" : deltaLaunchConfigCheck.reason));
    items.push("[三角洲] 大战场开关: " + (deltaBattlefieldConfigCheck.enabled ? "已勾选" : "未勾选"));
    items.push("[三角洲] YOLO 模型文件: " + (deltaYoloModelCheck.ok ? "正常 -> " + deltaYoloModelCheck.path : "缺失 -> " + deltaYoloModelCheck.path));
    items.push("[三角洲] 战斗参数: " + (deltaBattlefieldConfigCheck.ok ? deltaBattlefieldConfigCheck.summary : deltaBattlefieldConfigCheck.reason));
    items.push("[结论] " + buildSelfCheckConclusion({
        mode: mode,
        rootOk: rootOk,
        shizukuOk: shizukuOk,
        serviceOk: serviceOk,
        envApiOk: envApiOk,
        configOk: configOk,
        launchModeOk: launchModeOk,
        cvOk: cvOk,
        resOk: resCheck.ok,
        logWriteOk: logWriteOk,
        rocoYoloApiOk: rocoYoloApiOk,
        rocoYoloModelOk: rocoYoloModelCheck.ok,
        rocoYoloModuleOk: rocoYoloModuleCheck.ok,
        ocrScreenCaptureOk: ocrScreenCaptureCheck.ok,
        deltaYoloModelOk: deltaYoloModelCheck.ok,
        deltaBattlefieldConfigOk: deltaBattlefieldConfigCheck.ok,
        deltaLaunchConfigOk: deltaLaunchConfigCheck.ok
    }));
    return items.join("\n");
}

function refreshTopStatus() {
    refreshPermissionModeUi();
    try {
        ui.permissionStatus.setText(getPermissionStatusText());
    } catch (e) {
    }
    try {
        ui.shizukuStatus.setText(getShizukuStatusText());
    } catch (e) {
    }
    try {
        ui.selfCheckStatus.setText(runFeatureSelfCheck());
    } catch (e2) {
    }
    try {
        ui.packageStatus.setText(getCurrentPackageStatusText());
    } catch (e23) {
    }
    try {
        ui.permissionGuide.setText("1. 权限模式只保留 root / Shizuku 二选一\n2. root 未获取时，root 选项会自动禁用\n3. 使用 Shizuku 模式时，请确保 Shizuku 已激活\n4. 使用 root 模式时，请确认 root 已授权\n5. 点击立即自检，重点查看结论行和缺失资源图名称\n6. 若 OpenCV 失败或图像接口不可用，请先检查运行环境\n7. 若日志写入失败，请检查存储权限或设备路径\n8. 包名区域现在显示手机内已安装软件包名列表\n9. 当前固定使用本地OCR，请确保设备端OCR环境可用\n10. 洛克 YOLO 自检会检查 API、模型文件、脚本接口是否完整\n11. 三角洲自检会检查大战场刷砖开关、sjz.onnx模型和核心参数\n12. 全部通过后再启动脚本\n13. Shizuku 用于三角洲行动的点击和启动命令执行\n14. 若 Shizuku 未激活，三角洲行动将无法正常执行点击");
    } catch (e3) {
    }
}

function getOfficialOcrStatusText() {
    return "本地OCR（固定启用）";
}

function checkOcrScreenCapturePermission() {
    try {
        if (typeof image === "undefined" || !image || typeof image.requestScreenCapture !== "function") {
            return {
                ok: false,
                reason: "截图接口不可用"
            };
        }
        let ok = !!image.requestScreenCapture(3000, 0);
        try {
            if (typeof image.releaseScreenCapture === "function") {
                image.releaseScreenCapture();
            }
        } catch (e2) {
        }
        return {
            ok: ok,
            reason: ok ? "正常" : "申请本地OCR截图权限失败"
        };
    } catch (e) {
        return {
            ok: false,
            reason: "申请本地OCR截图权限异常"
        };
    }
}

function getResolutionStatusText() {
    try {
        let w = device.getScreenWidth();
        let h = device.getScreenHeight();
        return "当前分辨率: " + w + " x " + h + "\n目标分辨率: 720 x 1280\n目标DPI: 320";
    } catch (e) {
        return "当前分辨率: 获取失败\n目标分辨率: 720 x 1280\n目标DPI: 320";
    }
}

function getCurrentPackageStatusText() {
    let list = getInstalledPackageList(false);
    if (!list || list.length === 0) {
        let failReason = "已安装包名: 获取失败";
        if (InstalledPackageCache.source === "root shell.su boolean") {
            failReason += "\n原因: shell.su(\"pm list packages\") 只返回了布尔值 true，没有返回命令输出内容";
        } else if (checkRootPermission()) {
            failReason += "\n原因: 当前 root 存在，但所有已尝试命令都没有拿到有效的 package: 输出";
        } else {
            failReason += "\n原因: 未获取到可用 root，且普通 shell/代理 shell 也没有拿到结果";
        }
        if (InstalledPackageCache.diagnostics && InstalledPackageCache.diagnostics.length > 0) {
            failReason += "\n诊断:";
            let maxCount = InstalledPackageCache.diagnostics.length > 8 ? 8 : InstalledPackageCache.diagnostics.length;
            for (let i = 0; i < maxCount; i++) {
                failReason += "\n- " + InstalledPackageCache.diagnostics[i];
            }
        }
        return failReason;
    }
    let preview = list.slice(0, 18).join("\n");
    if (list.length > 18) {
        preview += "\n... 共 " + list.length + " 个包名";
    }
    preview += "\n获取来源: " + (InstalledPackageCache.source || "未知");
    return preview;
}

function getInstalledPackageCountText() {
    let list = getInstalledPackageList(false);
    if (!list || list.length === 0) {
        return "获取失败";
    }
    return "共 " + list.length + " 个";
}

function getSimpleResolutionText() {
    try {
        return device.getScreenWidth() + " x " + device.getScreenHeight();
    } catch (e) {
        return "获取失败";
    }
}

let InstalledPackageCache = {
    list: [],
    ts: 0,
    source: "",
    diagnostics: [],
    labelMap: {}
};

function normalizePackageName(line) {
    let text = String(line || "").trim();
    if (!text) return "";
    text = text.replace(/^package:/, "").trim();
    let m = text.match(/[A-Za-z0-9_\.]+/);
    return m ? m[0] : "";
}

function isAppInstalledByUtils(packageName) {
    try {
        if (typeof utils !== "undefined" && utils && typeof utils.isAppExist === "function") {
            return !!utils.isAppExist(packageName);
        }
    } catch (e) {
    }
    return false;
}

function tryReadPackageText(label, getter) {
    let result = {
        ok: false,
        source: label,
        text: "",
        diag: label + " => 空"
    };
    try {
        let raw = getter();
        let text = String(raw || "").trim();
        result.diag = label + " => " + (text ? text.substring(0, 80) : "空");
        if (text && text !== "true" && text.indexOf("package:") >= 0) {
            result.ok = true;
            result.text = text;
        }
    } catch (e) {
        result.diag = label + " 异常: " + e;
    }
    return result;
}

function safeExecCommand(command) {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.execCommand === "function") {
            return shell.execCommand(command);
        }
    } catch (e) {
    }
    return "";
}

function safeSudoCommand(command) {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.sudo === "function") {
            return shell.sudo(command);
        }
    } catch (e) {
    }
    return "";
}

function safeAgentCommandEx(command) {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.execAgentCommandEx === "function") {
            return shell.execAgentCommandEx(command);
        }
    } catch (e) {
    }
    return "";
}

function safeShizukuCommand(command) {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.execShizukuCommand === "function") {
            return shell.execShizukuCommand(command);
        }
    } catch (e) {
    }
    return "";
}

function runPackageListCommandByRoot() {
    let diagnostics = [];
    let tries = [
        tryReadPackageText("shell.su", function () { return shell.su(); }),
        tryReadPackageText("shell.sudo pm list packages", function () { return safeSudoCommand("pm list packages"); }),
        tryReadPackageText("shell.sudo cmd package", function () { return safeSudoCommand("cmd package list packages"); }),
        tryReadPackageText("shell.execCommand pm list packages", function () { return safeExecCommand("pm list packages"); }),
        tryReadPackageText("shell.execCommand cmd package", function () { return safeExecCommand("cmd package list packages"); }),
        tryReadPackageText("shell.execCommand pm -3", function () { return safeExecCommand("pm list packages -3"); })
    ];
    for (let i = 0; i < tries.length; i++) {
        diagnostics.push(tries[i].diag);
        if (tries[i].ok) {
            return {
                ok: true,
                source: tries[i].source,
                text: tries[i].text,
                diagnostics: diagnostics
            };
        }
    }
    return {
        ok: false,
        source: "",
        text: "",
        diagnostics: diagnostics
    };
}

function runPackageListCommandNormal() {
    let diagnostics = [];
    let tries = [
        tryReadPackageText("execAgentCommand", function () { return shell.execAgentCommand("pm list packages"); }),
        tryReadPackageText("execAgentCommand cmd package", function () { return shell.execAgentCommand("cmd package list packages"); }),
        tryReadPackageText("execAgentCommandEx", function () { return safeAgentCommandEx("pm list packages"); }),
        tryReadPackageText("execAgentCommandEx cmd package", function () { return safeAgentCommandEx("cmd package list packages"); }),
        tryReadPackageText("shell.execCommand", function () { return safeExecCommand("pm list packages"); }),
        tryReadPackageText("shell.execCommand cmd package", function () { return safeExecCommand("cmd package list packages"); }),
        tryReadPackageText("shell.execShizukuCommand", function () { return safeShizukuCommand("pm list packages"); }),
        tryReadPackageText("shell.execShizukuCommand cmd package", function () { return safeShizukuCommand("cmd package list packages"); })
    ];
    for (let i = 0; i < tries.length; i++) {
        diagnostics.push(tries[i].diag);
        if (tries[i].ok) {
            return {
                ok: true,
                source: tries[i].source,
                text: tries[i].text,
                diagnostics: diagnostics
            };
        }
    }
    return {
        ok: false,
        source: "",
        text: "",
        diagnostics: diagnostics
    };
}

function getInstalledPackageList(forceRefresh) {
    let now = new Date().getTime();
    if (!forceRefresh && InstalledPackageCache.list.length > 0 && now - InstalledPackageCache.ts < 15000) {
        return InstalledPackageCache.list;
    }

    let suBoolOnly = false;
    let rootResult = runPackageListCommandByRoot();
    let normalResult = {
        ok: false,
        source: "",
        text: "",
        diagnostics: []
    };

    for (let i = 0; i < rootResult.diagnostics.length; i++) {
        if (rootResult.diagnostics[i].indexOf("shell.su => true") >= 0) {
            suBoolOnly = true;
            break;
        }
    }

    let cmdResult = rootResult;
    if (!cmdResult.ok) {
        normalResult = runPackageListCommandNormal();
        cmdResult = normalResult;
    }
    if (!cmdResult.ok || !cmdResult.text) {
        InstalledPackageCache = {
            list: [],
            ts: now,
            source: suBoolOnly ? "root shell.su boolean" : "failed",
            diagnostics: rootResult.diagnostics.concat(normalResult.diagnostics),
            labelMap: {}
        };
        return [];
    }

    let text = String(cmdResult.text).replace(/\r/g, "\n");
    let arr = text.split("\n");
    let result = [];
    let map = {};
    for (let i = 0; i < arr.length; i++) {
        let pkg = normalizePackageName(arr[i]);
        if (!pkg || map[pkg]) continue;
        map[pkg] = true;
        result.push(pkg);
    }

    result.sort();
    InstalledPackageCache = {
        list: result,
        ts: now,
        source: cmdResult.source,
        diagnostics: rootResult.diagnostics.concat(normalResult.diagnostics),
        labelMap: InstalledPackageCache.labelMap || {}
    };
    return result;
}

function detectCurrentPackageName() {
    try {
        if (typeof utils !== "undefined" && utils && typeof utils.getTopPackage === "function") {
            let pkg = utils.getTopPackage();
            if (pkg) return String(pkg);
        }
    } catch (e) {
    }
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.exec === "function") {
            let out = shell.exec("dumpsys window | grep mCurrentFocus");
            if (out) return String(out);
        }
    } catch (e2) {
    }
    return "获取失败";
}

function isImageApiReady() {
    try {
        return !!image && typeof image.readResAutoImage === "function" && typeof image.initOpenCV === "function";
    } catch (e) {
        return false;
    }
}

function canWriteRuntimeLogFile() {
    try {
        let testPath = "/sdcard/脚本日志_自检.txt";
        file.appendLine(testPath, "self-check");
        return true;
    } catch (e) {
        return false;
    }
}

function checkOpenCvReady() {
    try {
        return !!image.initOpenCV();
    } catch (e) {
        return false;
    }
}

function checkRootPermission() {
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.su === "function") {
            let r = shell.su("id");
            return !!r;
        }
    } catch (e) {
    }
    try {
        if (typeof shell !== "undefined" && shell && typeof shell.exec === "function") {
            let r2 = shell.exec("su -c id");
            return !!r2;
        }
    } catch (e2) {
    }
    return false;
}

function checkCoreResourceReady() {
    let names = [
        "wuwa_enemy_mark.png",
        "wuwa_in_combat.png",
        "wuwa_resonance_ready.png"
    ];
    let missing = [];
    for (let i = 0; i < names.length; i++) {
        let img = null;
        try {
            img = image.readResAutoImage(names[i]);
            if (!img) {
                missing.push(names[i]);
            }
        } catch (e) {
            missing.push(names[i]);
        } finally {
            try {
                if (img) img.recycle();
            } catch (e2) {
            }
        }
    }
    return {
        ok: missing.length === 0,
        missing: missing
    };
}

function checkRocoYoloApiReady() {
    try {
        return typeof yolov8Api !== "undefined" && !!yolov8Api && typeof yolov8Api.newYolov8Onxx === "function";
    } catch (e) {
        return false;
    }
}

function checkRocoYoloModelReady() {
    let modelPath = "/sdcard/roco_ui_v1.onnx";
    try {
        return {
            ok: !!file.exists(modelPath),
            path: modelPath
        };
    } catch (e) {
        return {
            ok: false,
            path: modelPath
        };
    }
}

function checkRocoYoloModuleReady() {
    let path = "src/js/games/roco.js";
    try {
        if (!file.exists(path)) {
            return {
                ok: false,
                path: path,
                reason: "脚本文件缺失"
            };
        }
        let text = String(file.readFile(path) || "");
        let hasFindTarget = text.indexOf("function findTarget(") >= 0;
        let hasFindAndClickTarget = text.indexOf("function findAndClickTarget(") >= 0;
        let hasRetry = text.indexOf("function findAndClickTargetRetry(") >= 0;
        if (hasFindTarget && hasFindAndClickTarget && hasRetry) {
            return {
                ok: true,
                path: path,
                reason: ""
            };
        }
        let missing = [];
        if (!hasFindTarget) missing.push("findTarget");
        if (!hasFindAndClickTarget) missing.push("findAndClickTarget");
        if (!hasRetry) missing.push("findAndClickTargetRetry");
        return {
            ok: false,
            path: path,
            reason: "缺少接口 -> " + missing.join(", ")
        };
    } catch (e) {
        return {
            ok: false,
            path: path,
            reason: "读取异常"
        };
    }
}

function getRocoYoloConfigStatusText() {
    try {
        let similarity = String(ui.getViewValue(ui.rocoSimilarity) || "").trim();
        return "模型类型=onnx，相似度=" + (similarity || "未设置") + "，固定YOLO阈值=0.75，固定imgsz=640";
    } catch (e) {
        return "读取失败";
    }
}

function checkDeltaYoloModelReady() {
    let modelPath = "/sdcard/MyFirstScript/models/sjz.onnx";
    try {
        modelPath = String(ui.getViewValue(ui.deltaYoloOnnxPath) || "sjz.onnx").trim() || "sjz.onnx";
    } catch (e) {
    }
    try {
        return {
            ok: !!file.exists(modelPath),
            path: modelPath
        };
    } catch (e2) {
        return {
            ok: false,
            path: modelPath
        };
    }
}

function checkDeltaLaunchConfig() {
    try {
        let launchMode = String(ui.getViewValue(ui.deltaLaunchMode) || "").trim();
        let startByPackage = toBoolValue(ui.getViewValue(ui.deltaStartByPackage));
        let startByNode = toBoolValue(ui.getViewValue(ui.deltaStartByNode));
        let pkg = String(extractPackageNameFromDisplay(ui.getViewValue(ui.deltaPackageName)) || "").trim();
        if (!launchMode) {
            return { ok: false, reason: "启动方式未设置" };
        }
        if (!startByPackage && !startByNode) {
            return { ok: false, reason: "包名启动/节点启动未选择" };
        }
        if (startByPackage && !pkg) {
            return { ok: false, reason: "已选包名启动，但未选择包名" };
        }
        return { ok: true, reason: "启动方式=" + launchMode + "，启动入口=" + (startByPackage ? "包名" : "节点") + (pkg ? "，包名=" + pkg : "") };
    } catch (e) {
        return { ok: false, reason: "启动配置读取异常" };
    }
}

function checkDeltaBattlefieldConfig() {
    try {
        let enabled = toBoolValue(ui.getViewValue(ui.deltaBattlefieldBrick));
        let conf = parseFloat(String(ui.getViewValue(ui.deltaYoloConfidence) || "0").trim());
        let ocrTimeout = parseInt(String(ui.getViewValue(ui.deltaOcrTimeoutMs) || "0").trim(), 10);
        let startTimeout = parseInt(String(ui.getViewValue(ui.deltaStartActionTimeoutMs) || "0").trim(), 10);
        let deployTimeout = parseInt(String(ui.getViewValue(ui.deltaDeployCheckTimeoutMs) || "0").trim(), 10);
        let clickMin = parseInt(String(ui.getViewValue(ui.deltaClickMinDelayMs) || "0").trim(), 10);
        let clickMax = parseInt(String(ui.getViewValue(ui.deltaClickMaxDelayMs) || "0").trim(), 10);
        let comboMin = parseInt(String(ui.getViewValue(ui.deltaComboMinDelayMs) || "0").trim(), 10);
        let comboMax = parseInt(String(ui.getViewValue(ui.deltaComboMaxDelayMs) || "0").trim(), 10);
        let issues = [];
        if (!(conf > 0 && conf <= 1)) issues.push("YOLO置信度应在0~1之间");
        if (!(ocrTimeout > 0)) issues.push("OCR超时需大于0");
        if (!(startTimeout > 0)) issues.push("开始行动超时需大于0");
        if (!(deployTimeout > 0)) issues.push("部署检测超时需大于0");
        if (!(clickMin > 0 && clickMax >= clickMin)) issues.push("点击延迟范围无效");
        if (!(comboMin > 0 && comboMax >= comboMin)) issues.push("连招延迟范围无效");
        return {
            ok: issues.length === 0,
            enabled: enabled,
            reason: issues.length === 0 ? "正常" : issues.join("、"),
            summary: "YOLO=" + conf + "，OCR=" + ocrTimeout + "ms，开始=" + startTimeout + "ms，部署=" + deployTimeout + "ms，点击=" + clickMin + "-" + clickMax + "ms，连招=" + comboMin + "-" + comboMax + "ms"
        };
    } catch (e) {
        return {
            ok: false,
            enabled: false,
            reason: "参数读取异常",
            summary: ""
        };
    }
}

function buildSelfCheckConclusion(state) {
    let issues = [];
    if (state.mode === "root") {
        if (!state.rootOk) issues.push("root 未获取");
    } else {
        if (!state.shizukuOk) issues.push("Shizuku未激活");
    }
    if (!state.serviceOk) issues.push("自动化服务未就绪");
    if (!state.envApiOk) issues.push("环境接口不可用");
    if (!state.configOk) issues.push("配置读取异常");
    if (!state.launchModeOk) issues.push("启动方式控件缺失");
    if (!state.cvOk) issues.push("OpenCV 初始化失败");
    if (!state.resOk) issues.push("资源图缺失");
    if (!state.ocrScreenCaptureOk) issues.push("本地OCR截图权限失败");
    if (!state.rocoYoloApiOk) issues.push("洛克 YOLO API 不可用");
    if (!state.rocoYoloModelOk) issues.push("洛克 YOLO 模型缺失");
    if (!state.rocoYoloModuleOk) issues.push("洛克 YOLO 脚本接口不完整");
    if (!state.deltaLaunchConfigOk) issues.push("三角洲启动配置异常");
    if (!state.deltaYoloModelOk) issues.push("三角洲 sjz.onnx 模型缺失");
    if (!state.deltaBattlefieldConfigOk) issues.push("三角洲大战场参数异常");
    if (!state.logWriteOk) issues.push("日志写入失败");
    if (issues.length === 0) {
        return "全部通过，可直接启动脚本";
    }
    return "发现问题：" + issues.join("、");
}

function appendRuntimeLog(text) {
    try {
        let oldText = ui.getViewValue(ui.runtimeLog);
        let nowText = new Date().toLocaleTimeString() + " " + text;
        let lines = [];
        if (oldText && oldText !== "等待日志输出...") {
            lines = String(oldText).split("\n");
        }
        lines.push(nowText);
        if (lines.length > 12) {
            lines = lines.slice(lines.length - 12);
        }
        ui.runtimeLog.setText(lines.join("\n"));
    } catch (e) {
    }
}


function startAutoEnv() {
    if (AutoEnvState.starting) {
        appendRuntimeLog("环境正在启动中，忽略重复请求");
        return;
    }
    let mode = getSelectedPermissionMode();
    if (mode === "root" && !checkRootPermission()) {
        appendRuntimeLog("root 未获取，无法启动 root 权限模式");
        refreshPermissionModeUi();
        refreshTopStatus();
        return;
    }
    AutoEnvState.starting = true;
    ui.startEnvAsync(function (r) {
        AutoEnvState.starting = false;
        ui.logd("启动环境结果: " + r);
        if (toBoolValue(ui.getViewValue(ui.auto_env)) !== !!r) {
            ui.auto_env.setChecked(r);
        }
        appendRuntimeLog("启动环境结果: " + r + "，当前模式=" + (mode === "root" ? "root" : "Shizuku"));
        refreshTopStatus();
    });
}

main();