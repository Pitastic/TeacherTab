// Testen und anlegen einer DB
function initDB() {
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

	if (!indexedDB) {
	   window.alert("Datenbanksupport im Browser fehlt !")
	}else{
		console.log("indexedDB: Supported !");
		// >> first visit ?
		var vCheck = indexedDB.open(dbname);
		vCheck.onerror = errorHandler;
		vCheck.onsuccess = function(event){
			var connection = event.target.result;
			dbversion = parseInt(localStorage.getItem("dbversion"));
			if (!dbversion){
				// -- vielleicht
				dbversion = parseInt(connection.version);
				if (dbversion <= 1){
					// -- definitiv
					var needUpgrade = false;
					connection.close();
					var request = indexedDB.open(dbname, dbversion+1);
					request.onerror = errorHandler;
					request.onupgradeneeded = function(event){
						console.log("indexedDB: start upgrade");
						var nextDB = request.result;
						if (!nextDB.objectStoreNames.contains('account')) {
							nextDB.createObjectStore('account', {keyPath: "id", autoIncrement: true});
						}
						dbversion += 1;
						localStorage.setItem("dbversion", dbversion);
						needUpgrade = true;
						console.log("indexedDB: upgrade finished");
					}
					request.onsuccess = function(event){
						if (needUpgrade) {
							// Accountinformationen anlegen
							var connection2 = event.target.result;
							var objectStore = connection2.transaction(['account'], "readwrite").objectStore("account");
							row = {
								'username' : dbname,
							};
							objectStore.add(row);
						}
						console.log("indexedDB: initiiert");

						// ---> Garbage Collection
						connection2.onversionchange = function(event){
							connection2.close();
						}

					};
				}else{
					// -- nein
					localStorage.setItem("dbversion", dbversion);
					vCheck.oncomplete = console.log("indexedDB: dbversion unknown (not in localStorage)");
				}
			}else{
				// -- nein
				console.log("indexedDB: version", dbversion);
				console.log("indexedDB: init");
			}

			// ---> Garbage Collection
			connection.onversionchange = function(event) {
				connection.close();
			};

		}
	}
}

// ===================================================== //
// == grundlegende Datenbankinteraktionen=============== //
// ===================================================== //

// Alle Klassen auflisten
function db_listKlassen(callback) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = request.result;
		var allStores = connection.objectStoreNames;
		if (callback) {callback(allStores)}

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
	request.onblocked = blockHandler;
}


// Neue Klasse anlegen
function db_neueKlasse(bezeichnung) {
	dbversion = localStorage.getItem("dbversion");
	dbversion = parseInt(dbversion) + 1
	localStorage.setItem("dbversion", dbversion);
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		db_addDocument(false, formSettings());

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();

		};
	}
	request.onupgradeneeded = function(event){
		var connection = event.target.result;
		if (!connection.objectStoreNames.contains(bezeichnung)) {
				console.log("indexedDB: creating");
				// Erstelle ObhectStore
				var oStore = connection.createObjectStore(bezeichnung, {keyPath: "id", autoIncrement: true});
				// Erstelle Indexes
				oStore.createIndex("typ", "typ", { unique: false });
				// Globale Variable speichern
				klasse = bezeichnung;
				console.log("indexedDB:", bezeichnung, "created");
		}else{
			klasse = bezeichnung;
			console.log("indexedDB:", bezeichnung, "already exists. Do nothing...");
		}
	}
}


// Klasse löschen
function db_dropKlasse(bezeichnung, callback) {
	if (bezeichnung == "" || !bezeichnung) {return;}
	// First: Clear the store
	var request1 = indexedDB.open(dbname, dbversion);
	request1.onsuccess = function(event){
		var connection = event.target.result;

		var objectStore = connection.transaction([bezeichnung], "readwrite").objectStore(bezeichnung);
		var result_clear = objectStore.clear();
		result_clear.onerror = errorHandler;
		result_clear.onsuccess = function(event){
			console.log("indexedDB: clearing Store...");
			// Second: Delete the store
			dbversion += 1;
			localStorage.setItem("dbversion", dbversion);
			var request2 = indexedDB.open(dbname, dbversion);
			request2.onsuccess = function(event){
				var connection2 = event.target.result;

				// ---> Garbage Collection
				connection2.onversionchange = function(event) {
					connection2.close();
				};
				
			}
			request2.onerror = errorHandler;
			request2.onupgradeneeded = function(event){
				var connection2 = event.target.result;
				connection2.deleteObjectStore(bezeichnung);
				console.log("indexedDB:", bezeichnung, "deleted");
			}
		}

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
		
	}
	request1.onerror = errorHandler;
	request1.oncomplete = function(e){
		callback();
	}
}


// Neues Document in DB anlegen (typen-unabhängig)
function db_addDocument(callback, newObject) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event, rowlist){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);

		// multiples Einfügen oder einzelner Datensatz
		var rowlist = (Array.isArray(newObject)) ? newObject : [newObject];

		// Speicher-Iteration
		putNext(0);
		function putNext(iterator) {
			if (iterator<rowlist.length) {
				objectStore.put(rowlist[iterator]).onsuccess = function(){putNext(iterator+1)};
			} else {   // complete
				console.log("indexedDB: Datensatz eingefügt");
				if (callback) {callback(connection);}
			}
		}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	}
	request.oncomplete = function(){
		if (callback) {callback(event.target.result)}
	}
	return;
}


function db_deleteDoc(callback, id){
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		var result = objectStore.delete(id);
		result.onerror = errorHandler;
		result.onsuccess = function(event){
			console.log("indexedDB: Eintrag ID", id, "gelöscht");
			// Eintrag auch vom Account löschen, wenn online
			if (navigator.onLine){
				sync_deleteDoc(id);
			}else{
				alert("Kein Kontakt zum SyncServer.\nDer Eintrag wurde nur von diesem Gerät entfernt.");
			}
			if (callback) {callback(connection);}
		}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

		return;
	}
}


// Schüler aus Klasse löschen
function db_deleteStudent_deprecated(id, callback) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		var result = objectStore.delete(id);
		result.onerror = errorHandler;
		result.onsuccess = function(event){
			console.log("indexedDB: Eintrag ID", id, "gelöscht");
			// Schüler auch vom Account löschen, wenn online
			if (navigator.onLine){
				SYNC_deleteStudent(id);
			}else{
				alert("Kein Kontakt zum SyncServer.\nDer Schüler wurde nur von diesem Gerät entfernt.");
			}
			if (callback) {callback(connection);}
		}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

		return;
	}
}


// Leistung aus aktueller Klasse löschen
function db_deleteLeistung_deprecated(callback, art, id) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		var transaction = objectStore.openCursor()
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor){
				if (cursor.value.id == 0) {
					new_entry = cursor.value;
					console.log("indexDB: Delete", new_entry.leistungen[art][id]);
					delete new_entry.leistungen[art][id];
					var requestUpdate = cursor.update(new_entry);
					requestUpdate.onsuccess = function() {
						cursor.continue();
					};
				}else{
					new_entry = cursor.value;
					delete new_entry[art][id];
					var requestUpdate = cursor.update(new_entry);
					requestUpdate.onsuccess = function() {
						cursor.continue();
					};
				}
			}else{
				console.log("indexDB: Leistung (ID", id,"gelöscht...")
				connection.close();
				callback();
			}
		}
		
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// Document anhand Typ und ID selektieren
function db_readSingleData(callback, typ, id, emptyCall) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var result = false;
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse]).objectStore(klasse);
		
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
				if (result) {
					callback(result);
				}else{
					console.log("Hierzu gibt es noch keine Daten:", typ, id);
					if (emptyCall) {emptyCall();}
				}
			}
		}
	}
}


// Alle Documente eines Typs selektieren
function db_readMultiData(callback, typ, emptyCall) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var result = [];
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse]).objectStore(klasse);
		
		// Typ einschränken
		var idxTyp = objectStore.index("typ");
		var transaction = idxTyp.getAll(typ);
		
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			result = event.target.result;
			if (result.length > 0) {
				callback(result);
			}else{
				console.log("In deiner Klasse ist noch zu wenig los dafür:", typ);
				if (emptyCall) {emptyCall();}
			}
		}
	}
}


// Update eines Documents durch Ersetzen
function db_replaceData(callback, newObject) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		updateRequest = objectStore.put(newObject);
		updateRequest.onsuccess = function(event){
			console.log("IndexDB : item", newObject.id, "replaced");
			callback();
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// Objekt (mit Tiefe von 0 bis 1) updaten in aktueller Klasse
// (Update eines Documents durch Zusammenführung)
function db_updateData(callback, newObjects) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		var transaction = objectStore.openCursor()
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor) {
				id = cursor.value.id;
				if (newObjects.hasOwnProperty(id.toString())) {
					var toUpdate = mergeDeep(cursor.value, newObjects[id]);
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("indexDB: ID", id, "updated...")
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// Wendet eine Funktion auf einen Eintrag (Typ/ID) an und updatet mit dem Ergebnis
function db_dynamicUpdate(callback, toApply, typ, eID) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		
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
						console.log("indexDB: ID", id, "applied", toApply.name+"()")
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// ===================================================== //
// == allgemeine Handler =============================== //
// ===================================================== //

// Fehler
function errorHandler(event) {
	console.log("indexedDB: operation went wrong:");
	console.log("indexedDB:", event);
	return;
}

// Belegte Connection
function blockHandler(event) {
	console.log("DB is blocked !", event.target.result);
}