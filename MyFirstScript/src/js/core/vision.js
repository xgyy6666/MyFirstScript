var module = (typeof module !== "undefined") ? module : { exports: {} };
var exports = module.exports;

function getScreenSize() {
    let w = 0, h = 0;
    try { w = Number(device.getScreenWidth()) || 0; } catch (e) {}
    try { h = Number(device.getScreenHeight()) || 0; } catch (e2) {}
    return { width: w, height: h };
}

function getImageSize(img) {
    let w = 0, h = 0;
    try {
        if (img && typeof img.getWidth === "function") w = Number(img.getWidth()) || 0;
    } catch (e) {}
    try {
        if (img && typeof img.getHeight === "function") h = Number(img.getHeight()) || 0;
    } catch (e2) {}
    if (!w && img) try { w = Number(img.width) || 0; } catch (e3) {}
    if (!h && img) try { h = Number(img.height) || 0; } catch (e4) {}
    return { width: w, height: h };
}

function isLandscape(w, h) {
    return w > h;
}

function isPortrait(w, h) {
    return h > w;
}

function isScreenLandscape() {
    let s = getScreenSize();
    return isLandscape(s.width, s.height);
}

function isImageRotated(img) {
    let s = getScreenSize();
    let i = getImageSize(img);
    if (!s.width || !s.height || !i.width || !i.height) return false;
    return (isLandscape(s.width, s.height) && isPortrait(i.width, i.height)) ||
           (isPortrait(s.width, s.height) && isLandscape(i.width, i.height));
}

function captureForLandscape() {
    let img = null;
    try {
        img = image.captureFullScreenEx();
    } catch (e) {}
    if (!img) {
        try { img = image.captureFullScreen(); } catch (e2) {}
    }
    if (!img) return null;

    if (isImageRotated(img)) {
        let rotated = null;
        try {
            if (typeof image.rotate === "function") {
                rotated = image.rotate(img, 90);
            }
        } catch (e3) {}
        if (rotated) {
            try { image.recycle(img); } catch (e4) {}
            return rotated;
        }
    }
    return img;
}

function fixYoloCoordForLandscape(x, y, img) {
    if (!img) return { x: x, y: y, rotated: false };
    let s = getScreenSize();
    let i = getImageSize(img);
    if (!s.width || !s.height || !i.width || !i.height) return { x: x, y: y, rotated: false };

    if (isLandscape(s.width, s.height) && isPortrait(i.width, i.height)) {
        return { x: y, y: i.width - x, rotated: true };
    }
    if (isPortrait(s.width, s.height) && isLandscape(i.width, i.height)) {
        return { x: i.height - y, y: x, rotated: true };
    }
    return { x: x, y: y, rotated: false };
}

function fixYoloBoundsForLandscape(left, top, right, bottom, img) {
    if (!img) return { left: left, top: top, right: right, bottom: bottom, rotated: false };
    let s = getScreenSize();
    let i = getImageSize(img);
    if (!s.width || !s.height || !i.width || !i.height) return { left: left, top: top, right: right, bottom: bottom, rotated: false };

    if (isLandscape(s.width, s.height) && isPortrait(i.width, i.height)) {
        return {
            left: top,
            top: i.width - right,
            right: bottom,
            bottom: i.width - left,
            rotated: true
        };
    }
    if (isPortrait(s.width, s.height) && isLandscape(i.width, i.height)) {
        return {
            left: i.height - bottom,
            top: left,
            right: i.height - top,
            bottom: right,
            rotated: true
        };
    }
    return { left: left, top: top, right: right, bottom: bottom, rotated: false };
}

function diagnoseLandscapeIssue(img, logFn) {
    let log = logFn || function (m) { try { logd(m); } catch (e) {} };
    let s = getScreenSize();
    let i = getImageSize(img);
    let sw = s.width, sh = s.height;
    let iw = i.width, ih = i.height;
    let screenOri = sw > sh ? "横屏" : (sw < sh ? "竖屏" : "方屏");
    let imgOri = (iw && ih) ? (iw > ih ? "横屏" : (iw < ih ? "竖屏" : "方屏")) : "未知";
    log("【横屏诊断】屏幕：" + sw + "x" + sh + "（" + screenOri + "），截图：" + (iw || "?") + "x" + (ih || "?") + "（" + imgOri + "）");
    if (sw && sh && iw && ih) {
        if ((sw > sh && iw < ih) || (sw < sh && iw > ih)) {
            log("【横屏诊断】方向不一致：需要旋转修正坐标");
            return true;
        }
        if (sw !== iw || sh !== ih) {
            log("【横屏诊断】尺寸不一致：屏幕=" + sw + "x" + sh + "，截图=" + iw + "x" + ih + "，可能有缩放");
        }
    }
    return false;
}

module.exports = {
    getScreenSize: getScreenSize,
    getImageSize: getImageSize,
    isLandscape: isLandscape,
    isPortrait: isPortrait,
    isScreenLandscape: isScreenLandscape,
    isImageRotated: isImageRotated,
    captureForLandscape: captureForLandscape,
    fixYoloCoordForLandscape: fixYoloCoordForLandscape,
    fixYoloBoundsForLandscape: fixYoloBoundsForLandscape,
    diagnoseLandscapeIssue: diagnoseLandscapeIssue
};

try {
    if (typeof global !== "undefined") global.__mfs_vision = module.exports;
    else this.__mfs_vision = module.exports;
} catch (e) {}
