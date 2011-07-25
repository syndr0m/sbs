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
         var inlineImage = data.substring(base64Offset + 1)
            .replace(/\+/g, '-').replace(/\//g, '_')
            .replace(/\./g, '=');
         // post the data to google searchbyimage
         var form = doc.createElement('form');
         form.setAttribute('method', 'POST');
         form.setAttribute('action', 'http://www.google.com/searchbyimage/upload');
         form.setAttribute('enctype', 'multipart/form-data');
         form.setAttribute('target', '_blank');
         var inputs = [ { 'name' : 'image_content', 'value' : inlineImage },
           { 'name' : 'filename', 'value' : '' },
           { 'name' : 'image_url', 'value' : '' },
           { 'name' : 'sbs', 'value' : 'ff_1_0_0' } ];
         inputs.forEach(function (d) {
           let i = doc.createElement('input');
           i.setAttribute('type', 'hidden');
           i.setAttribute('name', d.name);
           i.setAttribute('value', d.value);
           form.appendChild(i);
         });
         doc.body.appendChild(form);
         form.submit();
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