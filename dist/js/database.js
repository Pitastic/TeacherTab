"use strict";window.SHIMindexedDB=window.SHIMindexedDB||window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB||window.shimIndexedDB;function initDB(callback){if(!SHIMindexedDB){window.alert("Dein Browser ist f\xFCr die WebApp-Funktionen leider zu alt. Mit einem aktuellen Browser bist du sicherer im Internet unterwegs und kannst die TeacherTab nutzen !")}else{console.log("IDB: supported !");var vCheck=SHIMindexedDB.open(GLOBALS.dbname);vCheck.onerror=errorHandler;vCheck.onsuccess=function(event){var connection=event.target.result;if(!GLOBALS.dbversion){GLOBALS.dbversion=parseInt(connection.version);if(GLOBALS.dbversion<=1){var called=false;var needUpgrade=false;connection.close();var request=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion+1);request.onerror=errorHandler;request.onupgradeneeded=function(event){console.log("IDB: start upgrade");var nextDB=request.result;if(!nextDB.objectStoreNames.contains("account")){nextDB.createObjectStore("account",{keyPath:"id",autoIncrement:true})}GLOBALS.dbversion+=1;localStorage.setItem("dbversion_"+GLOBALS.userID,GLOBALS.dbversion);needUpgrade=true;console.log("IDB: upgrade finished")};request.onsuccess=function(event){if(needUpgrade){var connection2=event.target.result;var objectStore=connection2.transaction(["account"],"readwrite").objectStore("account");var row=createAccount(GLOBALS.dbname);var adding=objectStore.add(row);adding.onsuccess=function(){window.location.reload()}}console.log("IDB: initiiert");connection2.onversionchange=function(event){connection2.close()}};request.oncomplete=function(event){if(!called){called=true;callback()}}}else{localStorage.setItem("dbversion_"+GLOBALS.userID,GLOBALS.dbversion);vCheck.oncomplete=console.log("IDB: dbversion unknown (not in localStorage)");callback()}}else{console.log("IDB: version",GLOBALS.dbversion);console.log("IDB: init");callback()}connection.onversionchange=function(event){connection.close()}}}}function db_neueKlasse(callback,id,bezeichnung){var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;if(!connection.objectStoreNames.contains(id)){connection.close();GLOBALS.dbversion=localStorage.getItem("dbversion_"+GLOBALS.userID);GLOBALS.dbversion=parseInt(GLOBALS.dbversion)+1;localStorage.setItem("dbversion_"+GLOBALS.userID,GLOBALS.dbversion);var newdb=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);newdb.onerror=errorHandler;newdb.onupgradeneeded=function(event){var connection=event.target.result;console.log("IDB: creating Class");var oStore=connection.createObjectStore(id,{keyPath:"id",autoIncrement:true});var result_Index=oStore.createIndex("typ","typ",{unique:false});GLOBALS.klasse=id;console.log("IDB:",bezeichnung," (",id,") created");console.log("IDB: Index:",result_Index)};newdb.onsuccess=function(event){console.log("db_neueKlasse onsuccess");SettingsRequest(event,id,bezeichnung,callback)};newdb.onversionchange=function(event){console.log("IDB: Schlie\xDFe onversionchange von newdb");event.target.transaction.db.close()}}else{console.log("IDB:",bezeichnung," (",id,") already exists. Do nothing...");SettingsRequest(event,id,bezeichnung,callback)}};db.onversionchange=function(event){event.target.transaction.db.close()}}function db_addDocument(callback,newObject,oStore){if(typeof oStore=="undefined"){oStore=GLOBALS.klasse}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction(oStore,"readwrite").objectStore(oStore);var rowlist=Array.isArray(newObject)?newObject:[newObject];putNext(0);function putNext(iterator){if(iterator<rowlist.length){objectStore.put(rowlist[iterator]).onsuccess=function(){putNext(iterator+1)}}else{console.log("IDB: Datensatz eingef\xFCgt (",iterator,"mal)");if(callback){callback(connection)}}}connection.onversionchange=function(event){connection.close()}};db.oncomplete=function(){if(callback){callback(event.target.result)}};return}function db_dropKlasse(oStore,callback){if(oStore==""||!oStore){return}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onsuccess=function(event){var connection=event.target.result;if(connection.objectStoreNames.contains(oStore)){var objectStore=connection.transaction(oStore,"readwrite").objectStore(oStore);var result_clear=objectStore.clear();result_clear.onerror=errorHandler;result_clear.onsuccess=function(event){console.log("IDB: clearing Store...");GLOBALS.dbversion+=1;localStorage.setItem("dbversion_"+GLOBALS.userID,GLOBALS.dbversion);var db2=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db2.onsuccess=function(event){var connection2=event.target.result;console.log("IDB:",oStore,"deleted");callback();connection2.onversionchange=function(event){connection2.close()}};db2.onerror=errorHandler;db2.onupgradeneeded=function(event){var connection2=event.target.result;connection2.deleteObjectStore(oStore)}}}else{console.log("IDB:",oStore,"lokal nicht vorhanden...");callback()}connection.onversionchange=function(event){connection.close()}};db.onerror=errorHandler}function db_deleteDoc(callback,id){var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction([GLOBALS.klasse],"readwrite").objectStore(GLOBALS.klasse);var result=objectStore.delete(id);result.onerror=errorHandler;result.onsuccess=function(event){console.log("IDB: Eintrag ID",id,"gel\xF6scht");if(callback){callback(connection)}};connection.close();connection.onversionchange=function(event){connection.close()};return}}function db_readGeneric(callback,id,oStore){if(typeof oStore=="undefined"){oStore=GLOBALS.klasse}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var result;var connection=event.target.result;var objectStore=connection.transaction(oStore).objectStore(oStore);var transaction=objectStore.openCursor();transaction.onerror=errorHandler;transaction.onsuccess=function(event){var cursor=event.target.result;if(cursor){if(cursor.value.id==id){result=cursor.value}cursor.continue()}else{connection.close();callback(result)}}}}function db_simpleUpdate(callback,eID,prop,mode,val,oStore){if(typeof oStore=="undefined"){oStore=GLOBALS.klasse}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction([oStore],"readwrite").objectStore(oStore);var transaction=objectStore.openCursor();transaction.onerror=errorHandler;transaction.onsuccess=function(event){var cursor=event.target.result;if(cursor){if(eID==cursor.value.id){var toUpdate=cursor.value;var idx;if(mode=="push"){if(Array.isArray(toUpdate[prop])){if(toUpdate[prop].indexOf(val)===-1){toUpdate[prop].push(val)}}else{toUpdate[prop]=[val]}}else if(mode=="insert"){if(isObject(toUpdate[prop])){toUpdate[prop][val[0]]=val[1]}else{toUpdate[prop]={};toUpdate[prop][val[0]]=val[1]}}else if(mode=="pop"){if(Array.isArray(toUpdate[prop])){idx=toUpdate[prop].indexOf(val);if(idx>-1){toUpdate[prop].splice(idx,1)}}else{toUpdate[prop]=[]}}else if(mode=="addKlasse"){toUpdate.klassenliste[val[0]]=val[1];if(toUpdate.local.indexOf(val[0])===-1&&prop!="notlocal"){toUpdate.local.push(val[0])}}else if(mode=="delKlasse"){delete toUpdate.klassenliste[val];idx=toUpdate.local.indexOf(val);if(idx>-1){toUpdate.local.splice(idx,1)}toUpdate.blacklist.push(val)}else if(mode=="cleanUp"){delete toUpdate.klassenliste[val];idx=toUpdate.local.indexOf(val);if(idx>-1){toUpdate.local.splice(idx,1)}}var requestUpdate=cursor.update(toUpdate);requestUpdate.onsuccess=function(){console.log("IDB: ID",eID,"updated")}}cursor.continue()}else{callback()}};connection.close();connection.onversionchange=function(event){connection.close()}}}function db_replaceData(callback,newObject,oStore,multi){if(typeof oStore=="undefined"){oStore=GLOBALS.klasse}if(typeof multi=="undefined"){multi=false}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction([oStore],"readwrite").objectStore(oStore);var updateRequest;if(!multi){updateRequest=objectStore.put(newObject);updateRequest.onsuccess=function(event){console.log("IDB: item",newObject.id,"replaced");callback()}}else{var IDsToGo=Object.keys(newObject);for(var i=IDsToGo.length-1;i>=0;i--){var id=parseInt(IDsToGo[i]);var toGo=1;updateRequest=objectStore.put(newObject[id]);updateRequest.onsuccess=function(event){if(toGo==IDsToGo.length){console.log("IDB:",toGo,"items replaced");callback()}else{toGo+=1}}}}connection.close();connection.onversionchange=function(event){connection.close()}}}function db_readKlasse(callback,targetClass){if(typeof targetClass=="undefined"){targetClass=GLOBALS.klasse}console.log("IDB: Selecting",targetClass);var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;if(connection.objectStoreNames.contains(targetClass)){var oStore=connection.transaction(targetClass).objectStore(targetClass);var request=oStore.getAll();request.onerror=errorHandler;request.onsuccess=function(event){var resultList=event.target.result;console.log("IDB: Found",resultList);var result={};for(var i=resultList.length-1;i>=0;i--){result[resultList[i].id]=resultList[i]}if(event.target.transaction){event.target.transaction.db.close()}callback([targetClass,result])}}else{connection.close();callback([targetClass])}};db.onversionchange=function(event){event.target.transaction.db.close()}}function db_readSingleData(callback,typ,id,emptyCall){var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var result=false;var connection=event.target.result;var objectStore=connection.transaction([GLOBALS.klasse]).objectStore(GLOBALS.klasse);var idxTyp=objectStore.index("typ");var keyRange=IDBKeyRange.only(typ);var transaction=idxTyp.openCursor(keyRange);transaction.onerror=errorHandler;transaction.onsuccess=function(event){var cursor=event.target.result;if(cursor){if(!result&&id!=null&&cursor.value.id==id){result=cursor.value}cursor.continue()}else{connection.close();if(result){callback(result)}else{console.log("Hierzu gibt es noch keine Daten:",typ,id);if(emptyCall){emptyCall()}}}}}}function db_readMultiData(callback,typ,emptyCall){var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var result=[];var connection=event.target.result;var objectStore=connection.transaction([GLOBALS.klasse]).objectStore(GLOBALS.klasse);var idxTyp=objectStore.index("typ");var transaction=idxTyp.getAll(typ);transaction.onerror=errorHandler;transaction.onsuccess=function(event){result=event.target.result;connection.close();if(result.length>0){callback(result)}else{console.log("IDB: Leeres Ergebnis der Abfrage nach Typ",typ);if(emptyCall){emptyCall()}else{callback()}}}}}function db_updateData(callback,newObjects,oStore,overwrite){if(typeof overwrite=="undefined"){overwrite=false}if(typeof oStore=="undefined"){oStore=GLOBALS.klasse}var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction(oStore,"readwrite").objectStore(oStore);var transaction=objectStore.openCursor();transaction.onerror=errorHandler;transaction.onsuccess=function(event){var id,cursor=event.target.result;if(cursor){id=cursor.value.id;if(newObjects.hasOwnProperty(id.toString())){var toUpdate=overwrite?newObjects[id]:mergeDeep(cursor.value,newObjects[id]);var requestUpdate=cursor.update(toUpdate);requestUpdate.onsuccess=function(){console.log("indexDB: ID",id,"updated...")}}cursor.continue()}else{callback()}};connection.close();connection.onversionchange=function(event){connection.close()}}}function db_dynamicUpdate(callback,toApply,typ,eID){var db=SHIMindexedDB.open(GLOBALS.dbname,GLOBALS.dbversion);db.onerror=errorHandler;db.onsuccess=function(event){var connection=event.target.result;var objectStore=connection.transaction([GLOBALS.klasse],"readwrite").objectStore(GLOBALS.klasse);var idxTyp=objectStore.index("typ");var keyRange=IDBKeyRange.only(typ);var transaction=idxTyp.openCursor(keyRange);transaction.onerror=errorHandler;transaction.onsuccess=function(event){var id,cursor=event.target.result;if(cursor){id=cursor.value.id;if(eID!=null&&eID==id||eID==null){var toUpdate=cursor.value;toUpdate=toApply(toUpdate);var requestUpdate=cursor.update(toUpdate);requestUpdate.onsuccess=function(){console.log("IDB: Funktion angewendet auf ",id,"applied")}}cursor.continue()}else{callback()}};connection.close();connection.onversionchange=function(event){connection.close()}}}function errorHandler(event){console.log("IDB: operation went wrong:");console.log("IDB:",event);updateStatus(100,"Fehler beim Zugriff auf die lokale Datenbank","Ein Datenbankfehler ist aufgetreten",undefined,true);return}function blockHandler(event){event.target.result.close();console.log("IDB: Blocked ! ...closing Connections")}function SettingsRequest(event,id,bezeichnung,callback){console.log("SettingsRequest function");var connectionSR=event.target.result;var checkRequest=connectionSR.transaction(id).objectStore(id).get(1);checkRequest.onerror=errorHandler;checkRequest.onsuccess=function(event){if(event.target.transaction){event.target.transaction.db.close()}if(!event.target.result){console.log("IDB: adding Settings");db_addDocument(false,formSettings(id,bezeichnung))}var changed=timestamp();console.log("IDB: adding Class to Account");db_simpleUpdate(callback,1,"klassenliste","addKlasse",[id,{"bezeichnung":bezeichnung,"id":id,"changed":changed}],"account")};checkRequest.oncomplete=function(event){if(event.target.transaction){event.target.transaction.db.close()}};checkRequest.onversionchange=function(event){event.target.transaction.db.close()}}