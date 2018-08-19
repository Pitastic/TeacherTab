// Caching: find . -type f | grep -v "\.git\|README\.md\|sw\.js\|\.manifest" | sort -u
//
// Cache with Wildcard ?
// Cache auch ohne Install (bei Desktop)
// Cache-Policy
//

var CACHE = "tt_webapp";

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE).then(function(cache) {
			var needToCache = [
				'/apple-touch-icon.png',
				'/apple-touch-startup-image-748x1024.png',
				'/apple-touch-startup-image-768x1004.png',
				'/css/basic.css',
				'/css/button.css',
				'/css/export.css',
				'/css/main.css',
				'/css/phone.css',
				'/css/plot.css',
				'/css/popup.css',
				'/css/tablet.css',
				'/details_leistungen.htm',
				'/details_students.htm',
				'/export_html.htm',
				'/export_json.htm',
				'/favicon/android-icon-144x144.png',
				'/favicon/android-icon-192x192.png',
				'/favicon/android-icon-36x36.png',
				'/favicon/android-icon-48x48.png',
				'/favicon/android-icon-72x72.png',
				'/favicon/android-icon-96x96.png',
				'/favicon/apple-icon-114x114.png',
				'/favicon/apple-icon-120x120.png',
				'/favicon/apple-icon-144x144.png',
				'/favicon/apple-icon-152x152.png',
				'/favicon/apple-icon-180x180.png',
				'/favicon/apple-icon-57x57.png',
				'/favicon/apple-icon-60x60.png',
				'/favicon/apple-icon-72x72.png',
				'/favicon/apple-icon-76x76.png',
				'/favicon/apple-icon.png',
				'/favicon/apple-icon-precomposed.png',
				'/favicon/favicon-16x16.png',
				'/favicon/favicon-32x32.png',
				'/favicon/favicon-96x96.png',
				'/favicon/favicon.ico',
				'/favicon/icon-512x512.png',
				'/favicon.ico',
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
				'/index.htm',
				'/js/all.js',
				'/js/crypto-js-v3.1.2/components/aes.js',
				'/js/crypto-js-v3.1.2/components/aes-min.js',
				'/js/crypto-js-v3.1.2/components/cipher-core.js',
				'/js/crypto-js-v3.1.2/components/cipher-core-min.js',
				'/js/crypto-js-v3.1.2/components/core.js',
				'/js/crypto-js-v3.1.2/components/core-min.js',
				'/js/crypto-js-v3.1.2/components/enc-base64.js',
				'/js/crypto-js-v3.1.2/components/enc-base64-min.js',
				'/js/crypto-js-v3.1.2/components/enc-utf16.js',
				'/js/crypto-js-v3.1.2/components/enc-utf16-min.js',
				'/js/crypto-js-v3.1.2/components/evpkdf.js',
				'/js/crypto-js-v3.1.2/components/evpkdf-min.js',
				'/js/crypto-js-v3.1.2/components/format-hex.js',
				'/js/crypto-js-v3.1.2/components/format-hex-min.js',
				'/js/crypto-js-v3.1.2/components/hmac.js',
				'/js/crypto-js-v3.1.2/components/hmac-min.js',
				'/js/crypto-js-v3.1.2/components/lib-typedarrays.js',
				'/js/crypto-js-v3.1.2/components/lib-typedarrays-min.js',
				'/js/crypto-js-v3.1.2/components/md5.js',
				'/js/crypto-js-v3.1.2/components/md5-min.js',
				'/js/crypto-js-v3.1.2/components/mode-cfb.js',
				'/js/crypto-js-v3.1.2/components/mode-cfb-min.js',
				'/js/crypto-js-v3.1.2/components/mode-ctr-gladman.js',
				'/js/crypto-js-v3.1.2/components/mode-ctr-gladman-min.js',
				'/js/crypto-js-v3.1.2/components/mode-ctr.js',
				'/js/crypto-js-v3.1.2/components/mode-ctr-min.js',
				'/js/crypto-js-v3.1.2/components/mode-ecb.js',
				'/js/crypto-js-v3.1.2/components/mode-ecb-min.js',
				'/js/crypto-js-v3.1.2/components/mode-ofb.js',
				'/js/crypto-js-v3.1.2/components/mode-ofb-min.js',
				'/js/crypto-js-v3.1.2/components/pad-ansix923.js',
				'/js/crypto-js-v3.1.2/components/pad-ansix923-min.js',
				'/js/crypto-js-v3.1.2/components/pad-iso10126.js',
				'/js/crypto-js-v3.1.2/components/pad-iso10126-min.js',
				'/js/crypto-js-v3.1.2/components/pad-iso97971.js',
				'/js/crypto-js-v3.1.2/components/pad-iso97971-min.js',
				'/js/crypto-js-v3.1.2/components/pad-nopadding.js',
				'/js/crypto-js-v3.1.2/components/pad-nopadding-min.js',
				'/js/crypto-js-v3.1.2/components/pad-zeropadding.js',
				'/js/crypto-js-v3.1.2/components/pad-zeropadding-min.js',
				'/js/crypto-js-v3.1.2/components/pbkdf2.js',
				'/js/crypto-js-v3.1.2/components/pbkdf2-min.js',
				'/js/crypto-js-v3.1.2/components/rabbit.js',
				'/js/crypto-js-v3.1.2/components/rabbit-legacy.js',
				'/js/crypto-js-v3.1.2/components/rabbit-legacy-min.js',
				'/js/crypto-js-v3.1.2/components/rabbit-min.js',
				'/js/crypto-js-v3.1.2/components/rc4.js',
				'/js/crypto-js-v3.1.2/components/rc4-min.js',
				'/js/crypto-js-v3.1.2/components/ripemd160.js',
				'/js/crypto-js-v3.1.2/components/ripemd160-min.js',
				'/js/crypto-js-v3.1.2/components/sha1.js',
				'/js/crypto-js-v3.1.2/components/sha1-min.js',
				'/js/crypto-js-v3.1.2/components/sha224.js',
				'/js/crypto-js-v3.1.2/components/sha224-min.js',
				'/js/crypto-js-v3.1.2/components/sha256.js',
				'/js/crypto-js-v3.1.2/components/sha256-min.js',
				'/js/crypto-js-v3.1.2/components/sha384.js',
				'/js/crypto-js-v3.1.2/components/sha384-min.js',
				'/js/crypto-js-v3.1.2/components/sha3.js',
				'/js/crypto-js-v3.1.2/components/sha3-min.js',
				'/js/crypto-js-v3.1.2/components/sha512.js',
				'/js/crypto-js-v3.1.2/components/sha512-min.js',
				'/js/crypto-js-v3.1.2/components/tripledes.js',
				'/js/crypto-js-v3.1.2/components/tripledes-min.js',
				'/js/crypto-js-v3.1.2/components/x64-core.js',
				'/js/crypto-js-v3.1.2/components/x64-core-min.js',
				'/js/crypto-js-v3.1.2/rollups/aes.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-md5.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-ripemd160.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha1.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha224.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha256.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha384.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha3.js',
				'/js/crypto-js-v3.1.2/rollups/hmac-sha512.js',
				'/js/crypto-js-v3.1.2/rollups/md5.js',
				'/js/crypto-js-v3.1.2/rollups/pbkdf2.js',
				'/js/crypto-js-v3.1.2/rollups/rabbit.js',
				'/js/crypto-js-v3.1.2/rollups/rabbit-legacy.js',
				'/js/crypto-js-v3.1.2/rollups/rc4.js',
				'/js/crypto-js-v3.1.2/rollups/ripemd160.js',
				'/js/crypto-js-v3.1.2/rollups/sha1.js',
				'/js/crypto-js-v3.1.2/rollups/sha224.js',
				'/js/crypto-js-v3.1.2/rollups/sha256.js',
				'/js/crypto-js-v3.1.2/rollups/sha384.js',
				'/js/crypto-js-v3.1.2/rollups/sha3.js',
				'/js/crypto-js-v3.1.2/rollups/sha512.js',
				'/js/crypto-js-v3.1.2/rollups/tripledes.js',
				'/js/database.js',
				'/js/details_leistungen.js',
				'/js/details_students.js',
				'/js/export.js',
				'/jsflot/excanvas.js',
				'/jsflot/excanvas.min.js',
				'/jsflot/jquery.colorhelpers.js',
				'/jsflot/jquery.colorhelpers.min.js',
				'/jsflot/jquery.flot.canvas.js',
				'/jsflot/jquery.flot.canvas.min.js',
				'/jsflot/jquery.flot.categories.js',
				'/jsflot/jquery.flot.categories.min.js',
				'/jsflot/jquery.flot.crosshair.js',
				'/jsflot/jquery.flot.crosshair.min.js',
				'/jsflot/jquery.flot.errorbars.js',
				'/jsflot/jquery.flot.errorbars.min.js',
				'/jsflot/jquery.flot.fillbetween.js',
				'/jsflot/jquery.flot.fillbetween.min.js',
				'/jsflot/jquery.flot.image.js',
				'/jsflot/jquery.flot.image.min.js',
				'/jsflot/jquery.flot.js',
				'/jsflot/jquery.flot.min.js',
				'/jsflot/jquery.flot.navigate.js',
				'/jsflot/jquery.flot.navigate.min.js',
				'/jsflot/jquery.flot.pie.js',
				'/jsflot/jquery.flot.pie.min.js',
				'/jsflot/jquery.flot.resize.js',
				'/jsflot/jquery.flot.resize.min.js',
				'/jsflot/jquery.flot.selection.js',
				'/jsflot/jquery.flot.selection.min.js',
				'/jsflot/jquery.flot.stack.js',
				'/jsflot/jquery.flot.stack.min.js',
				'/jsflot/jquery.flot.symbol.js',
				'/jsflot/jquery.flot.symbol.min.js',
				'/jsflot/jquery.flot.threshold.js',
				'/jsflot/jquery.flot.threshold.min.js',
				'/jsflot/jquery.flot.time.js',
				'/jsflot/jquery.flot.time.min.js',
				'/jsflot/jquery.flot.valuelabels.js',
				'/js/index.js',
				'/js/jquery-3.3.1.min.js',
				'/js/settings.js',
				'/js/stay.js',
				'/js/sync.js',
				'/js/touch.js',
				'/js/uebersicht.js',
				'/settings.htm',
				'/sw.js',
				'/uebersicht.htm',
			];
			for (var i = needToCache.length - 1; i >= 0; i--) {
				console.log("SW: ...caching", needToCache[i]);
				cache.add( needToCache[i] )
				.catch(function(err) { console.log("SW: Fehler beim Cachen", err) });
			}
		})
	);
});

self.addEventListener('fetch', function(event) {
	console.log("Mode:", event.request.mode, (event.request.mode === 'navigate'));
	// Network-First-Policy
	/*
	event.respondWith(
		// Ressource anfragen
		tryNetwork(evt.request, 400)
		.then(function (response) {
			// Update Cache weil online
			// (wird hier 'response' richtig weitergegeben?)
			cache.open(CACHE)
			.then(funtion(cache){
				cache.put(event.request, response.clone());
				return response;
			})
			.catch(function(){
				console.log("SW: Cache", CACHE, "unerreichbar für Updates!");
				return response;
			})
		}
		.catch(function () {
			// Ressource aus Cache raussuchen, weil offline/timeout
			return fromCache(evt.request);
		})
	);
	*/
	event.respondWith(fetch(event.request));
});

/*
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});


function fromCache(request) {
	return caches.open(CACHE).then(function (cache) {
		return cache.match(request).then(function (matching) {
			return matching || Promise.reject('no-match');
		});
	});
}

function update(request) {
	return caches.open(CACHE).then(function (cache) {
		return fetch(request).then(function (response) {
			return cache.put(request, response);
		});
	});
}
*/

function tryNetwork(request, timeout){
	return new Promise(function (fulfill, reject) {
		var timeoutId = setTimeout(reject, timeout);
		fetch(request).then(function (response) {
			clearTimeout(timeoutId);
			// ...update Cache
			// ...
			// return Ressource
			fulfill(response);
		}, reject);
	});
}
