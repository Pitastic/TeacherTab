"use strict";
// esLint Globals:
/* globals GLOBALS touchScroller touchSlider noTouchThisSlider */

// Design- und Funktionsanpassung für die verschiedenen Geräte
var DEV_LOG1 = "";
var CACHE = "tt_webapp_v1";
var toCache = [];
var DEVICE = [];

// TODO: nur checks machen, wenn nichts im SessionStore steht


// Feature detection
function checkIDBShim() {
//> Fron: https://bl.ocks.org/nolanlawson/8a2ead46a184c9fae231
	var req = indexedDB.open('test', 1);

	req.onupgradeneeded = function (e) {
		var db = e.target.result;
		db.createObjectStore('one', {
			keyPath: 'key'
		});
		db.createObjectStore('two', {
			keyPath: 'key'
		});
	};

	req.onerror = function () {
		console.log("IDB-TESTING: Error opening IndexedDB");
		DEVICE.push("noidx");
	};

	req.onsuccess = function (e) {
		var db = e.target.result;
		var tx;
		try {
			tx = db.transaction(['one', 'two'], 'readwrite');
		} catch (err) {
			console.log("IDB-TESTING: Error opening two stores at once (buggy implementation)");
			DEVICE.push("noidx");
			return;
		}

		tx.oncomplete = function (e) {
			db.close();
			console.log("IDB-TESTING: Passed !");
		};

		var req = tx.objectStore('two').put({
			'key': new Date().valueOf()
		});
		req.onsuccess = function (e) {
		};
		req.onerror = function () {
		};
	};
}

// Cache mit Device-Info erweitern

function extendCache(DEVICE) {
	// Device abhängig
	if (DEVICE.indexOf('phone') >= 0) {
		//toCache.push("");
	} else if (DEVICE.indexOf('tablet') >= 0) {
		//toCache.push("");
	} else if (DEVICE.indexOf('desktop') >= 0) {
		//toCache.push("");
	}	

	// Polyfills
	if (DEVICE.indexOf('noidx') >= 0) {
		// omg - run for babel and idx
		toCache.push("/js/frameworks/babel_polyfill.min.js");
		toCache.push("/js/frameworks/indexeddbshim.min.js");
	} else if (DEVICE.indexOf('nojs') >= 0) {
		// nur babel
		toCache.push("/js/frameworks/babel_polyfill.min.js");
	}

	if (toCache.length > 0) {
		console.log("SW: extending Cache", toCache);
		caches.open(CACHE).then(function(cache) {
			for (var i = toCache.length - 1; i >= 0; i--) {
				console.log("SW: caching", toCache[i]);
				cache.add( toCache[i] )
					.catch(function (err) { console.log("SW: Fehler beim Cachen von", toCache[i], err); });
			}
		});
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
	// Check indexedDB (noidx ?)
	checkIDBShim();
	// Check ES2016 (nojs ?)
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

	// Shims und Caches hinterlegen
	checkForSHIM();

	/*TODO: vorerst wird alles (zuviel gecached... issue #49) */
	//extendCache();
};
