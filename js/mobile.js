// Design-Anpassung für mobile Geräte

var DEV_LOG1 = "";


function handle_orientation_landscape(evt) {
	console.log("STYLE: Handle Orientation, isLandscape:", evt.matches);
	if (evt.matches) {
		DEV_LOG1 += "> STYLE: Orientation landscape\n";
		document.getElementById('dynamicViewport').setAttribute('content', "width="+document.documentElement.clientWidth);
	}else{
		DEV_LOG1 += "> STYLE: Orientation portrait\n";
		document.getElementById('dynamicViewport').setAttribute('content', "width=device-width");		
	}
}


window.onload = function(evt){

	// Queries
	var isDesktop = "only screen and (hover: hover)";
	var isTouch = "only screen and (pointer:coarse)";
	var isSmartphone = "only screen and (max-device-width: 480px)";
	var isLandscape = "(orientation: landscape)";
	var isPortrait = "(orientation: portrait)";

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
		DEV_LOG1 += " > STYLE: Desktop\n";


	}else if (checkTouch.matches) {
		// Hat Touch == Tablet oder Smartphone oder ähnlich
		DEV_LOG1 += " > STYLE: Touchscreen\n";

		// add Touchscreen Handlers
		var touchHandlers = document.createElement('script');
		touchHandlers.onload = function () {
			touchScroller();
			touchSlider();
			// Touch-Friendly-Buttons
			noTouchThisSlider();
		};
		touchHandlers.type = "text/javascript";
		touchHandlers.src = "js/touch.js";
		document.head.appendChild(touchHandlers);

		var checkDeviceMobile = window.matchMedia( isSmartphone );

		if (checkDeviceMobile.matches) {
			// Lade CSS und Buttons für Smartphone
			GLOBALS.isPhone = true;
			DEV_LOG1 += " - Smartphone\n";
		}else{
			// Lade CSS und Buttons für Tablet
			DEV_LOG1 += " - Tablet\n";
		}

	}else{
		// nicht unterstützt (z.B. FireFox auf Desktop/Tablet/Smartphone)
		DEV_LOG1 += " > STYLE: unsupported\n";
	}


	DEV_LOG1 += "STYLE: Pixel-Width "+window.innerWidth;

	devlog_container = document.getElementById("dev_info1");
	console.log(DEV_LOG1);
	if (devlog_container) { devlog_container.innerHTML = DEV_LOG1; }

};
