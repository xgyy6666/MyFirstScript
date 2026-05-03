var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

function nowMs() {
    return new Date().getTime();
}

function shouldStop(state) {
    return !!(state && (state.停止信号 === 1 || state.重启信号 === 1));
}

function 安全点击(state, x, y, desc, logger) {
    if (shouldStop(state)) return false;
    clickPoint(x, y);
    if (desc && logger && logger.LogSave) logger.LogSave("点击：" + desc + " (" + x + "," + y + ")");
    return true;
}

function 疯狂点击循环(state, coordArray, heartbeatFn) {
    while (true) {
        if (heartbeatFn) heartbeatFn();
        if (shouldStop(state)) return;

        for (let i = 0; i < coordArray.length; i++) {
            if (shouldStop(state)) return;
            let x = coordArray[i][0];
            let y = coordArray[i][1];
            clickPoint(x, y);
            sleep(50);
        }
        sleep(50);
    }
}

module.exports = {
    nowMs,
    shouldStop,
    安全点击,
    疯狂点击循环
};

try {
    if (typeof global !== "undefined") global.__mfs_touch = module.exports;
    else this.__mfs_touch = module.exports;
} catch (e) {
}
