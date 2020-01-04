var CACHE = "v2.2.1"
var needToCache = [
	'/index.htm',
	'/settings.htm',
	'/uebersicht.htm',
	'/details_leistungen.htm',
	'/details_students.htm',
	'/export.htm',
	'/css/basic.css',
	'/css/button.css',
	'/css/export.css',
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
	'/img/mobile/abort.png',
	'/img/mobile/delete.png',
	'/img/mobile/export.png',
	'/img/mobile/import.png',
	'/img/mobile/neu1.png',
	'/img/mobile/neu2.png',
	'/img/mobile/power.png',
	'/img/mobile/save.png',
	'/img/mobile/settings.png',
	'/img/mobile/switch.png',
	'/favicon.ico',
	'/favicon/favicon.ico',
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
	'/js/frameworks/jquery.min.js',
];


self.addEventListener('install', function(event) {
	self.skipWaiting();
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					// alte Caches löschen
					return (cacheName != CACHE);
				})
				.map(function(cacheName) {
					console.log("SW: Lösche Cache", cacheName);
					return caches.delete(cacheName);
				})
			);
		}) &&
		caches.open(CACHE)
		.then(function(cache){
			console.log("SW: ....caching");
			needToCache.map(function(toCache){
				cache.add( toCache )
				.catch(function(err) { console.log("SW: Fehler beim Cachen von", toCache, err); });
			});
		})
	);
});

self.addEventListener('fetch', function(event) {
	// Cache-First-Policy
	// nur Request nach Ressourcen abfangen (kein CGI)
	if (event.request.mode != "cors") {
		event.respondWith(
			// Ressource anfragen
			fromCache(event.request)
			// Nicht im Cache
			.catch(function (request) {
				return tryNetwork(event.request, 10000)
				.catch( function(err){
					console.log("SW: Not in Cache nor the Web:", err);//DEV
					return false;
				});
			})
		);
	}
});


self.addEventListener('activate', function(event) {
	console.log("SW: activated");
	// Lösche alte Caches
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return (cacheName != CACHE);
				})
				.map(function(cacheName) {
					console.log("SW: Lösche Cache", cacheName);
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
		fetch(request)
		.then(function (response) {
			clearTimeout(timeoutId);
			// ...update Cache
			caches.open(CACHE)
			.then(function(cache){
				var cacheResponse = response.clone();
				cache.put(request, cacheResponse);
				console.log("SW: Loaded from the net:", request.url);
				resolve(response); // ...response
			})
			.catch(function(err) {
				console.log("SW: Cache-Error", response.clone().url, err, "fullfilling anyway...");
				resolve(response); // ...response mit Cache-Fail
			});
		})
		.catch(function(){
			console.log("SW: Fetch-Error:", request.url);
			reject(request);
		});
	});
	return promise;
}
