var CACHE = "tt_webapp_v1_5";
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
	'/img/back_tisch.jpg',
	'/img/DropDown.png',
	'/img/lupe_klein.gif',
	'/img/no_entry.png',
	'/img/noten.gif',
	'/img/punkte.gif',
	'/img/reload_button.gif',
	'/img/rohpunkte.gif',
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
	'/js/frameworks/crypto-js/aes.js',
	'/js/frameworks/crypto-js/sha1.js',
	'/js/frameworks/jsflot/jquery.flot.min.js',
	'/js/frameworks/jsflot/jquery.flot.pie.min.js',
	'/js/frameworks/jsflot/jquery.flot.categories.min.js',
	'/js/frameworks/jsflot/jquery.flot.valuelabels.js',
	'/js/frameworks/jquery.min.js',
];


self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE).then(function(cache) {
			needToCache.map(function(toCache){
				cache.add( toCache )
				.catch(function(err) { console.log("SW: Fehler beim Cachen von", toCache, err); });
			});
		})
		.then(function(cache){
			caches.keys().then(function(keyList) {
				keyList.map(function(item){
					if (item != CACHE) {
						caches.delete(item)
						.then(function(r){
							console.log("SW: Cache gelöscht:", item, r);
						})
						.catch(function(r){
							console.log("SW: Fehler beim Löschen des Cache:", item, r);
						})
					}else{
						console.log("SW: Cache auslassen:", item);
					}
				});
			})
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
		fetch(request)
		.then(function (response) {
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
