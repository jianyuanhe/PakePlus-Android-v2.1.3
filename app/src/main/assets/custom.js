window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

window.open = function (url, target, features) {
    console.log('open', url, target, features)
    location.href = url
}

document.addEventListener('click', hookClick, { capture: true })


(function() {
    console.log("[Inject] Camera QR injector loaded");

    // 等页面加载完再执行
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }

    ready(function () {

        console.log("[Inject] Document ready");

        // 创建 video 预览窗口
        if (!document.getElementById("scanVideo")) {
            const video = document.createElement("video");
            video.id = "scanVideo";
            video.style.cssText = 
                width: 100%;
                height: 300px;
                background: #000;
                position: fixed;
                bottom: 10px;
                left: 0;
                z-index: 999999;
            ;
            video.setAttribute("playsinline", true);
            video.setAttribute("webkit-playsinline", true);
            document.body.appendChild(video);
        }

        // 加载 ZXing
        function loadZXing(callback) {
            if (window.ZXing) {
                callback();
                return;
            }
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@latest";
            script.onload = callback;
            document.body.appendChild(script);
        }

        // 覆盖或提供全局 scanCode()
        function hookScanner() {
            console.log("[Inject] Trying to hook scanCode...");

            // 等待你页面的 scanCode 方法出现（因为是打包后的 JS，可能晚加载）
            const timer = setInterval(() => {

                // 寻找页面中定义的 scanCode()
                let target = null;

                // 情况 1：Vue 实例在 window 上
                if (window.uniappVue && window.uniappVue.scanCode) {
                    target = window.__uniappVue;
                }

                // 情况 2：页面组件实例
                if (!target && window.uniappPages) {
                    Object.values(window.uniappPages).forEach(p => {
                        if (p.scanCode) target = p;
                    });
                }

                // 情况 3：递归查找所有对象中的 scanCode
                if (!target) {
                    for (let k in window) {
                        try {
                            if (window[k] && typeof window[k].scanCode === "function") {
                                target = window[k];
                                break;
                            }
                        } catch (e) {}
                    }
                }

                if (!target) return;

                clearInterval(timer);
                console.log("[Inject] Found scanCode():", target);

                // 备份原函数（用于微信环境）
                const oldScanCode = target.scanCode;

                // 注入新逻辑
                target.scanCode = function () {
                    console.log("[Inject] scanCode override called");

                    const isWeChat = /micromessenger/i.test(navigator.userAgent);

                    if (isWeChat) {
                        console.log("[Inject] Using WeChat scan");
                        return oldScanCode.apply(this, arguments);
                    }

                    console.log("[Inject] Using ZXing scan");

                    loadZXing(() => {
                        const codeReader = new ZXing.BrowserQRCodeReader();
                        codeReader.decodeFromVideoDevice(
                            null,
                            'scanVideo',
                            (result, err) => {
                                if (result) {
                                    console.log("[Inject] QR detected:", result.text);
                                    codeReader.reset();

                                    // 调用业务逻辑：上传扫码结果
                                  if (this.postScanCourseTeachingJournalStudent) {
                                        this.postScanCourseTeachingJournalStudent(result.text);
                                    } else {
                                        alert("扫描结果：" + result.text);
                                    }
                                }
                            }
                        );
                    });
                };

                console.log("%c[Inject] scanCode successfully hooked!", "color:green");

            }, 800);
        }

        hookScanner();
    });

})();