"use strict";
// Design- und Funktionsanpassung für die verschiedenen Geräte

var DEV_LOG1 = "";
var CACHE = "tt_webapp_v1";
var toCache = []


// Cache mit Device-Info erweitern

function extendCache(device_info) {
	// Device abhängig
	if (device_info.indexOf('phone') >= 0) {
		//toCache.push("");
	} else if (device_info.indexOf('tablet') >= 0) {
		//toCache.push("");
	} else if (device_info.indexOf('desktop') >= 0) {
		//toCache.push("");
	}	

	// Polyfills
	if (device_info.indexOf('noidx') >= 0) {
		// omg - run for babel and idx
		toCache.push("/js/frameworks/babel_polyfill.min.js");
		toCache.push("/js/frameworks/indexeddbshim.min.js");
	} else if (device_info.indexOf('nojs') >= 0) {
		// nur babel
		toCache.push("/js/frameworks/babel_polyfill.min.js");
	}

	if (toCache.length > 0) {
		console.log("SW: extending Cache", toCache);
		caches.open(CACHE).then(function(cache) {
			for (var i = toCache.length - 1; i >= 0; i--) {
				console.log("SW: caching", toCache[i]);
				cache.add( toCache[i] )
				.catch(function (err) { console.log("SW: Fehler beim Cachen von", toCache[i], err) });
			}
		})
	}
}
	
	
function handle_orientation_landscape(evt) {
	console.log("STYLE: Handle Orientation, isLandscape:", evt.matches);
	var viewport = "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";
	var dwidth = "width=device-width";
	document.getElementById('dynamicViewport').setAttribute('content', viewport+" "+dwidth);		
}


function passCss(absolutePath) {
	var cssId = btoa(absolutePath);
	if (!document.getElementById(cssId)) {
		var head = document.getElementsByTagName('head')[0];
		var link = document.createElement('link');
		link.id = cssId;
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = absolutePath;
		document.head.appendChild(link);
	}
	toCache.push(absolutePath);
}


function passJs(absolutePath) {
	var jsId = btoa(absolutePath);
	if (!document.getElementById(jsId)) {
		var script = document.createElement('script');
		script.type = "text/javascript";
		script.src = absolutePath;
		document.head.appendChild(script);
		return script;
	}
	toCache.push(absolutePath);
}

function checkForSHIM() {
	// Check indexedDB Polyfill

	// Check JS Polyfill
}

window.onload = function(evt){

	// Queries
	var isDesktop = "only screen and (hover: hover)";
	var isTouch = "only screen and (pointer:coarse)";
	var isSmartphone = "only screen and (max-device-width: 480px)";
	var isLandscape = "(orientation: landscape)";

	// MatchMedias
	var checkOrientation = window.matchMedia( isLandscape );
	var checkTouch = window.matchMedia( isTouch );
	var checkDesktop = window.matchMedia( isDesktop );


	// Gerätespezifische Tests
	if ( checkDesktop.matches && !checkTouch.matches ) {
		// Hat eine Maus und kein Touch == Desktop
		DEV_LOG1 += "> STYLE: Desktop\n";


	}else if (checkTouch.matches) {
		// Hat Touch == Tablet oder Smartphone oder ähnlich
		DEV_LOG1 += "> STYLE: Touchscreen\n";

		// Orientation / Seitenverhältnisse
		handle_orientation_landscape(checkOrientation);
		checkOrientation.addListener(handle_orientation_landscape);

		// add Touchscreen Handlers
		var touchHandlers = passJs("/js/touch.js");
		touchHandlers.onload = function () {
			touchScroller();
			touchSlider();
			noTouchThisSlider(); // touch-friendly-Buttons
		};

		var checkDeviceMobile = window.matchMedia( isSmartphone );

		if (checkDeviceMobile.matches) {
			// Lade CSS und Buttons für Smartphone
			GLOBALS.isPhone = true;
			passCss("/css/phone.css");
			DEV_LOG1 += " - Smartphone\n";
		}else{
			// Lade CSS und Buttons für Tablet
			DEV_LOG1 += " - Tablet\n";
		}

	}else{
		// nicht unterstützt (z.B. FireFox auf Desktop/Tablet/Smartphone)
		DEV_LOG1 += "> STYLE: unsupported\n";
	}


	DEV_LOG1 += "> STYLE: Pixel-Width "+window.innerWidth;

	var devlog_container = document.getElementById("dev_info1");
	console.log(DEV_LOG1);
	if (devlog_container) { devlog_container.innerHTML = DEV_LOG1; }
	
	/*TODO: vorerst wird alles (zuviel gecached... issue #49) */
	//extendCache(["noidx", "nojs"]);
};
