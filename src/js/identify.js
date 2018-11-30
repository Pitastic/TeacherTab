"use strict";
// esLint Globals:
/* globals touchScroller touchSlider noTouchThisSlider */

// Design- und Funktionsanpassung für die verschiedenen Geräte
var DEV_LOG1 = "";
var CACHE = "tt_webapp_v1";
var DEVICE;


var GLOBALS = {
	'AUTH': null,
	'userID': null,
	'passW': null,
	'SyncServer': "c/api",
	'timeout': 6000,

	'appversion': "1.1",
	'dbname': null,
	'dbversion': null,
	'dbToGo': null,
	'dbFinished': null,
	'noSyncCols': null,

	'klasse': null,
	'klassenbezeichnung': null,

	'knownDevice': null,
	'perfStart': null,
	'perfEnd': null,
	'deferredPrompt': null,
};


// TODO: Cleanup nach IDB test
// TODO: ES6 Tests



// Feature detection

// -- IndexedDB
function checkIDBShim(callback) {
	//> From: https://bl.ocks.org/nolanlawson/8a2ead46a184c9fae231
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
		console.log("IDENTIFY: (idb) Error opening IndexedDB");
		DEVICE['noidx'] = true;
	};

	req.onsuccess = function (e) {
		var db = e.target.result;
		var tx;
		try {

			tx = db.transaction(['one', 'two'], 'readwrite');

			tx.oncomplete = function (e) {
				console.log("IDENTIFY: (idb) Passed !");
				DEVICE['noidx'] = false;
				db.close();
				callback();
			};

			var req = tx.objectStore('two').put({
				'key': new Date().valueOf()
			});
			req.onsuccess = function (e) {
			};
			req.onerror = function (e) {
			};

		} catch (err) {
			console.log("IDENTIFY: (idb) Error opening two stores at once (buggy implementation)");
			DEVICE['noidx'] = 'ios9';
			db.close();
			callback();
		}

	};
}

// -- ES 6
function checkES6() {
	if (false) {
		DEVICE['nojs'] = true;
	} else {
		DEVICE['nojs'] = false;
	}
}


// Cache mit Device-Info erweitern

function extendCache() {
	// Device abhängig
	if (DEVICE['phone']) {
		//DEVICE['toCache'].push("");
	} else if (DEVICE['tablet']) {
		//DEVICE['toCache'].push("");
	} else if (DEVICE['desktop']) {
		//DEVICE['toCache'].push("");
	}

	// Polyfills
	/*
	// Alle passJS / passCSS wurden schon an die Cache Liste angehängt !
	//
	if (DEVICE['noidx']){
		// omg - run for babel and idx
		DEVICE['toCache'].push("/js/frameworks/babel_polyfill.min.js");
		DEVICE['toCache'].push("/js/frameworks/indexeddbshim.min.js");
	} else if (DEVICE['nojs']){
		// nur babel
		DEVICE['toCache'].push("/js/frameworks/babel_polyfill.min.js");
	}
	*/

	if (DEVICE['toCache'].length > 0) {
		console.log("IDENTIFY: (sw) extending Cache", DEVICE['toCache']);
		console.log("IDENTIFY: (sw) ...not implemented !");
		/*
		caches.open(CACHE).then(function(cache) {
			for (var i = DEVICE['toCache'].length - 1; i >= 0; i--) {
				console.log("IDENTIFY: (sw) caching", DEVICE['toCache'][i]);
				cache.add( DEVICE['toCache'][i] )
					.catch(function (err) { console.log("IDENTIFY: (sw) Fehler beim Cachen von", DEVICE['toCache'][i], err); });
			}
		});
		*/
	}
}


// DOM Manipulations

// -- dynamic Orienatation
function handle_orientation_landscape(evt) {
	console.log("IDENTIFY: (style) Handle Orientation, isLandscape:", evt.matches);
	var viewport = "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";
	var dwidth = "width=device-width";
	if (evt.matches) {
		// Landscape :
		document.getElementById('dynamicViewport').setAttribute('content', viewport);
	} else {
		// Portrait :
		document.getElementById('dynamicViewport').setAttribute('content', viewport + " " + dwidth);
	}
}

// -- Buttons
function change_Buttons() {
	// Buttons wurden hier noch nicht geladen
	window.addEventListener('load', function () {
		var buttons = {
			"btn_Add": "&#65291;",
			"btn_Delete": "&#10006;",
			"export": "&#8675;",
			"import": "&#8673;",
		};
		for (var key in buttons) {
			var oldButton = document.getElementById(key);
			oldButton.innerHTML = buttons[key] + "<br>" + oldButton.innerText;
		}
	});
}

// -- Add CSS
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
	DEVICE['toCache'].push(absolutePath);
}

// -- Add JS
function passJs(absolutePath, entrypoint, wait) {
	var jsId = btoa(absolutePath);
	if (!document.getElementById(jsId)) {
		var script = document.createElement('script');
		script.type = "text/javascript";
		script.src = absolutePath;
		script.id = jsId;
		document.head.appendChild(script);
		if (entrypoint && !wait) {
			script.onload = function () {
				entrypoint();
			};
		} else if (entrypoint && wait) {
			window.addEventListener('load', function () {
				entrypoint();
			});
		}
	}
	DEVICE['toCache'].push(absolutePath);
}


// Apply Settings
function prepareDevice() {

	// Save to Session
	console.log("IDENTIFY: (prepare) Device is:", DEVICE);
	localStorage.setItem("DEVICE", JSON.stringify(DEVICE));

	// IDB Shim (hinterlegen bis Shim geladen)
	if (DEVICE['noidx'] == 'ios9') {
		passJs("/js/frameworks/indexeddbshim-ios9.pack.js", function () {
			console.log("IDENTIFY: idb-ios9-shim loaded");
			// in SHIM: use und define;
		});
	} else if (DEVICE['noidx']) {
		passJs("/js/frameworks/babel_polyfill.min.js", function () {
			passJs("/js/frameworks/indexeddbshim.min.js", function () {
				console.log("IDENTIFY: idbshim loaded");
				window.shimIndexedDB.__useShim();
				window.shimIndexedDB.__debug(true);
				window.SHIMindexedDB = window.shimIndexedDB;
			});
		});
	}

	// JS Shim
	if (DEVICE['nojs'] && !DEVICE['noidx']) { passJs("/js/frameworks/babel_polyfill.min.js"); }

	// Touch und Orientation
	if (DEVICE['touch']) {

		// Orientation / Seitenverhältnisse

		var isLandscape = "(orientation: landscape)";
		var checkOrientation = window.matchMedia(isLandscape);

		handle_orientation_landscape(checkOrientation);
		checkOrientation.addListener(handle_orientation_landscape);

		// add Touchscreen Handlers
		passJs("/js/touch.js", function () {
			touchScroller();
			touchSlider();
			noTouchThisSlider(); // touch-friendly-Buttons
		});

	}

	// Scripts und CSS
	switch (DEVICE['type']) {
		case "mobile":
			// Lade CSS und Buttons für Smartphone
			passCss("/css/phone.css");
			change_Buttons();
			break;

		case "tablet":
			// Lade CSS und Buttons für Tablet
			break;

		default: // Desktop
			break;
	}

	// Cache
	/*TODO: vorerst wird alles (zuviel gecached... issue #49) */
	//extendCache();
}



// Run tests if DEVICE unknown
var fromStore = localStorage.getItem("DEVICE");

if (fromStore) {

	// no tests
	DEVICE = JSON.parse(fromStore);
	extendCache();
	prepareDevice();

} else {

	DEVICE = {};
	DEVICE['toCache'] = [];

	// Queries
	var isDesktop = "only screen and (hover: hover)";
	var isTouch = "only screen and (pointer:coarse)";
	var isSmartphone = "only screen and (max-device-width: 480px)";

	// MatchMedias
	var checkTouch = window.matchMedia(isTouch);
	var checkDesktop = window.matchMedia(isDesktop);
	var checkDeviceMobile = window.matchMedia(isSmartphone);


	// Gerätespezifische Tests
	if (checkDesktop.matches && !checkTouch.matches) {
		// Hat eine Maus und kein Touch == Desktop
		DEV_LOG1 += "> STYLE: Desktop\n";
		DEVICE['type'] = "desktop";


	} else if (checkTouch.matches) {
		// Hat Touch == Tablet oder Smartphone oder ähnlich
		DEV_LOG1 += "> STYLE: Touchscreen\n";
		DEVICE['touch'] = true;

		if (checkDeviceMobile.matches) {
			DEV_LOG1 += " - Smartphone\n";
			DEVICE['type'] = "mobile";
		} else {
			DEV_LOG1 += " - Tablet\n";
			DEVICE['type'] = "tablet";
		}

	} else {
		// nicht unterstützt (z.B. FireFox auf Desktop/Tablet/Smartphone)
		DEV_LOG1 += "> STYLE: unsupported\n";
		DEVICE['type'] = "unknown";
	}


	DEV_LOG1 += "> STYLE: Pixel-Width " + window.innerWidth;

	var devlog_container = document.getElementById("dev_info1");
	console.log("IDENTIFY:", DEV_LOG1);
	if (devlog_container) { devlog_container.innerHTML = DEV_LOG1; }

	// Shims und Caches hinterlegen
	checkIDBShim(function () {
		console.log("IDENTIFY: (idb) starte Callback");
		checkES6();

		// Einstellungen laden
		prepareDevice();
	}
	);
}
