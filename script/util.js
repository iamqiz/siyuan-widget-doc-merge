export {
    curtime
}

// 当前本时区时间,格式2022/8/17 09:38:15 ,替换/为-
function curtime() {
    return new Date().toLocaleString().replaceAll("/","-")
}
