"use strict";var DEV_LOG1="";var DEVICE;var STYLES=["/css/basic.css","/css/main.css","/css/popup.css","/css/button.css"];var STYLES_EXPORT=["/css/basic.css","/css/popup.css","/css/button.css","/css/export.css"];var GLOBALS={"AUTH":null,"PRO":null,"userID":null,"passW":null,"SyncServer":"c/api","timeout":6000,"unlimited":["2099-01-01","2098-01-01"],"appversion":"1.0.3","up2date":true,"dbname":null,"dbversion":null,"dbToGo":null,"dbFinished":null,"noSyncCols":null,"klasse":null,"klassenbezeichnung":null,"k-string-len":10,"device":null,"knownDevice":null,"perfStart":null,"perfEnd":null,"deferredPrompt":null};var needToCache=["/","index.htm","/index.htm","/settings.htm","/uebersicht.htm","/details_leistungen.htm","/details_students.htm","/export.htm","/css/basic.css","/css/button.css","/css/export.css","/css/main.css","/css/plot.css","/css/popup.css","/css/phone.css","/img/back_tisch.jpg","/img/DropDown.png","/img/lupe_klein.gif","/img/no_entry.png","/img/noten.gif","/img/punkte.gif","/img/reload_button.gif","/img/rohpunkte.gif","/img/slider.png","/img/switch.gif","/favicon.ico","/favicon/favicon-16x16.png","/favicon/favicon-32x32.png","/favicon/favicon-96x96.png","/favicon/favicon.ico","/favicon/apple-icon.png","/apple-touch-icon.png","/apple-touch-startup-image-748x1024.png","/apple-touch-startup-image-768x1004.png","/favicon/apple-icon-precomposed.png","/favicon/android-icon-36x36.png","/favicon/android-icon-48x48.png","/favicon/android-icon-72x72.png","/favicon/android-icon-96x96.png","/favicon/android-icon-144x144.png","/favicon/android-icon-192x192.png","/favicon/apple-icon-114x114.png","/favicon/apple-icon-120x120.png","/favicon/apple-icon-144x144.png","/favicon/apple-icon-152x152.png","/favicon/apple-icon-180x180.png","/favicon/apple-icon-57x57.png","/favicon/apple-icon-60x60.png","/favicon/apple-icon-72x72.png","/favicon/apple-icon-76x76.png","/favicon/icon-512x512.png","/js/all.js","/js/database.js","/js/details_leistungen.js","/js/details_students.js","/js/export.js","/js/index.js","/js/identify.js","/js/settings.js","/js/uebersicht.js","/js/stay.js","/js/sync.js","/js/touch.js","/js/frameworks/crypto-js/aes.js","/js/frameworks/crypto-js/sha1.js","/js/frameworks/jsflot/jquery.flot.min.js","/js/frameworks/jsflot/jquery.flot.pie.min.js","/js/frameworks/jsflot/jquery.flot.categories.min.js","/js/frameworks/jsflot/jquery.flot.valuelabels.js","/js/frameworks/jquery.min.js","/js/frameworks/babel_polyfill.min.js","/js/frameworks/indexeddbshim.min.js","/js/frameworks/indexeddbshim-ios9.pack.js"];function checkIDBShim(callback){if(!window.indexedDB){console.log("IDENTIFY: (idb) Feature Error !");DEVICE["noidx"]=true;callback();return}var req=indexedDB.open("test",1);req.onupgradeneeded=function(e){var db=e.target.result;var one=db.createObjectStore("one",{keyPath:"key"});var two=db.createObjectStore("two",{keyPath:"key"});var idx=two.createIndex("typ","typ",{unique:false})};req.onerror=function(e){console.log("IDENTIFY: (idb) Error opening IndexedDB",e);DEVICE["noidx"]=true;callback()};req.onsuccess=function(e){var db=e.target.result;var tx;try{tx=db.transaction(["one","two"],"readwrite");tx.oncomplete=function(e){console.log("IDENTIFY: (idb) Passed !");DEVICE["noidx"]=false;db.close();callback()};var req=tx.objectStore("two").put({"key":new Date().valueOf(),"typ":"testing","val":"01234"});req.onsuccess=function(){tx.objectStore("two").put({"key":new Date().valueOf(),"typ":"testing","val":"56789"})};req.onerror=function(e){}}catch(err){console.log("IDENTIFY: (idb) Error opening two stores at once (buggy implementation)");DEVICE["noidx"]="ios9";db.close();callback()}}}function checkIDBCursorUpdate(callback){if(DEVICE["noidx"]){DEVICE["nocur"]=false;return true}else{var req=indexedDB.open("test",1);req.onsuccess=function(event){var connection=event.target.result;var oStore=connection.transaction(["two"],"readwrite").objectStore("two");var idxTyp=oStore.index("typ");var keyRange=IDBKeyRange.only("testing");var transaction=idxTyp.openCursor(keyRange);var toGo=2;var i=0;transaction.onerror=function(e){console.log("IDENTIFY: (idb) Error opening IDB Cursor")};transaction.onsuccess=function(event){var cursor=event.target.result;if(cursor){var key=cursor.value.key;var toUpdate=cursor.value;toUpdate.val="1111";var requestUpdate=cursor.update(toUpdate);requestUpdate.onsuccess=function(r){console.log("IDENTIFY: (idb) Cursor update f\xFCr ",r.target.result);i++};cursor.continue()}else{if(i>=toGo){console.log("IDENTIFY: (idb) Cursor update test PASSED !");DEVICE["nocur"]=false}else{console.log("IDENTIFY: (idb) Cursor update test FAILED ! (",i,"von",toGo,")");DEVICE["nocur"]=true}callback()}}}}}function checkES6(){if(false){DEVICE["nojs"]=true}else{DEVICE["nojs"]=false}}function cleanUpIDB(callback){var delReq=indexedDB.deleteDatabase("test");delReq.onsuccess=function(event){console.log("IDENTIFY: (idb) Clean up Test DB");if(callback){callback()}};delReq.onerror=function(event){console.log("IDENTIFY: (idb) ERROR Clean up Test DB",event)}}function extendCache(){if(DEVICE["phone"]){}else if(DEVICE["tablet"]){}else if(DEVICE["desktop"]){}if(DEVICE["toCache"].length>0){console.log("IDENTIFY: (sw) extending Cache",DEVICE["toCache"]);console.log("IDENTIFY: (sw) ...not implemented !")}}function handle_orientation_landscape(evt){console.log("IDENTIFY: (style) Handle Orientation, isLandscape:",evt.matches);var viewport="initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";var dwidth="width=device-width";if(evt.matches){document.getElementById("dynamicViewport").setAttribute("content",viewport)}else{document.getElementById("dynamicViewport").setAttribute("content",viewport+" "+dwidth)}}function change_Buttons(){window.addEventListener("load",function(){var buttons={"btn_Back":["/img/mobile/power.png",false],"btn_Add":["/img/mobile/neu1.png","initial"],"btn_Delete":["/img/mobile/delete.png","initial"],"Abbrechen":["/img/mobile/abort.png","initial"],"Save":["/img/mobile/save.png","initial"],"export":["/img/mobile/export.png","initial"],"import":["/img/mobile/import.png","initial"],"btn_Settings":["/img/mobile/settings.png","initial"]};for(var key in buttons){var oldButton=document.getElementById(key);if(oldButton){var txt=false;var img="<img src='"+buttons[key][0]+"' />";if(buttons[key][1]=="initial"){txt=oldButton.innerText}else if(buttons[key][1]){txt=buttons[key][1]}oldButton.innerHTML=txt?img+"<br>"+txt:img}}})}function passCss(absolutePath){var cssId=btoa(absolutePath);if(!document.getElementById(cssId)){var link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=absolutePath;document.head.appendChild(link)}DEVICE["toCache"].push(absolutePath)}function passJs(absolutePath,entrypoint,wait){var jsId=btoa(absolutePath);if(!document.getElementById(jsId)){var script=document.createElement("script");script.type="text/javascript";script.src=absolutePath;script.id=jsId;document.head.appendChild(script);if(entrypoint&&!wait){script.onload=function(){entrypoint()}}else if(entrypoint&&wait){window.addEventListener("load",function(){entrypoint()})}}DEVICE["toCache"].push(absolutePath)}function passIframe(){var iframe=document.createElement("iframe");iframe.style.display="none";iframe.src="load-appcache.htm";window.addEventListener("load",function(){document.body.appendChild(iframe);console.log("IDENTIFY: iFrame for AppCache loaded")})}function prepareDevice(){console.log("IDENTIFY: (prepare) Device is:",DEVICE);localStorage.setItem("DEVICE",JSON.stringify(DEVICE));GLOBALS["device"]=DEVICE["type"];var device_type=window.location.pathname.indexOf("export.htm")>=0?"export":DEVICE["type"];if(DEVICE["noidx"]=="ios9"){passJs("/js/frameworks/indexeddbshim-ios9.pack.js",function(){console.log("IDENTIFY: idb-ios9-shim loaded")})}else if(DEVICE["noidx"]){passJs("/js/frameworks/babel_polyfill.min.js",function(){passJs("/js/frameworks/indexeddbshim.min.js",function(){console.log("IDENTIFY: idbshim loaded");var loadedSHIM=window.shimIndexedDB.__useShim();if(loadedSHIM==false){alert("Eine Datenbank konnte in deinem Browser nicht initialisiert werden.\nEr ist entweder veraltet oder l\xE4uft im Privaten Modus, bei dem Daten nicht gespeichert werden d\xFCrfen.\nWechsle den Browser um TeacherTab verwenden zu k\xF6nnen.")}else{window.SHIMindexedDB=window.shimIndexedDB}})})}GLOBALS["no_cursor_update"]=!DEVICE["noidx"]&&DEVICE["nocur"];if(DEVICE["nojs"]&&!DEVICE["noidx"]){passJs("/js/frameworks/babel_polyfill.min.js")}if(DEVICE["type"]=="tablet"){var isLandscape="(orientation: landscape)";var checkOrientation=window.matchMedia(isLandscape);handle_orientation_landscape(checkOrientation);checkOrientation.addListener(handle_orientation_landscape)}else if(DEVICE["type"]=="mobile"){handle_orientation_landscape(false)}if(DEVICE["touch"]&&device_type!="export"){passJs("/js/touch.js",function(){touchScroller();touchSlider();noTouchThisSlider()})}switch(device_type){case"mobile":STYLES.push("/css/phone.css");change_Buttons();break;case"tablet":STYLES.push("/css/media.css");break;case"export":STYLES=STYLES_EXPORT;break;default:STYLES.push("/css/media.css");break;}for(var index=0;index<STYLES.length;index++){passCss(STYLES[index])}if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{scope:"."}).then(function(){console.log("IDENTIFY: (sw) Service Worker Registered")}).catch(function(err){console.log("IDENTIFY: Error, Service Worker failed to register !",err)})}else{console.log("IDENTIFY: (sw) Service Worker werden nicht unterst\xFCtzt ! - Fallback zu cache.manifest...");passIframe()}}var fromStore=localStorage.getItem("DEVICE");if(fromStore){DEVICE=JSON.parse(fromStore);extendCache();prepareDevice()}else{DEVICE={};DEVICE["toCache"]=[];var isDesktop="only screen and (hover: hover)";var isTouch="only screen and (pointer:coarse)";var isSmartphone="only screen and (max-device-width: 480px)";var checkTouch=window.matchMedia(isTouch);var checkDesktop=window.matchMedia(isDesktop);var checkDeviceMobile=window.matchMedia(isSmartphone);if(checkDesktop.matches&&!checkTouch.matches){DEV_LOG1+="> STYLE: Desktop\n";DEVICE["type"]="desktop"}else if(checkTouch.matches){DEV_LOG1+="> STYLE: Touchscreen\n";DEVICE["touch"]=true;if(checkDeviceMobile.matches){DEV_LOG1+=" - Smartphone\n";DEVICE["type"]="mobile"}else{DEV_LOG1+=" - Tablet\n";DEVICE["type"]="tablet"}}else{DEV_LOG1+="> STYLE: unsupported\n";DEVICE["type"]="unknown"}DEV_LOG1+="> STYLE: Pixel-Width "+window.innerWidth;var devlog_container=document.getElementById("dev_info1");console.log("IDENTIFY:\n",DEV_LOG1);if(devlog_container){devlog_container.innerHTML=DEV_LOG1}checkIDBShim(function(){console.log("IDENTIFY: (idb) starte Callback 1");checkIDBCursorUpdate(function(){console.log("IDENTIFY: (idb) starte Callback 2");checkES6();prepareDevice();cleanUpIDB()})})}