!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports["video/danmaku/airborne"]=t():e["video/danmaku/airborne"]=t()}(globalThis,(()=>(()=>{var e,t,n={398:(e,t,n)=>{var o=n(355)((function(e){return e[1]}));o.push([e.id,".bili-dm.airborne,\n.b-danmaku.airborne {\n  text-decoration: underline;\n  cursor: pointer;\n  pointer-events: initial;\n}",""]),e.exports=o},355:e=>{"use strict";
// eslint-disable-next-line func-names
e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var n=e(t);return t[2]?"@media ".concat(t[2]," {").concat(n,"}"):n})).join("")},
// eslint-disable-next-line func-names
t.i=function(e,n,o){"string"==typeof e&&(
// eslint-disable-next-line no-param-reassign
e=[[null,e,""]]);var r={};if(o)for(var i=0;i<this.length;i++){
// eslint-disable-next-line prefer-destructuring
var a=this[i][0];null!=a&&(r[a]=!0)}for(var s=0;s<e.length;s++){var c=[].concat(e[s]);o&&r[c[0]]||(n&&(c[2]?c[2]="".concat(n," and ").concat(c[2]):c[2]=n),t.push(c))}},t}},59:(e,t,n)=>{var o=n(398);o&&o.__esModule&&(o=o.default),e.exports="string"==typeof o?o:o.toString()}},o={};function r(e){var t=o[e];if(void 0!==t)return t.exports;var i=o[e]={id:e,exports:{}};return n[e](i,i.exports,r),i.exports}t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.__proto__,r.t=function(n,o){if(1&o&&(n=this(n)),8&o)return n;if("object"==typeof n&&n){if(4&o&&n.__esModule)return n;if(16&o&&"function"==typeof n.then)return n}var i=Object.create(null);r.r(i);var a={};e=e||[null,t({}),t([]),t(t)];for(var s=2&o&&n;"object"==typeof s&&!~e.indexOf(s);s=t(s))Object.getOwnPropertyNames(s).forEach((e=>a[e]=()=>n[e]));return a.default=()=>n,r.d(i,a),i},r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var i={};return(()=>{"use strict";r.d(i,{component:()=>c});const e=coreApis.componentApis.styledComponent,t=coreApis.componentApis.define,n=coreApis.componentApis.video.playerAgent,o=coreApis.componentApis.video.videoDanmaku,a=coreApis.observer,s=coreApis.utils.urls,c=(0,t.defineComponentMetadata)({displayName:"启用弹幕空降",author:{name:"kdxcxs",link:"https://github.com/kdxcxs"},description:{"zh-CN":"为可能含有时间点的弹幕添加下划线, 点击可以跳到视频对应时间."},tags:[componentsTags.video],urlInclude:s.playerUrls,...(0,e.toggleStyle)("danmakuAirborne",(()=>Promise.resolve().then(r.t.bind(r,59,23))),(async e=>{let{settings:t}=e;const{enabled:r}=t,i=e=>{if(!e)return NaN;const t=e.match(/(\d+)[ ]*[:：时分][ ]*(\d+)([ ]*[:：分][ ]*(\d+))?/);if(!t)return NaN;if(t[3]){const[,n,o,,r]=t.map((e=>parseInt(e)));return[n,o,r].some((e=>Number.isNaN(e)))||e.includes("分")&&!e.includes("时")?NaN:3600*n+60*o+r}const[,n,o]=t.map((e=>parseInt(e)));return[n,o].some((e=>Number.isNaN(e)))?NaN:60*n+o},s=e=>{if(!r)return;const t=e.target;if(!["b-danmaku","bili-dm"].some((e=>t.classList.contains(e))))return;const n=i(t.textContent);Number.isNaN(n)||unsafeWindow.player.seek(n,!1)};(0,o.forEachVideoDanmaku)({added:e=>{const t=!Number.isNaN(i(e.text));e.element.classList.toggle("airborne",t)}}),(0,a.videoChange)((async()=>{const e=await n.playerAgent.query.video.wrap();e.classList.contains("airborne-enabled")||(e.classList.add("airborne-enabled"),e.addEventListener("click",s))}))})),commitHash:"d5cae8ee7ab8bd6c18e026bc349b1eb90413e730",coreVersion:"2.6.3"})})(),i=i.component})()));