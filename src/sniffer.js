(function(document) {
	var last;
	var callbackSniffer = null;

	function inspectorMouseOver(e) {
		var element = e.target;
		last = element;
	}

	function inspectorMouseOut(e) {
//		e.target.style.outline = '';
		var element = e.target;
		last = element;
	}

	function inspectorOnClick(e) {
//		e.preventDefault();
//		e.stopImmediatePropagation();

		// These are the default actions (the XPath code might be a bit janky)
		// Really, these could do anything:
		console.log( cssPath(e.target) );
		console.log( getLabel(e.target) );
		if (report) report.text(  " Label: " +  getLabel(e.target) + ' / ' + cssPath(e.target));
		if (done_callback) done_callback();

		/* console.log( getXPath(e.target).join('/') ); */

		inspectorCancel(null);
		return false;
	}


	/**
	 * Function to cancel inspector:
	 */
	function inspectorCancel(e) {
		// Unbind inspector mouse and click events:
		if (e === null && event.keyCode === 27) { // IE (won't work yet):
			document.detachEvent("mouseover", inspectorMouseOver);
			document.detachEvent("mouseout", inspectorMouseOut);
			document.detachEvent("click", inspectorOnClick);
			document.detachEvent("keydown", inspectorCancel);
			last.style.outlineStyle = 'none';
		} else if(e === null || e.which === 27) { // Better browsers:
			document.removeEventListener("mouseover", inspectorMouseOver, true);
			document.removeEventListener("mouseout", inspectorMouseOut, true);
			document.removeEventListener("click", inspectorOnClick, true);
			document.removeEventListener("keydown", inspectorCancel, true);

			// Remove outline on last-selected element:
			last.style.outline = 'none';
		}
	}


	document.SnifferRun = function (callback) {
		if ( document.addEventListener ) {
			document.addEventListener("mouseover", inspectorMouseOver, true);
			document.addEventListener("mouseout", inspectorMouseOut, true);
			document.addEventListener("click", inspectorOnClick, true);
			document.addEventListener("keydown", inspectorCancel, true);
		} else if ( document.attachEvent ) {
			document.attachEvent("mouseover", inspectorMouseOver);
			document.attachEvent("mouseout", inspectorMouseOut);
			document.attachEvent("click", inspectorOnClick);
			document.attachEvent("keydown", inspectorCancel);
		}

	}
	document.SnifferCancel = function () {
		callbackSniffer = null;

	}
})(document);
