---
name: ec-android-cli
description: >-
  中文说明：EasyClick ec-android-cli 的安装前提、子命令、参数与示例。
  在用户或 Agent 需要执行、脚本化或排查该 CLI 时使用；不包含实现细节。
---

# ec-android-cli 使用说明

## 使用前提

- 本机已启动 **IntelliJ IDEA**，并已加载 **EasyClick 开发工具**插件；插件需处于可响应命令的状态。
- 命令行中的 **模块名** 与 IDEA 里该脚本工程对应的 **模块名** 一致。
- 多窗口、多工程时，建议用 **`-p`** 传入与 IDEA 中打开路径一致的 **工程根目录**，便于匹配到正确实例。

## 程序名与帮助

- **本仓库自带可执行文件**（相对仓库根目录）：**`ec_work_config/android/bin/ec-android-cli`**
    - 在仓库根下：`./ec_work_config/android/bin/ec-android-cli -h`
    - Agent / 脚本优先使用该路径，避免依赖全局 PATH。
    - 并且输出的日志格式设置为json格式
- 若本机已单独安装并加入 PATH，也可直接执行 **`ec-android-cli`**（与上述为同一程序；本地若改名，请将命令中的名称一并替换）。
- 查看总帮助：`./ec_work_config/android/bin/ec-android-cli -h`（或在 PATH 已配置时：`ec-android-cli -h`）
- 查看子命令帮助：`./ec_work_config/android/bin/ec-android-cli <子命令> -h`

## 子命令一览

| 子命令               | 作用                         |
|-------------------|----------------------------|
| `preview`         | 预览工程                       |
| `run`             | 运行工程                       |
| `stop`            | 停止当前运行                     |
| `build`           | 构建 IEC                     |
| `capture-screen`  | 截图（从 IDEA 已连接设备抓取截图并返回路径）  |
| `capture-node`    | 抓取 UI 节点（UIX，本质为 XML）并返回路径 |
| `ocr-local-image` | OCR 识别本地图像并输出识别结果          |
| `ocr-screen`      | OCR 识别当前屏幕并输出识别结果          |
| `test-image`      | 图片模板匹配测试（本图/抓屏）并输出测试结果     |
| `monitor`         | 仅持续输出日志流（不要求 `-m`）         |

**说明：** 除 `monitor` 外，其余子命令均需 **`-m`（模块名）**；`monitor` 不需要模块名。

## 通用参数（除 `monitor` 外的大多数子命令）

| 参数                          | 含义                                                                                                                                                                                   |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **`-m` / `--module`**       | **必填**。IDEA 模块名。                                                                                                                                                                     |
| **`-p` / `--project`**      | 可选。工程根目录路径（与 IDEA 中打开路径一致）。                                                                                                                                                          |
| **`-f` / `--format`**       | 可选。日志行格式：`text` 或 `json`；**省略时默认为 `json`**。                                                                                                                                          |
| **`-o` / `--log`**          | 可选。将日志**追加**写入指定文件路径。                                                                                                                                                                |
| **`-k` / `--stop-on`**      | 可选。日志中**包含**该子串时，打印提示并**退出**（结束本次日志监控）。多个条件为**或**关系时，可用 **`                                                                                                                          |||`** 连接多个子串（任一子串命中即退出）。 |
| **`-w` / `--monitor-logs`** | 可选。`true` / `false`。**`preview` / `run` / `stop`**：未写 `-w` 时视为 **`true`**（持续跟日志至 **Ctrl+C** 或命中 `-k`）。**`build`**：未写 `-w` 时为 **`false`**（操作结束后即结束日志）。显式写 `-w true` / `-w false` 可覆盖。 |
| **`-r` / `--random-log`**   | 可选。`true` / `false`。为 `true` 时在 **`ai_logs/`** 下自动生成日志文件名；**不可与 `-o` 同时使用**。                                                                                                         |

**约束：** 凡写出的可选参数须带**有效取值**；**`-r` 与 `-o` 不能同时使用**。

**`-k` 多关键字（通用）：** 所有支持 **`-k`** 的子命令——**`preview` / `run` / `stop` / `build` / `monitor`**——均可用 *
*`|||`** 连接多个子串，表示**或**：日志中**任一**子串出现即结束本次监控。

**`preview` 专用：** 未写 **`-k` / `--stop-on`** 时，默认停止关键字为 **`执行UI结束`**；未写 **`-w`** 时默认**持续监控日志
**（等同 `-w true`）。

**`run` 专用：** 未写 **`-k`** 时，默认停止关键字为 **`脚本已运行结束`**；未写 **`-w`** 时默认**持续监控日志**（等同
`-w true`）。

**`stop` 专用：** 未写 **`-k`** 时，默认在日志中出现 **`停止失败`**、**`停止运行成功`** 或 **`无设备连接`** 时结束监控（**任一
**命中即可）；未写 **`-w`** 时默认**持续监控日志**（等同 `-w true`）。若显式传入 **`-k`**，则以你设置的关键字为准（仍可用 *
*`|||`** 表示多关键字“或”）。

**`build`（编译 IEC）专用：** 未写 **`-k`** 时，默认在日志中出现 **`release.iec`**、**`编译IEC成功`** 或 **`编译失败`**
时结束本次日志监控（**任一**命中即可）。

## `monitor` 专用参数

仅日志流；不使用 `-m`、`-p`、`-w`。

| 参数                        | 含义                             |
|---------------------------|--------------------------------|
| **`-f` / `--format`**     | 同上文，`text` 或 `json`，默认 `json`。 |
| **`-o` / `--log`**        | 同上文。                           |
| **`-k` / `--stop-on`**    | 同上文。                           |
| **`-r` / `--random-log`** | 同上文（勿与 `-o` 同用）。               |

## 日志输出习惯

- 常规日志多输出到 **标准错误（stderr）**；使用 **`-o`** 或 **`-r`** 时还会写入文件。
- 默认日志行格式为 **JSON**，除非指定 **`-f text`**。

## 示例

# 以下假定当前目录为仓库根；`EC` 即 ./ec_work_config/android/bin/ec-android-cli
EC=./ec_work_config/android/bin/ec-android-cli
$EC preview -m app
$EC preview -m app -f json
$EC run -m app -f json -o /tmp/easyclick.log
$EC run -m app -r true
$EC run -m app -w false
$EC stop -m app
$EC build -m app
$EC capture-screen -m app
$EC capture-node -m app -d /tmp/nodes
$EC ocr-local-image -m app -i /tmp/a.png
$EC ocr-screen -m app
$EC test-image -m app -s /tmp/s.png
$EC monitor
$EC monitor -f text -o /tmp/monitor.log -k "完成"

多工程时示例：

./ec_work_config/android/bin/ec-android-cli run -m app -p /path/to/project/root

## `capture-screen`（截图）

- **用途**：调用截图，成功后会输出路径。
- **常用短参数**：
    - `-n`：`--only-network`
    - `-d`：`--dir`

EC=./ec_work_config/android/bin/ec-android-cli
$EC capture-screen -m app
$EC capture-screen -m app -n -d /tmp/shots

## `capture-node`（抓取节点 UIX）

- **用途**：调用抓节点功功能，成功后在 输出 uix文件路径。
- **常用短参数**：
    - `-d`：`--dir`

EC=./ec_work_config/android/bin/ec-android-cli
$EC capture-node -m app
$EC capture-node -m app -d /tmp/nodes

## `ocr-local-image`（OCR 本地图像）

- **用途**：调用 成功后输出 OCR 结果字符串。
- **必填**：`-i/--path` 本地图像路径
- **可选**：
    - `-t/--ocr-type`：`paddleOcrNcnnV5|paddleOcrOnnxV4|paddleOcrOnnxV5|ocrLite`（默认 `paddleOcrNcnnV5`）
    - `-P/--padding`：默认 `32`
    - `-X/--max-side-len`：默认 `640`
    - `-R/--release`：默认 `false`

EC=./ec_work_config/android/bin/ec-android-cli
$EC ocr-local-image -m app -i /path/to/image.png
$EC ocr-local-image -m app -i a.jpg -t paddleOcrOnnxV5 -P 48 -X 960 -R

## `ocr-screen`（OCR 屏幕）

- **用途**：调用成功后在OCR 结果字符串。
- **可选**（同 `ocr-local-image`，但不需要 `--path`）：
    - `-t/--ocr-type`（默认 `paddleOcrNcnnV5`）
    - `-P/--padding`（默认 `32`）
    - `-X/--max-side-len`（默认 `640`）
    - `-R/--release`（默认 `false`）

EC=./ec_work_config/android/bin/ec-android-cli
$EC ocr-screen -m app
$EC ocr-screen -m app -t paddleOcrOnnxV5 -P 48 -X 960 -R

## `test-image`（图片测试）

- **用途**：调用成功后在 测试结果字符串。
- **必填**：`-s/--small-image-path` 小图路径
- **可选**（均为字符串格式）：
    - `-T/--test-type`：`1` 本图测试；`2` 抓屏测试（默认 `2`）。`test-type=2` 时无需 `--big-image-path`
    - `-B/--big-image-path`：大图路径（仅 `test-type=1` 时需要）
    - `-F/--func`：`findImageByColor|findImage|matchTemplate`（默认 `findImage`）
    - `-M/--method`：模板匹配方式（默认 `5`）
    - `-g/--range`：默认 `0,0,0,0`
    - `-l/--limit`：默认 `1`
    - `-L/--max-level`：默认 `-1`
    - `-E/--weak-threshold`：默认 `0.7`
    - `-H/--threshold`：默认 `0.8`
    - `-C/--opencv-mat`：`1` 否；`2` 是（默认 `1`）

EC=./ec_work_config/android/bin/ec-android-cli
$EC test-image -m app -s /tmp/s.png
$EC test-image -m app -T 1 -s s.png -B b.png -F matchTemplate -M 5
$EC test-image -m app -F findImage -g 0,0,0,0 -l 1 -E 0.7 -H 0.8