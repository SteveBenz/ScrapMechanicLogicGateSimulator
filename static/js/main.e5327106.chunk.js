(this.webpackJsonplogicgate=this.webpackJsonplogicgate||[]).push([[0],{103:function(t,e,n){"use strict";n.r(e);n(49);var i=n(0),o=n(11),a=n(16),r=n(7),s=n(1),u=n.n(s),c=n(46),l=n(2),d=n(26);function f(t){var e=s.useState(0),n=Object(r.a)(e,2),o=n[0],a=n[1],u=s.useState(20),c=Object(r.a)(u,2),d=c[0],f=c[1],h=s.useRef(null);return s.useEffect((function(){function e(){a(t.simulator.currentTick),null!==h.current&&(h.current.text(t.simulator.currentTick.toString()),f(h.current.width()))}return t.simulator.onTick(e),e(),function(){t.simulator.offTick(e)}}),[t.simulator]),Object(i.jsx)(l.Text,{y:t.top,x:t.right-d,ref:h,fill:"red",text:o.toString(),fontSize:30})}var h=n(33),v=n.n(h),b=n(9),m={};function p(t){var e=Object(s.useState)([t.model.x,t.model.y]),n=Object(r.a)(e,2),o=Object(r.a)(n[0],2),a=o[0],c=o[1],d=n[1],f=Object(s.useState)(t.model.currentState),h=Object(r.a)(f,2),v=h[0],m=h[1],p=u.a.useRef(null);Object(s.useEffect)((function(){function e(){d([t.model.x,t.model.y])}return t.model.onMoved(e),function(){return t.model.offMoved(e)}}),[t.model]),Object(s.useEffect)((function(){function e(){m(t.model.currentState)}return t.model.onStateChanged(e),function(){return t.model.offStateChanged(e)}}),[t.model]);var j=[];return j.push(Object(i.jsx)(l.Rect,{height:64,width:64,strokeWidth:3,stroke:t.isSelected?"green":"blue",fill:v?"white":"grey"},"surround")),t.model instanceof b.c&&j.push(Object(i.jsx)(k,{model:t.model},"savedStateIndicator")),t.model instanceof b.d?j.push(Object(i.jsx)(y,{model:t.model},"logicGate")):t.model instanceof b.a?j.push(Object(i.jsx)(g,{},"input")):t.model instanceof b.e&&j.push(Object(i.jsx)(x,{model:t.model},"input")),Object(i.jsx)(l.Group,{onClick:function(e){t.onClick&&t.onClick({evt:e.evt,model:t.model})},onMouseUp:function(e){t.onMouseUp&&t.onMouseUp({evt:e.evt,model:t.model})},ref:p,draggable:!0,x:a,y:c,onDragStart:function(e){if(!e.evt.shiftKey){if(!p.current)throw new Error("group did not get set in render");p.current.stopDrag(),t.onLinkStart&&t.onLinkStart({evt:e.evt,model:t.model})}},onDragMove:function(e){var n=e.target.absolutePosition();t.model.setPosition(n.x,n.y)},onDragEnd:function(e){t.onMoveCompleted&&t.onMoveCompleted({evt:e.evt,model:t.model})},children:j})}function k(t){var e=Object(s.useState)(t.model.savedState),n=Object(r.a)(e,2),o=n[0],a=n[1];Object(s.useEffect)((function(){function e(){a(t.model.savedState)}return t.model.onStateChanged(e),function(){return t.model.offStateChanged(e)}}),[t.model]);return Object(i.jsx)(l.Line,{points:[47,0,63,0,63,16],fill:o?"blue":"transparent",stroke:"blue",strokeWidth:3,closed:!0},"saveStateIndicator")}function y(t){var e=Object(s.useState)(t.model.kind),n=Object(r.a)(e,2),o=n[0],a=n[1];return Object(s.useEffect)((function(){function e(){a(t.model.kind)}return t.model.onStateChanged(e),function(){return t.model.offStateChanged(e)}}),[t.model]),Object(i.jsx)(l.Image,{x:0,y:0,image:m[o].image()})}function g(){return Object(i.jsx)(l.Circle,{radius:22,x:32,y:32,strokeWidth:8,stroke:"black"},"image")}function x(t){var e=Object(s.useState)(t.model.tickStorage),n=Object(r.a)(e,2),o=n[0],u=n[1];Object(s.useEffect)((function(){function e(){u(Object(a.a)(t.model.tickStorage))}return t.model.onStateChanged(e),function(){return t.model.offStateChanged(e)}}),[t.model]);var c=52/o.length;return Object(i.jsx)(l.Group,{children:o.map((function(t,e){return Object(i.jsx)(l.Rect,{x:12,width:40,y:58-c-52*e/o.length,height:c,strokeWidth:1,stroke:"darkgrey",fill:t?"blue":"white"},e.toString())}))})}function j(t,e,n,i){if(Math.abs(i-e)<Math.abs(n-t)){var o=n>t?1:-1,a=32*(i-e)/(n-t);t+=32*o,n-=32*o,e+=o*a,i-=o*a}else{var r=i>e?1:-1,s=32*(n-t)/(i-e);t+=r*s,n-=r*s,e+=32*r,i-=32*r}return[t,e,n,i]}function O(t){var e=u.a.useState(t.source.prevState),n=Object(r.a)(e,2),o=n[0],a=n[1],c=u.a.useState(j(t.source.x+32,t.source.y+32,t.target.x+32,t.target.y+32)),d=Object(r.a)(c,2),f=Object(r.a)(d[0],4),h=f[0],v=f[1],b=f[2],m=f[3],p=d[1];return Object(s.useEffect)((function(){function e(){a(t.source.prevState)}function n(){p(j(t.source.x+32,t.source.y+32,t.target.x+32,t.target.y+32))}return t.source.onStateChanged(e),t.source.onMoved(n),t.target.onMoved(n),function(){t.source.offStateChanged(e),t.source.offMoved(n),t.target.offMoved(n)}}),[t.source,t.target]),Object(i.jsx)(l.Arrow,{x:h,y:v,points:[0,0,b-h,m-v],fill:o?"darkblue":"teal",stroke:o?"darkblue":"teal",strokeWidth:4,pointerLength:10,pointerWidth:10})}var S,w=n(35),_=n.n(w),R=n(47),T=n(13),C=n(14),I=n(48),E=n.n(I);function L(t){var e=document.getElementById("error");if(null===e)throw new Error("missing error element");e.innerText=t,e.classList.add("visible"),S&&clearTimeout(S),S=setTimeout((function(){e.classList.remove("visible"),S=void 0}),4e3)}var M=1.05,Y=function(){function t(e,n,i){var o=this;Object(T.a)(this,t),this.toolTipId=e,this.x=n,this.y=i,this.timeoutHandle=void 0,this._handleTimeout=function(){if(o.timeoutHandle=void 0,o.toolTipId){var t=document.getElementById(o.toolTipId);if(!t)throw new Error("toolTipId is defined, but not in the document");t.style.visibility="visible",t.style.top=o.y-t.clientHeight-5+"px";var e=o.x+32-t.clientWidth/2;e<0&&(e=10),t.style.top=o.y-t.clientHeight-5+"px",t.style.left=e+"px"}}}return Object(C.a)(t,[{key:"startTimer",value:function(){!this.timeoutHandle&&document.getElementById(this.toolTipId)&&(this.timeoutHandle=setTimeout(this._handleTimeout,1e3))}},{key:"clearTimer",value:function(){this.timeoutHandle&&(clearTimeout(this.timeoutHandle),this.timeoutHandle=void 0);var t=document.getElementById(this.toolTipId);if(!t)throw new Error("toolTipId is defined, but not in the document");t.style.visibility="hidden"}}]),t}();function W(t){var e=s.useState(!1),n=Object(r.a)(e,2),o=n[0],a=n[1],u=s.useState(!1),c=Object(r.a)(u,2),d=c[0],f=c[1],h=s.useState(new Y(t.toolTipId,t.x,t.y)),v=Object(r.a)(h,1)[0];return s.useEffect((function(){return function(){return v.clearTimer()}}),[v]),Object(i.jsxs)(l.Group,{x:t.x-(o?1.6000000000000014:0),y:t.y-(o?1.6000000000000014:0),onMouseEnter:function(){f(!0),v.startTimer()},onMouseLeave:function(e){t.onDragStart&&o&&e.evt.offsetY<t.y+32&&t.onDragStart(e),f(!1),a(!1),v.clearTimer()},onMouseDown:function(){a(!0),v.clearTimer()},onMouseUp:function(e){a(!1),t.onClicked&&t.onClicked(e),v.startTimer()},scaleX:o?M:1,scaleY:o?M:1,children:[t.children,Object(i.jsx)(l.Rect,{x:0,y:0,height:64,width:64,strokeWidth:2,stroke:d?"black":"grey",fill:t.isEnabled?"transparent":"#80808080"})]})}function X(t){var e=s.useState(t.isRunning),n=Object(r.a)(e,2),i=n[0],o=n[1];return s.useEffect((function(){function e(){o(t.isRunning)}return t.onRunStateChanged(e),function(){return t.offRunStateChanged(e)}}),[t]),i}function D(t){var e=X(t.model)?[Object(i.jsx)(l.Line,{points:[27,20,27,44],lineCap:"butt",strokeWidth:5,stroke:"red"},"1"),Object(i.jsx)(l.Line,{points:[37,20,37,44],lineCap:"butt",strokeWidth:5,stroke:"red"},"2")]:Object(i.jsx)(l.Line,{points:[16,16,44,32,16,48],strokeWidth:4,stroke:"green",fill:"green",closed:!0},"3");return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"playPauseTip",isEnabled:!0,onClicked:function(){t.model.isRunning?t.model.stopRunning():t.model.startRunning()},children:e})}function A(t){var e=X(t.model);return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"singleStepTip",isEnabled:!0,onClicked:function(){t.model.advanceOne()},children:Object(i.jsx)(l.Line,{points:[44,32,16,48,16,16,44,32,44,16,44,48],strokeWidth:4,stroke:e?"#305030ff":"#008000ff",closed:!1})})}function H(t){var e,n="input"===t.kind?"inputTip":"timer"===t.kind?"timerTip":"logicGateTip";switch(t.kind){case"input":e=Object(i.jsx)(l.Circle,{radius:22,x:32,y:32,strokeWidth:8,stroke:"black"});break;case"timer":var o=[!0,!0,!0,!0,!0,!1,!1,!1,!1,!1],a=52/o.length;e=o.map((function(t,e){return Object(i.jsx)(l.Rect,{x:12,width:40,y:58-a-52*e/o.length,height:a,strokeWidth:1,stroke:"darkgrey",fill:t?"blue":"white"},e)}));break;default:e=Object(i.jsx)(l.Image,{x:0,y:0,image:m[t.kind].image()})}return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:n,isEnabled:!0,onClicked:function(){t.selected?"input"===t.kind&&t.selected instanceof b.a?t.selected.twiddle(1):"timer"===t.kind&&t.selected instanceof b.e?L("Timers can't be changed like this."):"timer"!==t.kind&&"input"!==t.kind&&t.selected instanceof b.d?t.selected.kind=t.kind:L("Can't convert between inputs, timers and gates.  (You have to delete and recreate them)."):L("No logic gate is selected (click on one in the field).")},onDragStart:function(e){var n;switch(t.kind){case"timer":n=new b.e({x:e.evt.offsetX,y:e.evt.offsetY,kind:t.kind,tickStorage:new Array(10).fill(!1)});break;case"input":n=new b.a({x:e.evt.offsetX,y:e.evt.offsetY,savedState:!1,kind:t.kind});break;default:n=new b.d({x:e.evt.offsetX,y:e.evt.offsetY,savedState:!1,kind:t.kind})}t.onBeginDrag({prototype:n,event:e})},children:e})}function B(t){return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"paintTip",isEnabled:!0,onClicked:function(){t.selected instanceof b.c?t.selected.paint():L("Timers always save their current state on reload, so painting them has no effect on its behavior")},children:Object(i.jsx)(l.Image,{x:0,y:0,image:m.paint.image()})})}function P(t){return Object(i.jsxs)(W,{x:t.x,y:t.y,toolTipId:"putOnLiftTip",isEnabled:!0,onClicked:function(){return t.simulator.putOnLift()},children:[Object(i.jsx)(l.Line,{points:[52,48,12,48,12,28,32,28,32,12,16,12,48,12,32,12,32,28,52,28,52,48],strokeWidth:4,stroke:"black",closed:!0},"base"),Object(i.jsx)(l.Line,{points:[18,42,32,32,46,42,18,42],strokeWidth:1,stroke:"blue",closed:!0,fill:"blue"},"arrow")]})}function z(t){return Object(i.jsxs)(W,{x:t.x,y:t.y,toolTipId:"takeOffLiftTip",isEnabled:!0,onClicked:function(){return t.simulator.takeOffLift()},children:[Object(i.jsx)(l.Line,{points:[52,48,12,48,12,28,32,28,32,12,16,12,48,12,32,12,32,28,52,28,52,48],strokeWidth:4,stroke:"black",closed:!0},"base"),Object(i.jsx)(l.Line,{points:[18,32,32,42,46,32,18,32],strokeWidth:1,stroke:"blue",closed:!0,fill:"blue"},"arrow")]})}function F(t){return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"deleteTip",isEnabled:void 0!==t.selected,onClicked:function(){t.selected?t.simulator.remove(t.selected):L("Nothing is selected (click on a logic gate in the field to specify what should be deleted).")},children:Object(i.jsx)(l.Text,{text:"\ud83d\uddd1",x:10,y:8,fontSize:64,fill:"black"})})}function U(t){function e(){return(e=Object(R.a)(_.a.mark((function e(){var n;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(navigator.clipboard){e.next=3;break}return alert("Can't copy to clipboard - navigator.clipboard doesn't exist.  Perhaps you're using an older browser?"),e.abrupt("return");case 3:return n=window.location.origin+window.location.pathname+"?"+t.simulator.serializeToCompressedQueryStringFragment(),e.prev=4,e.next=7,navigator.clipboard.writeText(n);case 7:alert("Copied the following URL to the clipboard:\n\n"+n),e.next=13;break;case 10:e.prev=10,e.t0=e.catch(4),alert("navigator.clipboard.writeText failed!\n\n"+e.t0);case 13:case"end":return e.stop()}}),e,null,[[4,10]])})))).apply(this,arguments)}return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"shareLinkTip",isEnabled:!0,onClicked:function(){return e.apply(this,arguments)},children:Object(i.jsx)(l.Text,{text:"\ud83d\udd17",x:6,y:14,fontSize:42,fill:"black"})})}function G(t){return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"saveTip",isEnabled:!0,onClicked:function(){var e=new File([JSON.stringify(t.simulator.serialize(),null,4)],"logicgatesim.json",{type:"text/plain;charset=utf-8"});E.a.saveAs(e)},children:Object(i.jsx)(l.Text,{text:"\ud83d\udcbe",x:6,y:14,fontSize:42,fill:"black"})})}function J(t){var e=document.getElementById("fileElem");if(!e)throw new Error("index.html is busted - fileElem <input> is missing");return s.useEffect((function(){function n(){if(e.files&&0!==e.files.length){var n=new FileReader;n.onload=function(){var e,i=n.result;try{e=JSON.parse(i)}catch(o){return void alert("Failed to load the file - are you sure this is a file generated from this app?  "+o)}try{t.simulator.load(e)}catch(o){alert(o)}},n.readAsText(e.files[0])}}return e.addEventListener("change",n,!1),function(){return e.removeEventListener("change",n)}}),[t.simulator,e]),Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"loadTip",isEnabled:!0,onClicked:function(){e.click()},children:Object(i.jsx)(l.Text,{text:"\ud83d\udcc1",x:6,y:14,fontSize:42,fill:"black"})})}function N(t){return Object(i.jsx)(W,{x:t.x,y:t.y,toolTipId:"reloadTip",isEnabled:!0,onClicked:function(){return t.simulator.gameReload()},children:Object(i.jsx)(l.Text,{text:"\u21c5",x:16,y:14,fontSize:42,fill:"black"})})}function Q(){var t=.9*window.innerHeight,e=window.innerWidth-57,n=e<1437?2:1,i=72*n+8,o=function(e){return t-i+8+(e>=9&&n>1?72:0)};return{canvasWidth:e,canvasHeight:t,buttonRowHeight:i,maxSensibleDropX:e-16,maxSensibleDropY:o(0)-32,buttonRowX:function(t){return 15+79*(t>=9&&n>1?t-9:t)},buttonRowY:o}}function K(t){var e=s.useState(t.simulator.interactables),n=Object(r.a)(e,2),u=n[0],c=n[1],d=s.useState(t.simulator.getLinks()),h=Object(r.a)(d,2),v=h[0],m=h[1],k=s.useState(void 0),y=Object(r.a)(k,2),g=y[0],x=y[1],j=s.useState(void 0),S=Object(r.a)(j,2),w=S[0],_=S[1],R=s.useState([void 0,void 0]),T=Object(r.a)(R,2),C=Object(r.a)(T[0],2),I=C[0],E=C[1],L=T[1],M=s.useState(void 0),Y=Object(r.a)(M,2),W=Y[0],X=Y[1],K=s.useState(Q()),q=Object(r.a)(K,2),$=q[0],V=q[1],Z=s.useState(!1),tt=Object(r.a)(Z,2),et=tt[0],nt=tt[1],it=s.useRef(null);function ot(t){x(t.model)}function at(t){_(t.model),L([t.evt.x,t.evt.y])}function rt(t){X(t.prototype)}function st(e){(e.model.x<-48||e.model.y<-48||e.model.x>$.maxSensibleDropX||e.model.y>$.maxSensibleDropY)&&t.simulator.remove(e.model)}s.useEffect((function(){function e(){g&&t.simulator.interactables.indexOf(g)<0&&x(void 0),c(Object(a.a)(t.simulator.interactables)),m(t.simulator.getLinks()),_(void 0),X(void 0)}function n(){e(),nt(!0)}return t.simulator.onInteractableAdded(e),t.simulator.onInteractableRemoved(e),t.simulator.onInteractablesReset(n),function(){t.simulator.offInteractableAdded(e),t.simulator.offInteractableRemoved(e),t.simulator.offInteractablesReset(n)}}),[t.simulator,g]),s.useEffect((function(){function t(){V(Q()),nt(!0)}return window.addEventListener("resize",t),function(){return window.removeEventListener("resize",t)}}),[]),s.useEffect((function(){function e(e){var n,i=null===(n=it.current)||void 0===n?void 0:n.getPointerPosition();if(!i)throw new Error("stage was not set?");if("g"===e.key)t.simulator.startRunning();else if("s"===e.key)t.simulator.stopRunning();else if("n"===e.key)t.simulator.advanceOne();else if("l"===e.key){var o=new b.d({kind:"and",x:i.x,y:i.y,savedState:!1});t.simulator.add(o)}else if("i"===e.key){var a=new b.a({kind:"input",x:i.x,y:i.y,savedState:!1});t.simulator.add(a)}else if("t"===e.key){var r=new b.e({kind:"timer",x:i.x,y:i.y,tickStorage:new Array(10).fill(!1)});t.simulator.add(r)}else"["===e.key&&g?g.twiddle(-1):"]"!==e.key&&" "!==e.key||!g?"x"===e.key&&g?t.simulator.remove(g):"4"===e.key?t.simulator.gameReload():"$"===e.key?t.simulator.putOnLift():"p"===e.key&&g&&g.paint():(g.twiddle(1),e.preventDefault());console.debug("App.handleKeyPress("+e.key+")")}if(it.current){var n=it.current.container();n.tabIndex=1,n.focus()}return window.addEventListener("keypress",e),function(){return window.removeEventListener("keypress",e)}}),[t.simulator,g]);var ut=[];return et&&(t.simulator.fitToSize($.canvasWidth,$.buttonRowY(0),20,20),nt(!1)),w&&(ut=Object(i.jsx)(l.Arrow,{x:w.x+32,y:w.y+32,points:[0,0,I-(w.x+32),E-(w.y+32)],fill:"lightgrey",stroke:"lightgrey",strokeWidth:4,pointerLength:10,pointerWidth:10})),Object(i.jsxs)(l.Stage,{width:$.canvasWidth-4,height:$.canvasHeight,ref:it,onMouseUp:function(e){if(w){var n,i=void 0,a=Object(o.a)(u);try{for(a.s();!(n=a.n()).done;){var r=n.value;if(r.x<=e.evt.offsetX&&e.evt.offsetX<r.x+64&&r.y<=e.evt.offsetY&&e.evt.offsetY<r.y+64){i=r;break}}}catch(s){a.e(s)}finally{a.f()}i&&i!==w&&i.addInput(w)&&(m(t.simulator.getLinks()),_(void 0),X(void 0))}else W&&W.y<$.maxSensibleDropY&&t.simulator.add(W);_(void 0),X(void 0)},onMouseMove:function(t){w?L([t.evt.offsetX,t.evt.offsetY]):W&&W.setPosition(t.evt.offsetX,t.evt.offsetY)},onMouseLeave:function(){_(void 0),X(void 0)},children:[Object(i.jsxs)(l.Layer,{children:[Object(i.jsx)(l.Rect,{id:"background",x:0,y:0,width:$.canvasWidth,height:$.canvasHeight-$.buttonRowHeight,onMouseDown:function(t){t.target instanceof p||!g||x(void 0)},strokeWidth:0,fill:"GhostWhite"}),Object(i.jsx)(f,{simulator:t.simulator,right:$.canvasWidth-20,top:5}),u.map((function(t){return Object(i.jsx)(p,{model:t,isSelected:t===g,onLinkStart:at,onClick:ot,onMoveCompleted:st},t.id.toString())})),W?Object(i.jsx)(p,{model:W,isSelected:!1},W.id.toString()):[],ut,v.map((function(t){return Object(i.jsx)(O,{source:t.source,target:t.target},t.source.id.toString()+"-"+t.target.id.toString())}))]}),Object(i.jsxs)(l.Layer,{children:[Object(i.jsx)(l.Rect,{x:0,y:$.canvasHeight-$.buttonRowHeight,height:$.buttonRowHeight,width:$.canvasWidth,fill:"papayawhip"}),Object(i.jsx)(l.Line,{points:[0,$.canvasHeight-$.buttonRowHeight,$.canvasWidth,$.canvasHeight-$.buttonRowHeight],stroke:"grey",strokeWidth:3}),Object(i.jsx)(H,{x:$.buttonRowX(0),y:$.buttonRowY(0),selected:g,kind:"and",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(1),y:$.buttonRowY(1),selected:g,kind:"or",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(2),y:$.buttonRowY(2),selected:g,kind:"xor",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(3),y:$.buttonRowY(3),selected:g,kind:"nand",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(4),y:$.buttonRowY(4),selected:g,kind:"nor",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(5),y:$.buttonRowY(5),selected:g,kind:"xnor",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(6),y:$.buttonRowY(6),selected:g,kind:"input",onBeginDrag:rt}),Object(i.jsx)(H,{x:$.buttonRowX(7),y:$.buttonRowY(7),selected:g,kind:"timer",onBeginDrag:rt}),Object(i.jsx)(F,{x:$.buttonRowX(8),y:$.buttonRowY(8),simulator:t.simulator,selected:g}),Object(i.jsx)(D,{x:$.buttonRowX(9),y:$.buttonRowY(9),model:t.simulator}),Object(i.jsx)(A,{x:$.buttonRowX(10),y:$.buttonRowY(10),model:t.simulator}),Object(i.jsx)(N,{x:$.buttonRowX(11),y:$.buttonRowY(11),simulator:t.simulator}),Object(i.jsx)(B,{x:$.buttonRowX(12),y:$.buttonRowY(12),selected:g}),Object(i.jsx)(P,{x:$.buttonRowX(13),y:$.buttonRowY(13),simulator:t.simulator}),Object(i.jsx)(z,{x:$.buttonRowX(14),y:$.buttonRowY(14),simulator:t.simulator}),Object(i.jsx)(U,{x:$.buttonRowX(15),y:$.buttonRowY(15),simulator:t.simulator}),Object(i.jsx)(J,{x:$.buttonRowX(16),y:$.buttonRowY(16),simulator:t.simulator}),Object(i.jsx)(G,{x:$.buttonRowX(17),y:$.buttonRowY(17),simulator:t.simulator})]})]})}var q=function(t){t&&t instanceof Function&&n.e(3).then(n.bind(null,104)).then((function(e){var n=e.getCLS,i=e.getFID,o=e.getFCP,a=e.getLCP,r=e.getTTFB;n(t),i(t),o(t),a(t),r(t)}))};console.debug("In index"),function(){var t=window.location.search,e=void 0;if(t)try{e=d.a.decompressQueryStringFragment(t)}catch(n){alert("The query string doesn't seem to be something created by this app - was it perhaps truncated?")}!function(t){for(var e=function(){var e=i[n];v.a.Image.fromURL("/ScrapMechanicLogicGateSimulator/"+e+"-black.png",(function(n){m[e]=n,7===Object.keys(m).length&&t()}))},n=0,i=["and","or","xor","nand","nor","xnor","paint"];n<i.length;n++)e()}((function(){var t;try{t=new d.a(e)}catch(n){alert(n),t=new d.a}Object(c.render)(Object(i.jsx)(K,{simulator:t}),document.getElementById("root"))}))}(),q()},26:function(t,e,n){"use strict";(function(t){n.d(e,"a",(function(){return c}));var i=n(11),o=n(13),a=n(14),r=n(25),s=n(34),u=n(9),c=function(){function e(t){Object(o.a)(this,e),this._nextTickTimeoutId=void 0,this._pauseInterval=void 0,this._events=void 0,this.currentTick=void 0,this.isRunning=void 0,this.interactables=void 0,this._events=new r.EventEmitter,this.currentTick=0,this.isRunning=!1,this._nextTickTimeoutId=void 0,this._pauseInterval=250,this.interactables=[],void 0!==t&&null!==t&&this.load(t)}return Object(a.a)(e,[{key:"serialize",value:function(){var t=this;return this.interactables.map((function(e){return function(t,e){var n=t.export();return n.inputs=t.inputs.map((function(t){return e.indexOf(t)})),n}(e,t.interactables)}))}},{key:"load",value:function(t){if(!Array.isArray(t))throw new Error("Bad format - expected an array at the top level");for(var e=t.map((function(t){return u.b.validateAndDeserialize(t)})),n=0;n<e.length;++n){var o=t[n],a=e[n];if("object"!==typeof o||null===o)throw new Error("Bad format - expected an array of objects at the top level");if(!Object(u.f)(o,"inputs"))throw new Error("Interactable is missing an 'inputs' array");if(!Array.isArray(o.inputs))throw new Error("Interactable 'inputs' field should be an array of indices");var r,s=Object(i.a)(o.inputs);try{for(s.s();!(r=s.n()).done;){var c=r.value;if("number"!==typeof c)throw new Error("'inputs' should consist of numbers");if(c<0||c>=e.length)throw new Error("'inputs' has an index that is out of range");a.addInput(e[c])}}catch(d){s.e(d)}finally{s.f()}}var l=this.interactables;this.interactables=e,this._emitInteractablesReset({simulator:this,oldInteractables:l}),this.stopRunning()}},{key:"fitToSize",value:function(t,e,n,o){if(!this.interactables.every((function(n){return n.x>=0&&n.x<t-64&&n.y>=0&&n.y<e-64}))){var a,r=this.interactables.reduce((function(t,e){return Math.max(t,e.x)}),0),s=this.interactables.reduce((function(t,e){return Math.max(t,e.y)}),0),u=this.interactables.reduce((function(t,e){return Math.min(t,e.x)}),999999),c=this.interactables.reduce((function(t,e){return Math.min(t,e.y)}),999999),l=Object(i.a)(this.interactables);try{for(l.s();!(a=l.n()).done;){var d=a.value,f=n+(d.x-u)*(t-2*n-64)/r,h=o+(d.y-c)*(e-2*o-64)/s;d.setPosition(f,h)}}catch(v){l.e(v)}finally{l.f()}}}},{key:"gameReload",value:function(){var t,e=Object(i.a)(this.interactables);try{for(e.s();!(t=e.n()).done;){t.value.reload()}}catch(n){e.e(n)}finally{e.f()}this.currentTick=0,this._emitTick()}},{key:"putOnLift",value:function(){var t,e=Object(i.a)(this.interactables);try{for(e.s();!(t=e.n()).done;){t.value.putOnLift()}}catch(n){e.e(n)}finally{e.f()}}},{key:"takeOffLift",value:function(){var t,e=Object(i.a)(this.interactables);try{for(e.s();!(t=e.n()).done;){t.value.paint()}}catch(n){e.e(n)}finally{e.f()}}},{key:"serializeToCompressedQueryStringFragment",value:function(){var e=JSON.stringify(this.serialize()),n=s.a.deflate(e),i=t.from(n).toString("base64");return encodeURIComponent(i)}},{key:"startRunning",value:function(){this.isRunning||(this.isRunning=!0,this._nextTickTimeoutId=setTimeout(this._handleTickTimeout.bind(this),this._pauseInterval),this._events.emit("runStateChanged",{simulator:this,newRunState:this.isRunning}))}},{key:"stopRunning",value:function(){this.isRunning&&(this.isRunning=!1,this._nextTickTimeoutId&&clearTimeout(this._nextTickTimeoutId),this._nextTickTimeoutId=void 0,this._events.emit("runStateChanged",{simulator:this,newRunState:this.isRunning}))}},{key:"advanceOne",value:function(){this.isRunning||this._advanceOne()}},{key:"add",value:function(t){this.interactables.push(t),this._events.emit(l.interactableAdded,{simulator:this,interactable:t})}},{key:"remove",value:function(t){for(var e=!1,n=this.interactables.length-1;n>=0;--n)this.interactables[n]===t&&(e=!0,this.interactables.splice(n,1));var o,a=Object(i.a)(this.interactables);try{for(a.s();!(o=a.n()).done;){o.value.removeInput(t)}}catch(r){a.e(r)}finally{a.f()}return e&&this._events.emit(l.interactableRemoved,{simulator:this,interactable:t}),e}},{key:"getLinks",value:function(){return this.interactables.map((function(t){return t.inputs.map((function(e){return{source:e,target:t}}))})).reduce((function(t,e){return t.concat(e)}),[])}},{key:"_advanceOne",value:function(){++this.currentTick,this._emitTick();var t,e=Object(i.a)(this.interactables);try{for(e.s();!(t=e.n()).done;){t.value.apply()}}catch(a){e.e(a)}finally{e.f()}var n,o=Object(i.a)(this.interactables);try{for(o.s();!(n=o.n()).done;){n.value.calculate()}}catch(a){o.e(a)}finally{o.f()}}},{key:"onTick",value:function(t){this._events.on(l.tick,t)}},{key:"offTick",value:function(t){this._events.off(l.tick,t)}},{key:"_emitTick",value:function(){this._events.emit(l.tick,{simulator:this,tick:this.currentTick})}},{key:"onInteractableAdded",value:function(t){this._events.on(l.interactableAdded,t)}},{key:"offInteractableAdded",value:function(t){this._events.off(l.interactableAdded,t)}},{key:"onInteractableRemoved",value:function(t){this._events.on(l.interactableRemoved,t)}},{key:"offInteractableRemoved",value:function(t){this._events.off(l.interactableRemoved,t)}},{key:"onRunStateChanged",value:function(t){this._events.on("runStateChanged",t)}},{key:"offRunStateChanged",value:function(t){this._events.off("runStateChanged",t)}},{key:"onInteractablesReset",value:function(t){this._events.on("interactablesReset",t)}},{key:"offInteractablesReset",value:function(t){this._events.off("interactablesReset",t)}},{key:"_emitInteractablesReset",value:function(t){this._events.emit("interactablesReset",t)}},{key:"_handleTickTimeout",value:function(){this._advanceOne(),this._nextTickTimeoutId=setTimeout(this._handleTickTimeout.bind(this),this._pauseInterval)}}],[{key:"decompressQueryStringFragment",value:function(e){var n=decodeURIComponent(e),i=t.from(n,"base64"),o=s.a.inflate(i,{to:"string"});return JSON.parse(o)}}]),e}(),l={tick:"tick",interactableAdded:"interactableAdded",interactableRemoved:"interactableRemoved"}}).call(this,n(98).Buffer)},49:function(t,e,n){},9:function(t,e,n){"use strict";n.d(e,"f",(function(){return f})),n.d(e,"b",(function(){return v})),n.d(e,"c",(function(){return m})),n.d(e,"d",(function(){return k})),n.d(e,"a",(function(){return y})),n.d(e,"e",(function(){return g}));var i=n(20),o=n(15),a=n(21),r=n(19),s=n(12),u=n(16),c=n(13),l=n(14),d=n(25);function f(t,e){return t.hasOwnProperty(e)}function h(t,e){if(!f(t,"x")||"number"!==typeof t.x)throw new Error("Missing 'x' property or 'x' is not a number");if(!f(t,"y")||"number"!==typeof t.y)throw new Error("Missing 'x' property or 'x' is not a number");return{kind:e,x:t.x,y:t.y,inputs:[]}}var v=function(){function t(e){Object(c.a)(this,t),this._x=void 0,this._y=void 0,this.events=void 0,this._inputs=void 0,this._prevState=void 0,this._currentState=void 0,this.id=void 0,this.events=new d.EventEmitter,this._prevState=!1,this._currentState=!1,this._inputs=[],this._x=e.x,this._y=e.y,this.id=++t.idCounter}return Object(l.a)(t,[{key:"getPosition",value:function(){return{x:this._x,y:this._y}}},{key:"setPosition",value:function(t,e){this._x=t,this._y=e,this._emitMoved(t,e)}},{key:"setCurrentState",value:function(t){this._currentState!==t&&(this._currentState=t,this._emitStateChanged())}},{key:"setPrevState",value:function(t){this._prevState!==t&&(this._prevState=t,this._emitStateChanged())}},{key:"export",value:function(){return{x:this._x,y:this._y,kind:"input",inputs:[]}}},{key:"addInput",value:function(t){if(0===this.inputLimit)return!1;var e=this.inputs.indexOf(t);if(e>=0)this._inputs.splice(e,1);else{var n=t.inputs.indexOf(this);n>=0&&(t._inputs.splice(n,1),t.calculate()),1===this.inputLimit&&(this._inputs=[]),this._inputs.push(t)}return this.calculate(),this.paint(),t.paint(),!0}},{key:"removeInput",value:function(t){var e=this.inputs.indexOf(t);return!(e<0)&&(this._inputs.splice(e,1),this.calculate(),this.paint(),!0)}},{key:"setInputs",value:function(t){this._inputs=Object(u.a)(t)}},{key:"twiddle",value:function(t){}},{key:"apply",value:function(){this.setPrevState(this.currentState)}},{key:"calculate",value:function(){}},{key:"reload",value:function(){}},{key:"putOnLift",value:function(){}},{key:"paint",value:function(){}},{key:"onMoved",value:function(t){this.events.on("moved",t)}},{key:"offMoved",value:function(t){this.events.off("moved",t)}},{key:"onStateChanged",value:function(t){this.events.on("stateChanged",t)}},{key:"offStateChanged",value:function(t){this.events.off("stateChanged",t)}},{key:"_emitMoved",value:function(t,e){this.events.emit("moved",{source:this,x:t,y:e})}},{key:"_emitStateChanged",value:function(){this.events.emit("stateChanged",{source:this})}},{key:"x",get:function(){return this._x}},{key:"y",get:function(){return this._y}},{key:"currentState",get:function(){return this._currentState}},{key:"prevState",get:function(){return this._prevState}},{key:"inputs",get:function(){return Object(u.a)(this._inputs)}},{key:"inputLimit",get:function(){return"unlimited"}}],[{key:"validateAndDeserialize",value:function(t){if("object"!==typeof t||null===t)throw new Error("Bad format - expected an array of objects at the top level");if(!f(t,"kind"))throw new Error("Interactable is missing an 'inputs' array");switch(t.kind){case"input":case"input-on":case"input-off":return new y(function(t,e){return b(t,"input","input-on"===e)}(t,t.kind));case"timer":case"timer10":return new g(function(t){var e;f(t,"tickStorage")&&(e=t.tickStorage);f(t,"timerTickStorage")&&(e=t.timerTickStorage);if(void 0===e||!Array.isArray(e)||!e.every((function(t){return"boolean"===typeof t})))throw new Error("Timer interactables should have a boolean array named 'tickStorage'");return Object(s.a)(Object(s.a)({},h(t,"timer")),{},{tickStorage:e})}(t));case"and":case"or":case"xor":case"nand":case"nor":case"xnor":return new k(function(t,e){return b(t,e,!1)}(t,t.kind));default:throw new Error("Interactable has unknown 'kind': "+t.kind)}}}]),t}();function b(t,e,n){var i=n;if(f(t,"savedState")){if("boolean"!==typeof t.savedState)throw new Error("Interactables of kind '"+e+"' should have a 'savedState' property of type boolean");i=t.savedState}return Object(s.a)(Object(s.a)({},h(t,e)),{},{savedState:i})}v.idCounter=0;var m=function(t){Object(a.a)(n,t);var e=Object(r.a)(n);function n(t){var i;return Object(c.a)(this,n),(i=e.call(this,t))._savedState=void 0,i._savedState=t.savedState,i}return Object(l.a)(n,[{key:"export",value:function(){return Object(s.a)(Object(s.a)({},Object(i.a)(Object(o.a)(n.prototype),"export",this).call(this)),{},{savedState:this._savedState})}},{key:"paint",value:function(){this._savedState!==this.currentState&&(this._savedState=this.currentState,Object(i.a)(Object(o.a)(n.prototype),"_emitStateChanged",this).call(this))}},{key:"reload",value:function(){this.setCurrentState(this.savedState),this.setPrevState(!1)}},{key:"savedState",get:function(){return this._savedState}}]),n}(v),p=["and","or","xor","nand","nor","xnor"];var k=function(t){Object(a.a)(n,t);var e=Object(r.a)(n);function n(t){var i;if(Object(c.a)(this,n),(i=e.call(this,t))._kind=void 0,"timer"===t.kind||"input"===t.kind)throw new Error("Caller should prevent this");return i._kind=t.kind,i}return Object(l.a)(n,[{key:"twiddle",value:function(t){var e=p.indexOf(this._kind);(e+=t)<0?e+=p.length:e>=p.length&&(e-=p.length),this.kind=p[e],this.calculate(),this.paint()}},{key:"calculate",value:function(){var t,e=this.inputs.reduce((function(t,e){return t+(e.prevState?1:0)}),0);switch(this.kind){case"and":t=this.inputs.length>0&&e===this.inputs.length;break;case"or":t=this.inputs.length>0&&e>0;break;case"xor":t=e%2===1;break;case"nand":t=this.inputs.length>0&&e!==this.inputs.length;break;case"nor":t=this.inputs.length>0&&0===e;break;case"xnor":t=this.inputs.length>0&&e%2===0}this.setCurrentState(t)}},{key:"putOnLift",value:function(){this.setCurrentState(this.inputs.length>0&&("nand"===this.kind||"nor"===this.kind||"xnor"===this.kind)),this.setPrevState(!1),this.paint()}},{key:"export",value:function(){return Object(s.a)(Object(s.a)({},Object(i.a)(Object(o.a)(n.prototype),"export",this).call(this)),{},{kind:this._kind})}},{key:"kind",get:function(){return this._kind},set:function(t){this._kind=t,this._emitStateChanged(),this.paint()}},{key:"inputLimit",get:function(){return"unlimited"}}]),n}(m);var y=function(t){Object(a.a)(n,t);var e=Object(r.a)(n);function n(){return Object(c.a)(this,n),e.apply(this,arguments)}return Object(l.a)(n,[{key:"twiddle",value:function(t){this.setCurrentState(!this.currentState)}},{key:"putOnLift",value:function(){this.setCurrentState(!1),this.setPrevState(!1),this.paint()}},{key:"inputLimit",get:function(){return 0}}]),n}(m);var g=function(t){Object(a.a)(n,t);var e=Object(r.a)(n);function n(t){var i;return Object(c.a)(this,n),(i=e.call(this,t))._tickStorage=void 0,i._tickStorage=Object(u.a)(t.tickStorage),i}return Object(l.a)(n,[{key:"export",value:function(){return Object(s.a)(Object(s.a)({},Object(i.a)(Object(o.a)(n.prototype),"export",this).call(this)),{},{kind:"timer",tickStorage:this._tickStorage})}},{key:"calculate",value:function(){this.setCurrentState(this._tickStorage[this._tickStorage.length-1]),this._tickStorage[0]=this.inputs.length>0&&this.inputs[0].prevState}},{key:"apply",value:function(){this.setPrevState(this.currentState);for(var t=0;t<this._tickStorage.length-1;++t)this._tickStorage[this._tickStorage.length-1-t]=this._tickStorage[this._tickStorage.length-2-t];this.setCurrentState(this._tickStorage[this._tickStorage.length])}},{key:"tickStorage",get:function(){return Object(u.a)(this._tickStorage)}},{key:"inputLimit",get:function(){return 1}}]),n}(v)}},[[103,1,2]]]);
//# sourceMappingURL=main.e5327106.chunk.js.map