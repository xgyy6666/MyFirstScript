var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

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

module.exports = {
    LogSave,
    信息提示
};

try {
    if (typeof global !== "undefined") global.__mfs_logger = module.exports;
    else this.__mfs_logger = module.exports;
} catch (e) {
}
