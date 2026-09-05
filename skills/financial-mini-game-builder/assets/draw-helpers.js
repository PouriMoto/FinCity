/*
  draw-helpers.js — جعبه‌ابزار رسم مشترک برای بازی‌های روایت‌محور «شهر ابزار مالی»
  ---------------------------------------------------------------------------
  تمام تصویرسازی با rough.js انجام می‌شود؛ هیچ فایل عکسی لازم نیست.
  این فایل را هیچ بازی‌ای نباید کپی/بازنویسی کند — فقط از window.FCDraw استفاده کند.
  پیش‌نیاز: <script src=".../rough.umd.min.js"> باید قبل از این فایل لود شده باشد.
*/
(function (global) {
  'use strict';

  if (typeof rough === 'undefined') {
    console.error('rough.js لود نشده — draw-helpers.js نمی‌تواند کار کند.');
    return;
  }

  var faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(n){ return String(n).replace(/[0-9]/g, function(d){ return faDigits[d]; }); }

  function rc(svg){ return rough.svg(svg); }

  /* ---------- صورتک (شخصیت‌ها) ---------- */
  // mood: 'happy' | 'neutral' | 'sad' | 'sly'
  function drawFace(svg, cx, cy, scale, color, mood, ink){
    scale = scale || 1; ink = ink || '#23273A';
    var g = rc(svg);
    svg.appendChild(g.circle(cx, cy, 70*scale, {fill:color, fillStyle:'hachure', hachureGap:4, stroke:ink, strokeWidth:2, roughness:1.9}));
    var eyeSize = mood==='sly' ? 3 : 5;
    var eyeL=[cx-20*scale, cy-8*scale], eyeR=[cx+20*scale, cy-8*scale];
    if (mood==='sly'){
      svg.appendChild(g.line(eyeL[0]-6*scale,eyeL[1],eyeL[0]+6*scale,eyeL[1],{stroke:ink,strokeWidth:2.4,roughness:1.6}));
      svg.appendChild(g.line(eyeR[0]-6*scale,eyeR[1],eyeR[0]+6*scale,eyeR[1],{stroke:ink,strokeWidth:2.4,roughness:1.6}));
    } else {
      svg.appendChild(g.circle(eyeL[0],eyeL[1],eyeSize*scale,{fill:ink,fillStyle:'solid',stroke:'none'}));
      svg.appendChild(g.circle(eyeR[0],eyeR[1],eyeSize*scale,{fill:ink,fillStyle:'solid',stroke:'none'}));
    }
    var mouth=[cx, cy+22*scale], mpath;
    if (mood==='happy'){
      mpath = 'M '+(mouth[0]-16*scale)+' '+mouth[1]+' Q '+mouth[0]+' '+(mouth[1]+14*scale)+' '+(mouth[0]+16*scale)+' '+mouth[1];
    } else if (mood==='sad'){
      mpath = 'M '+(mouth[0]-16*scale)+' '+(mouth[1]+8*scale)+' Q '+mouth[0]+' '+(mouth[1]-8*scale)+' '+(mouth[0]+16*scale)+' '+(mouth[1]+8*scale);
    } else if (mood==='sly'){
      mpath = 'M '+(mouth[0]-14*scale)+' '+mouth[1]+' Q '+(mouth[0]+4*scale)+' '+(mouth[1]+10*scale)+' '+(mouth[0]+18*scale)+' '+(mouth[1]-6*scale);
    } else {
      mpath = 'M '+(mouth[0]-14*scale)+' '+mouth[1]+' L '+(mouth[0]+14*scale)+' '+mouth[1];
    }
    svg.appendChild(g.path(mpath,{stroke:ink,strokeWidth:2.2,roughness:1.6,fill:'none'}));
  }

  /* ---------- سکه ---------- */
  function drawCoin(svg, cx, cy, r, color, ink){
    ink = ink || '#23273A';
    var g = rc(svg);
    svg.appendChild(g.circle(cx, cy, r*2, {fill:color, fillStyle:'hachure', hachureGap:2.5, stroke:ink, strokeWidth:1.8, roughness:1.7}));
    svg.appendChild(g.circle(cx, cy, r*1.1, {stroke:ink, strokeWidth:1.2, roughness:1.5, fill:'none'}));
  }

  /* ---------- دست‌دادن ---------- */
  function drawHandshake(svg, cx, cy, scale, color){
    scale = scale || 1;
    var g = rc(svg);
    svg.appendChild(g.line(cx-30*scale, cy, cx-4*scale, cy-6*scale, {stroke:color, strokeWidth:5*scale, roughness:1.7}));
    svg.appendChild(g.line(cx+30*scale, cy, cx+4*scale, cy-6*scale, {stroke:color, strokeWidth:5*scale, roughness:1.7}));
    svg.appendChild(g.ellipse(cx, cy-6*scale, 14*scale, 9*scale, {fill:color, fillStyle:'solid', stroke:'#23273A', strokeWidth:1.4, roughness:1.5}));
  }

  /* ---------- آینه (برای شخصیتِ «تکرارگر») ---------- */
  function drawMirror(svg, cx, cy, scale, color){
    scale = scale || 1;
    var g = rc(svg);
    svg.appendChild(g.rectangle(cx-18*scale, cy-24*scale, 36*scale, 48*scale, {fill:color, fillStyle:'hachure', hachureGap:3, stroke:'#23273A', strokeWidth:1.8, roughness:1.8}));
    svg.appendChild(g.line(cx, cy-24*scale, cx, cy+24*scale, {stroke:'#23273A', strokeWidth:1.2, roughness:1.4}));
  }

  /* ---------- ذره‌بین / چشم‌بند (برای سوگیری‌های شناختی) ---------- */
  function drawMagnifier(svg, cx, cy, scale, color){
    scale = scale || 1;
    var g = rc(svg);
    svg.appendChild(g.circle(cx-10*scale, cy-10*scale, 46*scale, {stroke:color, strokeWidth:3.5, roughness:1.6, fill:'none'}));
    svg.appendChild(g.line(cx+16*scale, cy+16*scale, cx+40*scale, cy+40*scale, {stroke:color, strokeWidth:5*scale, roughness:1.6}));
  }
  function drawEyePatch(svg, cx, cy, scale, color){
    scale = scale || 1;
    var g = rc(svg);
    svg.appendChild(g.ellipse(cx, cy, 40*scale, 26*scale, {fill:color, fillStyle:'cross-hatch', hachureGap:3, stroke:'#23273A', strokeWidth:1.8, roughness:1.7}));
  }

  /* ---------- فلش خمیده (برای نمودار چرخه‌ای) ---------- */
  function arrowHead(g, svg, x,y,angle,size,color){
    size = size || 8;
    var a1=angle+Math.PI*0.78, a2=angle-Math.PI*0.78;
    svg.appendChild(g.line(x,y,x+size*Math.cos(a1),y+size*Math.sin(a1),{stroke:color,strokeWidth:2,roughness:1.6}));
    svg.appendChild(g.line(x,y,x+size*Math.cos(a2),y+size*Math.sin(a2),{stroke:color,strokeWidth:2,roughness:1.6}));
  }
  function curvedArrow(svg, x1,y1, x2,y2, color, opts){
    opts = opts || {};
    var g = rc(svg);
    var mx=(x1+x2)/2+(opts.bend||0), my=(y1+y2)/2+(opts.bendY||0);
    svg.appendChild(g.path('M '+x1+' '+y1+' Q '+mx+' '+my+' '+x2+' '+y2, {stroke:color, strokeWidth:2.2, roughness:1.4, bowing:1}));
    arrowHead(g, svg, x2, y2, Math.atan2(y2-my, x2-mx), 9, color);
  }

  /* ---------- کمکی: نمودار چرخه‌ای کلیک‌پذیر با گره‌های دایره‌ای ---------- */
  // positions: آرایه‌ی {top, left} به‌صورت درصد؛ اگر ندهید، خودکار روی یک دایره می‌چیند
  function layoutCycleNodes(nodeEls, positions){
    var defaultPos = [
      {top:'4%',left:'50%'},{top:'22%',left:'88%'},{top:'62%',left:'94%'},
      {top:'92%',left:'62%'},{top:'80%',left:'18%'},{top:'34%',left:'8%'}
    ];
    var pos = positions || defaultPos;
    nodeEls.forEach(function(el, i){
      var p = pos[i % pos.length];
      el.style.top = p.top; el.style.left = p.left;
    });
  }
  function drawCycleArrows(svg, count, color){
    svg.innerHTML = '';
    var pts = [{x:50,y:8},{x:86,y:26},{x:92,y:66},{x:60,y:92},{x:22,y:80},{x:10,y:36}];
    for (var i=0;i<count;i++){
      var a=pts[i % pts.length], b=pts[(i+1) % count];
      curvedArrow(svg, a.x, a.y, b.x, b.y, color, {});
    }
  }

  global.FCDraw = {
    toFa: toFa,
    rc: rc,
    drawFace: drawFace,
    drawCoin: drawCoin,
    drawHandshake: drawHandshake,
    drawMirror: drawMirror,
    drawMagnifier: drawMagnifier,
    drawEyePatch: drawEyePatch,
    curvedArrow: curvedArrow,
    layoutCycleNodes: layoutCycleNodes,
    drawCycleArrows: drawCycleArrows
  };
})(window);
