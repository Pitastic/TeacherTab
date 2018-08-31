// Design-Anpassung für mobile Geräte

// Queries
var isDesktop = "only screen and (hover: hover)";
var isTouch = "only screen and (pointer:coarse)";
var isSmartphone = "only screen and (min-device-width: 768px)";
var isTablet = "only screen and (min-device-width: 768px)";
var isLandscape = "(orientation: landscape)";
var isPortrait = "(orientation: portrait)";


function handle_orientation_landscape(evt) {
	console.log("STYLE: Handle Orientation, isLandscape:", evt.matches);
	if (evt.matches) {
		document.getElementById('dynamicViewport').setAttribute('content', "width="+document.documentElement.clientWidth);
	}else{
		document.getElementById('dynamicViewport').setAttribute('content', "width=device-width");		
	}
}


// MatchMedias
var checkOrientation = window.matchMedia( isLandscape );
var checkTouch = window.matchMedia( isTouch );
var checkDesktop = window.matchMedia( isDesktop );


// Orientation / Seitenverhältnisse
handle_orientation_landscape( checkOrientation );
checkOrientation.addListener( handle_orientation_landscape );


// Gerätespezifische Tests
if ( checkDesktop.matches && !checkTouch.matches ) {
	// Hat eine Maus und kein Touch == Desktop
	console.log("STYLE: vermutlich Desktop");

}else if (checkTouch.matches) {
	// Hat Touch == Tablet oder Smartphone oder ähnlich
	console.log("STYLE: Device hat einen Touchscreen");

	// add Touchscreen Handlers
	var touchHandlers = document.createElement('script');
	touchHandlers.onload = function () {
		touchListener();
	};
	touchHandlers.type = "text/javascript";
	touchHandlers.src = "js/touch.js";
	document.head.appendChild(touchHandlers);

	var checkDeviceMobile = window.matchMedia( isSmartphone );

	if (checkDeviceMobile.matches) {
		// Lade CSS und Buttons für Smartphone
		GLOBALS.isPhone = true;
		console.log("STYLE: Device ist ein Smartphone");
		alert("STYLE: Device ist ein Smartphone");
	}else{
		// Lade CSS und Buttons für Tablet
		console.log("STYLE: Device ist ein Tablet");
		alert("STYLE: Device ist ein Tablet");
	}

}else{
	// nicht unterstützt (z.B. FireFox auf Desktop/Tablet/Smartphone)
	alert("STYLE: unsupported");
	console.log("STYLE: unsupported");
}