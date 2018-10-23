"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS SHIMindexedDB
closeListener formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote createAccount isObject updateStatus mergeDeep formSettings
db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData
sync_deleteKlasse sync_pushBack sync_getKlasse*/

window.SHIMindexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// Testen und anlegen einer DB
function initDB(callback) {
	if (!SHIMindexedDB) {
		window.alert("Dein Browser ist für die WebApp-Funktionen leider zu alt. Mit einem aktuellen Browser bist du sicherer im Internet unterwegs und kannst die TeacherTab nutzen !");
	}else{
		console.log("IDB: supported !");
		// >> first visit ?
		var vCheck = SHIMindexedDB.open(GLOBALS.dbname);
		vCheck.onerror = errorHandler;
		vCheck.onsuccess = function(event){
			var connection = event.target.result;
			//DEV console.log("IDB: GLOBALS.dbversion =", GLOBALS.dbversion);
			if (!GLOBALS.dbversion){
				// -- vielleicht
				GLOBALS.dbversion = parseInt(connection.version);
				if (GLOBALS.dbversion <= 1){
					// -- definitiv
					//DEV console.log("IDB: First.start");
					var called = false;
					var needUpgrade = false;
					connection.close();
					var request = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion+1);
					request.onerror = errorHandler;
					request.onupgradeneeded = function(event){
						console.log("IDB: start upgrade");
						var nextDB = request.result;
						if (!nextDB.objectStoreNames.contains('account')) {
							nextDB.createObjectStore('account', {keyPath: "id", autoIncrement: true});
						}
						GLOBALS.dbversion += 1;
						localStorage.setItem("dbversion_"+GLOBALS.userID, GLOBALS.dbversion);
						needUpgrade = true;
						console.log("IDB: upgrade finished");
					};
					request.onsuccess = function(event){
						//DEV console.log("IDB: First.onsuccess");
						if (needUpgrade) {
							// Accountinformationen anlegen
							var connection2 = event.target.result;
							var objectStore = connection2.transaction(['account'], "readwrite").objectStore("account");
							var row = createAccount(GLOBALS.dbname);
							var adding = objectStore.add(row);
							adding.onsuccess = function(){
								window.location.reload();
							};
						}
						console.log("IDB: initiiert");

						// ---> Garbage Collection
						connection2.onversionchange = function(event){
							connection2.close();
						};

					};
					request.oncomplete = function(event){
						if (!called) {
							called = true;
							callback();
						}
					};
				}else{
					// -- nein
					localStorage.setItem("dbversion_"+GLOBALS.userID, GLOBALS.dbversion);
					vCheck.oncomplete = console.log("IDB: dbversion unknown (not in localStorage)");
					callback();
				}
			}else{
				// -- nein
				console.log("IDB: version", GLOBALS.dbversion);
				console.log("IDB: init");
				callback();
			}

			// ---> Garbage Collection
			connection.onversionchange = function(event) {
				connection.close();
			};

		};
	}
}

// ===================================================== //
// == grundlegende Datenbankinteraktionen ============== //
// ===================================================== //


// Neue Klasse anlegen
function db_neueKlasse(callback, id, bezeichnung) {
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		
		if (!connection.objectStoreNames.contains(id)) {
			// Store noch nicht vorhanden, Upgrade needed
			// 1. Close old
			connection.close();
			
			// 2. Open new
			GLOBALS.dbversion = localStorage.getItem("dbversion_"+GLOBALS.userID);
			GLOBALS.dbversion = parseInt(GLOBALS.dbversion) + 1;
			localStorage.setItem("dbversion_"+GLOBALS.userID, GLOBALS.dbversion);

			var newdb = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
			newdb.onerror = errorHandler;
			newdb.onupgradeneeded = function(event){
				var connection = event.target.result;
				console.log("IDB: creating Class");
				// Erstelle ObjectStore
				var oStore = connection.createObjectStore(id, {keyPath: "id", autoIncrement: true});
				// Erstelle Indexes
				var result_Index = oStore.createIndex("typ", "typ", { unique: false });				
				// Globale Variable speichern
				GLOBALS.klasse = id;
				console.log("IDB:", bezeichnung, " (", id, ") created");
				console.log("IDB: Index:", result_Index);
			};
			newdb.onsuccess = function(event){
				console.log("db_neueKlasse onsuccess");//DEV
				SettingsRequest(event, id, bezeichnung, callback);
			};
			newdb.onversionchange = function (event) {
				console.log("IDB: Schließe onversionchange von newdb");
				event.target.transaction.db.close();
			};

		}else{
			// Store ist vorhanden, kein Upgrade notwendig
			console.log("IDB:", bezeichnung, " (", id, ") already exists. Do nothing...");
			SettingsRequest(event, id, bezeichnung, callback);
		}


	};
	
	// ---> Garbage Collection
	db.onversionchange = function(event) {
		event.target.transaction.db.close();
	};
}


// Neues Document in DB anlegen (typen-unabhängig)
function db_addDocument(callback, newObject, oStore) {
	if (typeof oStore == "undefined") {oStore = GLOBALS.klasse;}
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore, "readwrite").objectStore(oStore);

		// multiples Einfügen oder einzelner Datensatz
		var rowlist = (Array.isArray(newObject)) ? newObject : [newObject];

		// Speicher-Iteration
		putNext(0);
		function putNext(iterator) {
			if (iterator<rowlist.length) {
				objectStore.put(rowlist[iterator]).onsuccess = function(){putNext(iterator+1);};
			} else {   // complete
				console.log("IDB: Datensatz eingefügt (", iterator, "mal)");
				if (callback) {callback(connection);}
			}
		}
		//connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	};
	db.oncomplete = function(){
		if (callback) {callback(event.target.result);}
	};
	return;
}


// Klasse löschen
function db_dropKlasse(oStore, callback) {
	if (oStore == "" || !oStore) {return;}
	// First: Clear the store
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onsuccess = function(event){
		var connection = event.target.result;

		if (connection.objectStoreNames.contains(oStore)) {
			// oStore existiert lokal - Clear
			var objectStore = connection.transaction(oStore, "readwrite").objectStore(oStore);
			var result_clear = objectStore.clear();
			result_clear.onerror = errorHandler;
			result_clear.onsuccess = function(event){
				console.log("IDB: clearing Store...");
				// Second: Delete the store
				GLOBALS.dbversion += 1;
				localStorage.setItem("dbversion_"+GLOBALS.userID, GLOBALS.dbversion);
				var db2 = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
				db2.onsuccess = function(event){
					var connection2 = event.target.result;

					console.log("IDB:", oStore, "deleted");

					// Klasse aus Account entfernen
					db_simpleUpdate(function(){
						callback();
					}, 1, "klassenliste", "delKlasse", oStore, "account");

					// ---> Garbage Collection
					connection2.onversionchange = function(event) {
						connection2.close();
					};
					
				};
				db2.onerror = errorHandler;
				db2.onupgradeneeded = function(event){
					var connection2 = event.target.result;
					connection2.deleteObjectStore(oStore);
				};
			};
		}else{
			console.log("IDB:", oStore, "lokal nicht vorhanden...");
			// Klasse aus Account entfernen
			db_simpleUpdate(function(){
				callback();
			}, 1, "klassenliste", "delKlasse", oStore, "account");
		}

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
		
	};
	db.onerror = errorHandler;
}


// Document nach ID löschen
function db_deleteDoc(callback, id){
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([GLOBALS.klasse], "readwrite").objectStore(GLOBALS.klasse);
		var result = objectStore.delete(id);
		result.onerror = errorHandler;
		result.onsuccess = function(event){
			console.log("IDB: Eintrag ID", id, "gelöscht");
			if (callback) {callback(connection);}
		};
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

		return;
	};
}


// Document nach ID ohne anderen Einschränkungen lesen
function db_readGeneric(callback, id, oStore) {
	if (typeof oStore == "undefined") { oStore = GLOBALS.klasse; }
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var result;
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore).objectStore(oStore);
		var transaction = objectStore.openCursor();
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor) {
				if (cursor.value.id == id) {
					result = cursor.value;
				}
				// in jedem Fall zu ende Itterieren (muss halt so)
				cursor.continue();
			}else{
				// Close and Callback
				//DEV console.log("IDB: result is:", result);
				connection.close();
				callback(result);
			}
		};
	};
}


// Update eines Eintrags mit Value nach ID, Property und Modus
function db_simpleUpdate(callback, eID, prop, mode, val, oStore) {
	if (typeof oStore == "undefined") {oStore = GLOBALS.klasse;}
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([oStore], 'readwrite').objectStore(oStore);
		var transaction = objectStore.openCursor();
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor) {
				if ( eID == cursor.value.id ) {
					var toUpdate = cursor.value;
					var idx;

					// zu Array hinzufügen
					if (mode == "push") {
						if (Array.isArray(toUpdate[prop])) {
							if (toUpdate[prop].indexOf(val) === -1){
								// - Item existiert noch nicht
								toUpdate[prop].push(val);
							}
						}else{
							// - neues Array anlegen mit ersten Wer
							toUpdate[prop] = [val];
						}

					// zu Object hinzufügen
					}else if (mode == "insert") {
						if (isObject(toUpdate[prop])) {
							toUpdate[prop][val[0]] = val[1];
						}else{
							toUpdate[prop] = {};
							toUpdate[prop][val[0]] = val[1];
						}

					// aus Array entfernen
					}else if (mode == "pop") {
						if (Array.isArray(toUpdate[prop])) {
							idx = toUpdate[prop].indexOf(val);
							if (idx > -1) {toUpdate[prop].splice(idx, 1);}
						}else{
							toUpdate[prop] = [];
						}

					// Klasse in Account hinzufügen oder updaten
					}else if (mode == "addKlasse") {
						// in Klassenliste
						toUpdate.klassenliste[val[0]] = val[1];
						// in Local
						if (toUpdate.local.indexOf(val[0]) === -1 && prop != "notlocal") {
							toUpdate.local.push(val[0]);
						}

					// Klasse aus Account entfernen
					}else if (mode == "delKlasse") {
						// aus Klassenliste
						delete toUpdate.klassenliste[val];
						// aus Local
						idx = toUpdate.local.indexOf(val);
						if (idx > -1) {toUpdate.local.splice(idx, 1);}
						// auf Blacklist
						toUpdate.blacklist.push(val);
					}

					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("IDB: ID", eID, "updated");
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		};

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	};
}


// Update eines Documents durch Ersetzen
function db_replaceData(callback, newObject, oStore, multi) {
	if (typeof oStore == "undefined") {oStore = GLOBALS.klasse;}
	if (typeof multi == "undefined") {multi = false;}

	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([oStore], 'readwrite').objectStore(oStore);
		var updateRequest;

		if (!multi) {
			// einzelnes Object
			updateRequest = objectStore.put(newObject);
			updateRequest.onsuccess = function(event){
				console.log("IDB: item", newObject.id, "replaced");
				callback();
			};
		}else{
			// Object mit Objecten
			var IDsToGo = Object.keys(newObject);
			for (var i = IDsToGo.length - 1; i >= 0; i--) {
				var id = parseInt(IDsToGo[i]);
				var toGo = 1;
				updateRequest = objectStore.put(newObject[id]);
				updateRequest.onsuccess = function(event){
					if (toGo == IDsToGo.length) {
						console.log("IDB:", toGo, "items replaced");
						callback();
					}else{
						toGo += 1;
					}
				};
			}
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	};
}


// ===================================================== //
// == speziellere Datenbankinteraktionen =============== //
// ===================================================== //


// Gesamte Klasse selektieren
function db_readKlasse(callback, targetClass) {
	if (typeof targetClass == "undefined") {targetClass = GLOBALS.klasse;}
	console.log("IDB: Selecting", targetClass); //DEV
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		if (connection.objectStoreNames.contains(targetClass)) {
			var oStore = connection.transaction(targetClass).objectStore(targetClass);
			var request = oStore.getAll();
			request.onerror = errorHandler;
			request.onsuccess = function(event){
				var resultList = event.target.result;
				console.log("IDB: Found", resultList);//DEV

				// Liste in Object nach IDs umwandeln
				var result = {};
				for (var i = resultList.length - 1; i >= 0; i--) {
					result[resultList[i].id] = resultList[i];
				}
				
				// Close and Callback
				event.target.transaction.db.close();
				callback([targetClass, result]);
			};

		}else{
			// Close and Callback
			connection.close();
			callback([targetClass]);
		}
	};

	// ---> Garbage Collection
	db.onversionchange = function(event) {
		event.target.transaction.db.close();
	};
}


// Document anhand Typ und ID selektieren
function db_readSingleData(callback, typ, id, emptyCall) {
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var result = false;
		var connection = event.target.result;
		var objectStore = connection.transaction([GLOBALS.klasse]).objectStore(GLOBALS.klasse);
		
		// Typ einschränken
		var idxTyp = objectStore.index("typ");
		var keyRange = IDBKeyRange.only(typ);
		var transaction = idxTyp.openCursor(keyRange);
		
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor) {
				if (!result && id != null && cursor.value.id == id) {
					// Nur den ersten Treffer speichern
					result = cursor.value;
				}
				// in jedem Fall zu ende Itterieren (muss halt so)
				cursor.continue();
			}else{

				// Close and Callback
				connection.close();
				
				if (result) {
					callback(result);
				}else{
					console.log("Hierzu gibt es noch keine Daten:", typ, id);
					if (emptyCall) {emptyCall();}
				}
			}
		};
	};
}


// Alle Documente eines Typs selektieren
function db_readMultiData(callback, typ, emptyCall) {
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var result = [];
		var connection = event.target.result;
		var objectStore = connection.transaction([GLOBALS.klasse]).objectStore(GLOBALS.klasse);
		
		// Typ einschränken
		var idxTyp = objectStore.index("typ");
		var transaction = idxTyp.getAll(typ);
		
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			result = event.target.result;

			// Close and Callback
			connection.close();

			if (result.length > 0) {
				callback(result);
			}else{
				console.log("IDB: Leeres Ergebnis der Abfrage nach Typ", typ);
				if (emptyCall) {
					emptyCall();
				}else{
					callback();
				}
			}
		};
	};
}


// Update eines Documents durch Zusammenführung (optional überscheiben)
function db_updateData(callback, newObjects, oStore, overwrite) {
	if (typeof overwrite == "undefined") {overwrite = false;}
	if (typeof oStore == "undefined") {oStore = GLOBALS.klasse;}

	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore, 'readwrite').objectStore(oStore);
		var transaction = objectStore.openCursor();
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor) {
				id = cursor.value.id;
				if (newObjects.hasOwnProperty(id.toString())) {
					var toUpdate = (overwrite) ? newObjects[id] : mergeDeep(cursor.value, newObjects[id]);
					//var toUpdate = (overwrite) ? newObjects[id] : mergeDeep.apply(cursor.value, spread(newObjects[id]));
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("indexDB: ID", id, "updated...");
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		};

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	};
}


// Wendet eine Funktion auf einen Eintrag (Typ/ID) an und updatet mit dem Ergebnis
function db_dynamicUpdate(callback, toApply, typ, eID) {
	var db = SHIMindexedDB.open(GLOBALS.dbname, GLOBALS.dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([GLOBALS.klasse], 'readwrite').objectStore(GLOBALS.klasse);
		
		// Typ einschränken
		var idxTyp = objectStore.index("typ");
		var keyRange = IDBKeyRange.only(typ);
		var transaction = idxTyp.openCursor(keyRange);

		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor) {
				id = cursor.value.id;
				if ( (eID != null && eID == id) || eID == null ) {
					var toUpdate = cursor.value;
					toUpdate = toApply(toUpdate);
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("IDB: Funktion angewendet auf ", id, "applied");
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		};

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	};
}


// ===================================================== //
// == allgemeine Handler =============================== //
// ===================================================== //

// Fehler
function errorHandler(event) {
	console.log("IDB: operation went wrong:");
	console.log("IDB:", event);
	updateStatus(100, "Fehler beim Zugriff auf die lokale Datenbank", "Ein Datenbankfehler ist aufgetreten", undefined, true);
	return;
}

// Belegte Connection
function blockHandler(event) {
	event.target.result.close();
	console.log("IDB: Blocked ! ...closing Connections");
}

// Settings erstellen
function SettingsRequest(event, id, bezeichnung, callback){
	console.log("SettingsRequest function");//DEV
	var connectionSR = event.target.result;
	var checkRequest = connectionSR.transaction(id).objectStore(id).get(1);
	checkRequest.onerror = errorHandler;
	checkRequest.onsuccess = function(event){
		console.log("checkRequest onsuccess");//DEV
		event.target.transaction.db.close();

		if (!event.target.result){
			// keine ID 1 vorhanden, SETTINGS schreiben:
			console.log("IDB: adding Settings");
			db_addDocument(false, formSettings(id, bezeichnung));
		}
			
		// Neue Klasse in Account-Array einfügen
		var changed = timestamp();
		console.log("IDB: adding Class to Account");
		db_simpleUpdate(callback, 1, "klassenliste", "addKlasse", [id, {'bezeichnung': bezeichnung, 'id' : id, 'changed' : changed}], "account");
		
	};
	checkRequest.oncomplete = function(event){
		console.log("checkRequest oncomplete");//DEV
		event.target.transaction.db.close();
	};


	// ---> Garbage Collection
	checkRequest.onversionchange = function(event) {
		event.target.transaction.db.close();
	};
}