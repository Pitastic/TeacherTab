// Caching: find . -type f | grep -v "\.git\|README\.md\|sw\.js\|\.manifest" | sort -u
//
// Cache with Wildcard ?
// Cache auch ohne Install (bei Desktop)
// Cache-Policy
//

var CACHE = "tt_webapp_v1";
var needToCache = [
	'/',
	'index.htm',
	'/index.htm',
	'/settings.htm',
	'/uebersicht.htm',
	'/details_leistungen.htm',
	'/details_students.htm',
	'/export_html.htm',
	'/export_json.htm',
	'/css/basic.css',
	'/css/button.css',
	'/css/export.css',
	'/css/main.css',
	'/css/phone.css',
	'/css/plot.css',
	'/css/popup.css',
	'/css/tablet.css',
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
	'/js/mobile.js',
	'/js/settings.js',
	'/js/stay.js',
	'/js/sync.js',
	'/js/touch.js',
	'/js/uebersicht.js',
	'/js/jquery-3.3.1.min.js',
	'/js/crypto-js-v3.1.2/rollups/aes.js',
	'/js/crypto-js-v3.1.2/rollups/sha1.js',
	'/jsflot/jquery.flot.min.js',
	'/jsflot/jquery.flot.pie.min.js',
	'/jsflot/jquery.flot.categories.min.js',
	'/jsflot/jquery.flot.valuelabels.js'
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE).then(function(cache) {
			for (var i = needToCache.length - 1; i >= 0; i--) {
				console.log("SW: ...caching ( von", needToCache.length, ")");
				cache.add( needToCache[i] )
				.catch(function(err) { console.log("SW: Fehler beim Cachen von", needToCache[i], err) });
			}
		})
	);
});

self.addEventListener('fetch', function(event) {
	//DEV console.log("SW: Looking for", event.request.url);
	// Network-First-Policy
	// nur Request nach Ressourcen abfangen (kein CGI)
	if (event.request.mode != "cors") {
		event.respondWith(
			// Ressource anfragen
			tryNetwork(event.request, 1000)
			// Offline oder Timeout
			.catch(function (request) {
				// Ressource aus Cache raussuchen, weil offline/timeout
				//DEV console.log("SW: Not in the Web, Lookup im Cache...");
				return fromCache(event.request).catch( function(err){
					//DEV console.log("SW: Not in Cache nor the Web:", err);
					return false;
				});
			})
		);
	}
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
			cacheNames.filter(function(cacheName) {
				// alte Caches löschen
				return (cacheName != CACHE);
			})
			.map(function(cacheName) {
				return caches.delete(cacheName);
			})
			);
		})
	);
});

function fromCache(request) {
	//DEV console.log("SW: Serving from Cache", request);
	return caches.open(CACHE).then(function (cache) {
		return cache.match(request).then(function (matching) {
			return matching || Promise.reject('no-match');
		});
	});
}


function tryNetwork(request, timeout){
	var promise = new Promise(function(resolve, reject){
		var timeoutId = setTimeout(function(){
			console.log("SW: Timed out:", request.url);
			reject(request);
		}, timeout);
		fetch(request).then(function (response) {
			clearTimeout(timeoutId);
			// ...update Cache
			caches.open(CACHE)
			.then(function(cache){
				var cacheResponse = response.clone();
				cache.put(request, cacheResponse);
				//DEV console.log("SW: Fullfilling", request.url);
				resolve(response); // ...response
			})
			.catch(function(err) {
				console.log("SW: Cache-Error", response.clone().url, err, "fullfilling anyway...")
				resolve(response); // ...response mit Cache-Fail
			})
		})
		.catch(function(){
			console.log("SW: Fetch-Error:", request.url);
			reject(request);
		});
	})
	return promise;
}
