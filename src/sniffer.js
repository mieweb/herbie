!function(e){var t;function n(e){var n=e.target;t=n}function o(e){var n=e.target;t=n}function a(e){return console.log(cssPath(e.target)),console.log(getLabel(e.target)),report&&report.text(" Label: "+getLabel(e.target)+" / "+cssPath(e.target)),done_callback&&done_callback(),c(null),!1}function c(r){null===r&&27===event.keyCode?(e.detachEvent("mouseover",n),e.detachEvent("mouseout",o),e.detachEvent("click",a),e.detachEvent("keydown",c),t.style.outlineStyle="none"):null!==r&&27!==r.which||(e.removeEventListener("mouseover",n,!0),e.removeEventListener("mouseout",o,!0),e.removeEventListener("click",a,!0),e.removeEventListener("keydown",c,!0),t.style.outline="none")}e.SnifferRun=function(t){e.addEventListener?(e.addEventListener("mouseover",n,!0),e.addEventListener("mouseout",o,!0),e.addEventListener("click",a,!0),e.addEventListener("keydown",c,!0)):e.attachEvent&&(e.attachEvent("mouseover",n),e.attachEvent("mouseout",o),e.attachEvent("click",a),e.attachEvent("keydown",c))},e.SnifferCancel=function(){null}}(document);