"use strict";
// esLint Globals:
/* globals touchScroller touchSlider noTouchThisSlider */

// Design- und Funktionsanpassung für die verschiedenen Geräte
var DEV_LOG1 = "";
var DEVICE;
var STYLES = [
	"/css/basic.css",
	"/css/main.css",
	"/css/popup.css",
	"/css/button.css",
];
var STYLES_EXPORT = [
	"/css/basic.css",
	"/css/popup.css",
	"/css/button.css",
	"/css/export.css",
];


var GLOBALS = {
	'ONLINE' : null,
	'AUTH': null,
	'PRO': null,
	'UNLIMITED' : null,
	'userID': null,
	'passW': null,
	'SyncServer': "c/api",
	'timeout': 20000,
	'unlimited_dates': ["2099-01-01", "2098-01-01"],

	'appversion': "2.1",
	'up2date': true,
	'dbname': null,
	'dbversion': null,
	'dbToGo': null,
	'dbFinished': null,
	'noSyncCols': null,

	'klasse': null,
	'klassenbezeichnung': null,
	'k-string-len' : 10,

	'device': null,
	'knownDevice': null,
	'perfStart': null,
	'perfEnd': null,
	'deferredPrompt': null,
};


var needToCache = [
	'/',
	'index.htm',
	'/index.htm',
	'/settings.htm',
	'/uebersicht.htm',
	'/details_leistungen.htm',
	'/details_students.htm',
	'/export.htm',
	'/css/basic.css',
	'/css/button.css',
	'/css/export.css',
	'/css/flatpickr.min.css',
	'/css/main.css',
	'/css/plot.css',
	'/css/popup.css',
	'/css/phone.css',
	'/img/back_tisch.jpg',
	'/img/DropDown.png',
	'/img/lupe_klein.gif',
	'/img/no_entry.png',
	'/img/noten.gif',
	'/img/punkte.gif',
	'/img/reload_button.gif',
	'/img/rohpunkte.gif',
	'/img/slider.png',
	'/img/switch.gif',
	'/favicon.ico',
	'/favicon/favicon-16x16.png',
	'/favicon/favicon-32x32.png',
	'/favicon/favicon-96x96.png',
	'/favicon/favicon.ico',
	'/favicon/apple-icon.png',
	'/apple-touch-icon.png',
	'/apple-touch-startup-image-748x1024.png',
	'/apple-touch-startup-image-768x1004.png',
	'/favicon/apple-icon-precomposed.png',
	'/favicon/android-icon-36x36.png',
	'/favicon/android-icon-48x48.png',
	'/favicon/android-icon-72x72.png',
	'/favicon/android-icon-96x96.png',
	'/favicon/android-icon-144x144.png',
	'/favicon/android-icon-192x192.png',
	'/favicon/apple-icon-114x114.png',
	'/favicon/apple-icon-120x120.png',
	'/favicon/apple-icon-144x144.png',
	'/favicon/apple-icon-152x152.png',
	'/favicon/apple-icon-180x180.png',
	'/favicon/apple-icon-57x57.png',
	'/favicon/apple-icon-60x60.png',
	'/favicon/apple-icon-72x72.png',
	'/favicon/apple-icon-76x76.png',
	'/favicon/icon-512x512.png',
	'/js/all.js',
	'/js/database.js',
	'/js/details_leistungen.js',
	'/js/details_students.js',
	'/js/export.js',
	'/js/index.js',
	'/js/identify.js',
	'/js/settings.js',
	'/js/uebersicht.js',
	'/js/stay.js',
	'/js/sync.js',
	'/js/touch.js',
	'/js/frameworks/crypto-js/aes.js',
	'/js/frameworks/crypto-js/sha1.js',
	'/js/frameworks/jsflot/jquery.flot.min.js',
	'/js/frameworks/jsflot/jquery.flot.pie.min.js',
	'/js/frameworks/jsflot/jquery.flot.categories.min.js',
	'/js/frameworks/jsflot/jquery.flot.valuelabels.js',
	'/js/frameworks/babel_polyfill.min.js',
	'/js/frameworks/flatpickr.min.js',
	'/js/frameworks/indexeddbshim.min.js',
	'/js/frameworks/indexeddbshim-ios9.pack.js',
	'/js/frameworks/jquery.min.js',
];


// TODO: ES6 Tests



// Feature detection

// -- IndexedDB (Stores)
function checkIDBShim(callback) {

	if (!window.indexedDB && !window.mozIndexedDB && !window.webkitIndexedDB && !window.msIndexedDB) {
		console.log("IDENTIFY: (idb) Feature Error !");
		DEVICE['noidx'] = true;
		callback();
		return
	}

	//> From: https://bl.ocks.org/nolanlawson/8a2ead46a184c9fae231
	var req = indexedDB.open('test', 1);

	req.onupgradeneeded = function (e) {
		var db = e.target.result;
		var one = db.createObjectStore('one', {
			keyPath: 'key'
		});
		var two = db.createObjectStore('two', {
			keyPath: 'key'
		});
		var idx = two.createIndex("typ", "typ", { unique: false });

	};

	req.onerror = function (e) {
		console.log("IDENTIFY: (idb) Error opening IndexedDB", e);
		DEVICE['noidx'] = true;
		callback();
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

			var req = tx.objectStore('two').put(
				{
				'key': new Date().valueOf(),
				'typ': 'testing',
				'val': '01234',
				}
			);
			// Put Testdaten
			req.onsuccess = function(){
				tx.objectStore('two').put(
					{
						'key': new Date().valueOf(),
						'typ': 'testing',
						'val': '56789',
					}
				);
			}
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

// -- IndexedDB (Cursor)
function checkIDBCursorUpdate(callback){
	if (DEVICE['noidx']) {
		DEVICE['nocur'] = false
		callback();
	}else{
		var req = indexedDB.open('test', 1);

		req.onsuccess = function (event) {
			var connection = event.target.result;
			var oStore = connection.transaction(['two'], 'readwrite').objectStore('two');

			// Typ einschränken
			var idxTyp = oStore.index("typ");
			var keyRange = IDBKeyRange.only("testing");
			var transaction = idxTyp.openCursor(keyRange);

			var toGo = 2; // mindestens 2 Testeinträge vorhanden
			var i = 0;

			transaction.onerror = function(e){
				console.log("IDENTIFY: (idb) Error opening IDB Cursor");
			};
			transaction.onsuccess = function (event) {
				var cursor = event.target.result;
				if (cursor) {
					var key = cursor.value.key;
					var toUpdate = cursor.value;
					toUpdate.val = "1111";
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function (r) {
						console.log("IDENTIFY: (idb) Cursor update für ", r.target.result);
						i++;
					};
					cursor.continue();
				}else{
					// checken, ob alle geupdated wurden...
					if (i >= toGo) {
						console.log("IDENTIFY: (idb) Cursor update test PASSED !");
						DEVICE['nocur'] = false;
					}else{
						console.log("IDENTIFY: (idb) Cursor update test FAILED ! (", i, "von", toGo, ")");
						DEVICE['nocur'] = true;
					}
					callback();
				}
			}
		};

	}
}

// -- ES 6
function checkES6() {
	if (false) {
		DEVICE['nojs'] = true;
	} else {
		DEVICE['nojs'] = false;
	}
}


function checkInputs() {
	var testInput = document.createElement("input");
	testInput.type = "date";
	if (testInput.type != "date") {
		console.log("IDENTIFY: Polyfill Datepicker with flatpickr.js.org");
		DEVICE['nodate'] = true;
	}
	return;
}


function cleanUpIDB(callback) {
	var delReq = indexedDB.deleteDatabase("test");
	delReq.onsuccess = function (event) {
		console.log("IDENTIFY: (idb) Clean up Test DB");
		if (callback) {callback()}
	}
	delReq.onerror = function (event) {
		console.log("IDENTIFY: (idb) ERROR Clean up Test DB", event);
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

	if (DEVICE['toCache'].length > 0) {
		console.log("IDENTIFY: (sw) extending Cache", DEVICE['toCache']);
		console.log("IDENTIFY: (sw) ...not implemented !");
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
		document.getElementById('dynamicViewport').setAttribute('content', viewport + ", " + dwidth);
	}
}

// -- Buttons
function change_Buttons() {
	// Buttons wurden hier noch nicht geladen
	window.addEventListener('load', function () {
		var buttons = {
			"btn_Back"	: ["/img/mobile/power.png", false],
			"btn_Add"	: ["/img/mobile/neu1.png", "initial"],
			"btn_Delete": ["/img/mobile/delete.png", "initial"],
			"Abbrechen"	: ["/img/mobile/abort.png", "initial"],
			"Save"		: ["/img/mobile/save.png", "initial"],
			"export"	: ["/img/mobile/export.png", "initial"],
			"import"	: ["/img/mobile/import.png", "initial"],
			"btn_Settings": ["/img/mobile/settings.png", "initial"],
		};
		for (var key in buttons) {
			var oldButton = document.getElementById(key);
			if (oldButton) {
				var txt = false;
				var img = "<img src='"+buttons[key][0]+"' />";
				if (buttons[key][1] == "initial") {
					txt = oldButton.innerText;
				}else if (buttons[key][1]) {
					txt = buttons[key][1];
				}
				oldButton.innerHTML = (txt) ? img + "<br>" + txt : img;
			}
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

// -- Add Cache-iFrame
function passIframe() {
	var iframe = document.createElement('iframe');
	iframe.style.display = 'none';
	iframe.src = 'load-appcache.htm'
	window.addEventListener('load', function () {
		document.body.appendChild(iframe);
		console.log("IDENTIFY: iFrame for AppCache loaded");
	})
}


// Apply Settings
function prepareDevice() {

	// Save to Session and GLOBALS
	console.log("IDENTIFY: (prepare) Device is:", DEVICE);
	localStorage.setItem("DEVICE", JSON.stringify(DEVICE));
	GLOBALS['device'] = DEVICE['type'];

	// Type export ?
	var device_type = (window.location.pathname.indexOf("export.htm") >= 0) ? "export" : DEVICE['type'];

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
				var loadedSHIM = window.shimIndexedDB.__useShim();
				if (loadedSHIM == false) {
					alert("Eine Datenbank konnte in deinem Browser nicht initialisiert werden.\nEr ist entweder veraltet oder läuft im Privaten Modus, bei dem Daten nicht gespeichert werden dürfen.\nWechsle den Browser um TeacherTab verwenden zu können.");
				}else{
					//window.shimIndexedDB.__debug(true);
					window.SHIMindexedDB = window.shimIndexedDB;
				}
			});
		});
	}

	// Dynamic Update-Cursor possible ?
	GLOBALS['no_cursor_update'] = (!DEVICE['noidx'] && DEVICE['nocur']);


	// JS Shim
	if (DEVICE['nojs'] && !DEVICE['noidx']) { passJs("/js/frameworks/babel_polyfill.min.js"); }

	// Inputs Shim
	if (DEVICE['nodate']) {
		passCss("/css/flatpickr.min.css");
		passJs("/js/frameworks/flatpickr.min.js", function(){
				GLOBALS['flatpickr'] = flatpickr('[type="date"]', {
					altInput: true,
					altFormat: "j. F Y",
					dateFormat: "Y-m-d",
					defaultDate: "today",
				});
		})
	}

	// Orientation / Seitenverhältnisse
	if (DEVICE['type'] == 'tablet') {

		var isLandscape = "(orientation: landscape)";
		var checkOrientation = window.matchMedia(isLandscape);

		handle_orientation_landscape(checkOrientation);
		checkOrientation.addListener(handle_orientation_landscape);

	} else if (DEVICE['type'] == 'mobile') {
		handle_orientation_landscape(false);
	}


	// Touch Listener
	if (DEVICE['touch'] && device_type != "export") {

		// add Touchscreen Handlers
		passJs("/js/touch.js", function () {
			touchScroller();
			touchSlider();
			noTouchThisSlider(); // touch-friendly-Buttons
		});

	}

	// Scripts und CSS (Ausnahme: Export.htm)
	switch (device_type) {
	case "mobile":
		// Lade CSS und Buttons für Smartphone
		STYLES.push("/css/phone.css");
		change_Buttons();
		break;

	case "tablet":
		// Lade CSS und Buttons für Tablet
		STYLES.push("/css/media.css");
		break;
	
	case "export":
		STYLES = STYLES_EXPORT;
		break;

	default: // Desktop
		STYLES.push("/css/media.css");
		break;
	}

	for (var index = 0; index < STYLES.length; index++) {
		passCss(STYLES[index]);
	}

	// Cache
	/*TODO: vorerst wird alles (zuviel gecached... issue #49) */
	//extendCache();
	
	// activate and load Service Worker
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('/sw.js', { scope: '.' })
			.then(function () { console.log("IDENTIFY: (sw) Service Worker Registered"); })
			.catch(function (err) { console.log("IDENTIFY: Error, Service Worker failed to register !", err); });
	} else {
		console.log("IDENTIFY: (sw) Service Worker werden nicht unterstützt ! - Fallback zu cache.manifest...");
		passIframe();
	}
}




// Run tests if DEVICE unknown
var fromStore = localStorage.getItem("DEVICE");
DEVICE = (fromStore) ? JSON.parse(fromStore) : false;

if (DEVICE && DEVICE.appversion == GLOBALS.appversion) {

	// no tests
	extendCache();
	prepareDevice();

} else {

	DEVICE = {};
	DEVICE['toCache'] = [];
	DEVICE['appversion'] = GLOBALS.appversion;

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
	console.log("IDENTIFY:\n", DEV_LOG1);
	if (devlog_container) { devlog_container.innerHTML = DEV_LOG1; }

	// Shims und Caches hinterlegen
	checkIDBShim(function () {
		console.log("IDENTIFY: (idb) starte Callback 1");
		checkIDBCursorUpdate(function(){
			console.log("IDENTIFY: (idb) starte Callback 2");
			checkES6();
			checkInputs();

			// Einstellungen laden
			prepareDevice();
			if (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) {
				cleanUpIDB();
			}
		})
	});
}
