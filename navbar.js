//----------------------------隱藏與顯示
var prevScrollpos = window.pageYOffset;
window.onscroll = function () {
    console.log(prevScrollpos);

    var currentScrollPos = window.pageYOffset;
    if (currentScrollPos > 100) {
        if (prevScrollpos > currentScrollPos && currentScrollPos > 0) {
            document.getElementById("navbar").classList.add("scrolled-up");
            document.getElementById("navbar").classList.remove("scrolled-down");
        } else {
            document.getElementById("navbar").classList.remove("scrolled-up");
            document.getElementById("navbar").classList.add("scrolled-down");
        }
    }
    prevScrollpos = currentScrollPos;
}

//----------------------------招募變色

var obj = document.getElementById("recurit");

// 計算插值顏色
function interpolateColor(color1, color2, factor) {
    //console.debug(color1);
    if (!color1 || !color2) {
        return null;
    }
    var c1 = color1.match(/\d+/g);
    var c2 = color2.match(/\d+/g);
    var r = Math.round(parseInt(c1[0]) * (1 - factor) + parseInt(c2[0]) * factor);
    var g = Math.round(parseInt(c1[1]) * (1 - factor) + parseInt(c2[1]) * factor);
    var b = Math.round(parseInt(c1[2]) * (1 - factor) + parseInt(c2[2]) * factor);
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

// 捲動事件監聽器
window.addEventListener("scroll", function () {
    // 計算插值因子
    let a = obj.getBoundingClientRect();

    var windowHeight = window.innerHeight;

    if (a.y > -100 && a.y < windowHeight + 100) {
        //console.log(a.y / windowHeight);
        var factor = a.y / windowHeight;
        const colorStart = getComputedStyle(document.documentElement).getPropertyValue('--colorStart').trim();
        const colorEnd = getComputedStyle(document.documentElement).getPropertyValue('--colorEnd').trim();
        obj.style.backgroundColor = interpolateColor(colorStart, colorEnd, factor);

    }
});


//----------------------------navbar變色
// 獲取進度條元素

const colorStart = getComputedStyle(document.documentElement).getPropertyValue('--colorStart').trim();
const colorEnd = getComputedStyle(document.documentElement).getPropertyValue('--colorEnd').trim();


// 監聽捲軸事件
window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('navbar');
    // 獲取文檔高度和視窗高度
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    // 獲取當前滾動位置
    const scrollPosition = window.scrollY || window.pageYOffset;

    // 計算滾動位置相對於文檔底部的百分比
    const scrollPercentage = (scrollPosition + windowHeight) / docHeight;


    const red = colorStart.match(/\d+/g).map(Number); // 從 CSS 變數中提取紅色值
    const blue = colorEnd.match(/\d+/g).map(Number); // 從 CSS 變數中提取藍色值
    const interpolatedColor = red.map((c, i) => Math.round(c * (1 - scrollPercentage) + blue[i] * scrollPercentage));


    // 設置進度條背景顏色
    progressBar.style.backgroundColor = `rgb(${interpolatedColor[0]}, ${interpolatedColor[1]}, ${interpolatedColor[2]}, 0.85)`;



});

var lastModDate = new Date(document.lastModified);
document.getElementById("modDate").innerHTML = "Last update date：" + lastModDate.toDateString();


//----------------------------google
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

gtag('config', 'G-QHQ4JMPK49');