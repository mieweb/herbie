!function(t){"use strict";var e=t.simulate.prototype.mouseEvent,o=/\[object (?:HTML)?Document\]/;t.simulate.prototype.mouseEvent=function(r,n){if(n.pageX||n.pageY){var a=o.test(Object.prototype.toString.call(this.target))?this.target:this.target.ownerDocument||document;n.clientX=(n.pageX||0)-t(a).scrollLeft(),n.clientY=(n.pageY||0)-t(a).scrollTop()}return e.apply(this,[r,n])}}(jQuery);