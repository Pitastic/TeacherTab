"use strict";var DEV_LOG1="";var CACHE="tt_webapp_v1";var DEVICE;var STYLES=["/css/basic.css","/css/main.css","/css/popup.css","/css/button.css"];var STYLES_EXPORT=["/css/basic.css","/css/popup.css","/css/button.css","/css/export.css"];var GLOBALS={"AUTH":null,"PRO":null,"userID":null,"passW":null,"SyncServer":"c/api","timeout":6000,"unlimited":["2099-01-01","2098-01-01"],"appversion":"1.1","dbname":null,"dbversion":null,"dbToGo":null,"dbFinished":null,"noSyncCols":null,"klasse":null,"klassenbezeichnung":null,"k-string-len":10,"device":null,"knownDevice":null,"perfStart":null,"perfEnd":null,"deferredPrompt":null};function checkIDBShim(callback){var req=indexedDB.open("test",1);req.onupgradeneeded=function(e){var db=e.target.result;db.createObjectStore("one",{keyPath:"key"});db.createObjectStore("two",{keyPath:"key"})};req.onerror=function(){console.log("IDENTIFY: (idb) Error opening IndexedDB");DEVICE["noidx"]=true};req.onsuccess=function(e){var db=e.target.result;var tx;try{tx=db.transaction(["one","two"],"readwrite");tx.oncomplete=function(e){console.log("IDENTIFY: (idb) Passed !");DEVICE["noidx"]=false;db.close();callback()};var req=tx.objectStore("two").put({"key":new Date().valueOf()});req.onsuccess=function(e){};req.onerror=function(e){}}catch(err){console.log("IDENTIFY: (idb) Error opening two stores at once (buggy implementation)");DEVICE["noidx"]="ios9";db.close();callback()}}}function checkES6(){if(false){DEVICE["nojs"]=true}else{DEVICE["nojs"]=false}}function extendCache(){if(DEVICE["phone"]){}else if(DEVICE["tablet"]){}else if(DEVICE["desktop"]){}if(DEVICE["toCache"].length>0){console.log("IDENTIFY: (sw) extending Cache",DEVICE["toCache"]);console.log("IDENTIFY: (sw) ...not implemented !")}}function handle_orientation_landscape(evt){console.log("IDENTIFY: (style) Handle Orientation, isLandscape:",evt.matches);var viewport="initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";var dwidth="width=device-width";if(evt.matches){document.getElementById("dynamicViewport").setAttribute("content",viewport)}else{document.getElementById("dynamicViewport").setAttribute("content",viewport+" "+dwidth)}}function change_Buttons(){window.addEventListener("load",function(){var buttons={"btn_Back":["/img/mobile/power.png",false],"btn_Add":["/img/mobile/neu1.png","initial"],"btn_Delete":["/img/mobile/delete.png","initial"],"Abbrechen":["/img/mobile/abort.png","initial"],"Save":["/img/mobile/save.png","initial"],"export":["/img/mobile/export.png","initial"],"import":["/img/mobile/import.png","initial"],"btn_Settings":["/img/mobile/settings.png","initial"]};for(var key in buttons){var oldButton=document.getElementById(key);if(oldButton){var txt=false;var img="<img src='"+buttons[key][0]+"' />";if(buttons[key][1]=="initial"){txt=oldButton.innerText}else if(buttons[key][1]){txt=buttons[key][1]}oldButton.innerHTML=txt?img+"<br>"+txt:img}}})}function passCss(absolutePath){var cssId=btoa(absolutePath);if(!document.getElementById(cssId)){var link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=absolutePath;document.head.appendChild(link)}DEVICE["toCache"].push(absolutePath)}function passJs(absolutePath,entrypoint,wait){var jsId=btoa(absolutePath);if(!document.getElementById(jsId)){var script=document.createElement("script");script.type="text/javascript";script.src=absolutePath;script.id=jsId;document.head.appendChild(script);if(entrypoint&&!wait){script.onload=function(){entrypoint()}}else if(entrypoint&&wait){window.addEventListener("load",function(){entrypoint()})}}DEVICE["toCache"].push(absolutePath)}function prepareDevice(){console.log("IDENTIFY: (prepare) Device is:",DEVICE);localStorage.setItem("DEVICE",JSON.stringify(DEVICE));GLOBALS["device"]=DEVICE["type"];var device_type=window.location.pathname.indexOf("export.htm")>=0?"export":DEVICE["type"];if(DEVICE["noidx"]=="ios9"){passJs("/js/frameworks/indexeddbshim-ios9.pack.js",function(){console.log("IDENTIFY: idb-ios9-shim loaded")})}else if(DEVICE["noidx"]){passJs("/js/frameworks/babel_polyfill.min.js",function(){passJs("/js/frameworks/indexeddbshim.min.js",function(){console.log("IDENTIFY: idbshim loaded");window.shimIndexedDB.__useShim();window.shimIndexedDB.__debug(true);window.SHIMindexedDB=window.shimIndexedDB})})}if(DEVICE["nojs"]&&!DEVICE["noidx"]){passJs("/js/frameworks/babel_polyfill.min.js")}if(DEVICE["type"]=="tablet"){var isLandscape="(orientation: landscape)";var checkOrientation=window.matchMedia(isLandscape);handle_orientation_landscape(checkOrientation);checkOrientation.addListener(handle_orientation_landscape)}else if(DEVICE["type"]=="mobile"){handle_orientation_landscape(false)}if(DEVICE["touch"]&&device_type!="export"){passJs("/js/touch.js",function(){touchScroller();touchSlider();noTouchThisSlider()})}switch(device_type){case"mobile":STYLES.push("/css/phone.css");change_Buttons();break;case"tablet":STYLES.push("/css/media.css");break;case"export":STYLES=STYLES_EXPORT;break;default:STYLES.push("/css/media.css");break;}for(var index=0;index<STYLES.length;index++){passCss(STYLES[index])}}var fromStore=localStorage.getItem("DEVICE");if(fromStore){DEVICE=JSON.parse(fromStore);extendCache();prepareDevice()}else{DEVICE={};DEVICE["toCache"]=[];var isDesktop="only screen and (hover: hover)";var isTouch="only screen and (pointer:coarse)";var isSmartphone="only screen and (max-device-width: 480px)";var checkTouch=window.matchMedia(isTouch);var checkDesktop=window.matchMedia(isDesktop);var checkDeviceMobile=window.matchMedia(isSmartphone);if(checkDesktop.matches&&!checkTouch.matches){DEV_LOG1+="> STYLE: Desktop\n";DEVICE["type"]="desktop"}else if(checkTouch.matches){DEV_LOG1+="> STYLE: Touchscreen\n";DEVICE["touch"]=true;if(checkDeviceMobile.matches){DEV_LOG1+=" - Smartphone\n";DEVICE["type"]="mobile"}else{DEV_LOG1+=" - Tablet\n";DEVICE["type"]="tablet"}}else{DEV_LOG1+="> STYLE: unsupported\n";DEVICE["type"]="unknown"}DEV_LOG1+="> STYLE: Pixel-Width "+window.innerWidth;var devlog_container=document.getElementById("dev_info1");console.log("IDENTIFY:",DEV_LOG1);if(devlog_container){devlog_container.innerHTML=DEV_LOG1}checkIDBShim(function(){console.log("IDENTIFY: (idb) starte Callback");checkES6();prepareDevice()})}