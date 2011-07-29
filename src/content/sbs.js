/*
 * (The MIT License)
 * 
 * Copyright (c) 2011 by &lt;marc.dassonneville@gmail.com&gt;
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var sbs = (function () {
   var begin = function () {
      // shared vars
      var win = window.content;
      var doc = win.document;
      var layerBox = doc.createElement("div"); // attached to body.
      var layerBg = doc.createElement("div");  // child of layerBox
      var layerSelection = null;               // child of layerBox
      layerBox.id = "sbs_layer";

      var screenshotInfos = {
         'top' : 0, 'left' : 0,
         'width' : 0, 'height' : 0 // numeric
      };
      
      // screenshot functions, locals to tab.
      var onMousedown = function ({ clientX : x, clientY : y}) {
         if (layerSelection == null) {
            layerSelection = doc.createElement("div");
            layerSelection.setAttribute("style", 'position:absolute;display:inline;background-color:white;border:1px solid black;z-index:2;opacity:0.9;');
            layerBg.appendChild(layerSelection);
         }
         layerSelection.style.left =  x + "px";
         layerSelection.style.top =  y + "px";
         // saving data
         screenshotInfos.left = x;
         screenshotInfos.top = y;
         // triggers.
         doc.addEventListener("mousemove", onMousemove, true);
         doc.addEventListener("mouseup", onMouseup, true);
      };
      
      var onMousemove = function ({ clientX : x, clientY : y}) {
         // drawing
         layerSelection.style.width = Math.max(0, x - screenshotInfos.left) + "px";
         layerSelection.style.height = Math.max(0, y - screenshotInfos.top) + "px";
      };
      
      var onMouseup = function ({ clientX : x, clientY : y}) {
         // removing triggers
         doc.removeEventListener("mousemove", onMousemove, true);
         doc.removeEventListener("mouseup", onMouseup, true);
         // saving data
         screenshotInfos.width = Math.max(0, x - screenshotInfos.left);
         screenshotInfos.height = Math.max(0, y - screenshotInfos.top);
         //
         end(); // removing graphics artefacts
         screenshot();
      };
   
      var screenshot = function () {
         // using canvas drawWindow to screenshot.
         let { width : w, height : h, top : t, left : l } = screenshotInfos;
         var canvas = doc.createElement("canvas");
         canvas.width = w;
         canvas.height = h;
         var ctx = canvas.getContext("2d");
         ctx.clearRect(0, 0, w, h);
         ctx.save();
         var deltaY = doc.documentElement.scrollTop;
         var deltaX = doc.documentElement.scrollLeft;
         ctx.drawWindow(win, l + deltaX, t + deltaY, l + w + deltaX, t + h + deltaY, "rgb(255,255,255)");
         ctx.restore();
         // IMG data:image..
         var data = canvas.toDataURL();
         // FIXME: adding confirm step.
         googleSearch(data);
      }
      
      var googleSearch = function (data) {
         // pre-process
         var base64Offset = data.indexOf(',');
         if (base64Offset == -1)
            return;
         var inlineImageData = data.substring(base64Offset + 1)
            .replace(/\+/g, '-').replace(/\//g, '_')
            .replace(/\./g, '=');
         // posting data to google search by image
         var gsbi = "chrome://sbs/content/gsbi.html";
         var tab = gBrowser.addTab(gsbi);
         var tabBrowser = gBrowser.getBrowserForTab(tab);
         //
         var submitToGsbi = function submit() {
            // removing event listener
            tabBrowser.removeEventListener("load", submitToGsbi, true);
            // inside new tab => submit the data.
            let doc = tabBrowser.contentDocument;
            doc.getElementById('img_content').setAttribute('value', inlineImageData);
            doc.forms[0].submit();
            // select tab
            gBrowser.selectedTab = tab;
         };
         tabBrowser.addEventListener("load", submitToGsbi, true);
      }
      
      // shading layer background 
      layerBg.setAttribute('style', 'position:fixed;background-color:gray;top:0px;left:0px;width:100%;height:100%;z-index:1;opacity:0.4;');
      layerBg.addEventListener("mousedown", onMousedown, false);
      layerBox.appendChild(layerBg);
      layerBox.setAttribute('style', 'position:absolute;z-index:2147483647;'); // max z-index
      doc.body.appendChild(layerBox);
   };
   
   var end = function () {
      let w = window.content, doc = w.document;
      doc.body.removeChild(doc.getElementById("sbs_layer"));
   };
   
   var toggle = function () {
      let w = window.content, doc = w.document;
      (!doc.getElementById("sbs_layer")) ? begin() : end();
   };
   
   return toggle;
})();