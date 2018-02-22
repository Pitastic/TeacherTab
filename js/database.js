// Testen und anlegen einer DB
function initDB(callback) {
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

	if (!indexedDB) {
	   window.alert("Dein Browser ist für die WebApp-Funktionen leider zu alt. Mit einem aktuellen Browser bist du sicherer im Internet unterwegs und kannst die TeacherTab nutzen !")
	}else{
		console.log("IDB: supported !");
		// >> first visit ?
		var vCheck = indexedDB.open(dbname);
		vCheck.onerror = errorHandler;
		vCheck.onsuccess = function(event){
			var connection = event.target.result;
			dbversion = parseInt(localStorage.getItem("dbversion_"+userID));
			if (!dbversion){
				// -- vielleicht
				dbversion = parseInt(connection.version);
				if (dbversion <= 1){
					// -- definitiv
					var called = false;
					var needUpgrade = false;
					connection.close();
					var request = indexedDB.open(dbname, dbversion+1);
					request.onerror = errorHandler;
					request.onupgradeneeded = function(event){
						console.log("IDB: start upgrade");
						var nextDB = request.result;
						if (!nextDB.objectStoreNames.contains('account')) {
							nextDB.createObjectStore('account', {keyPath: "id", autoIncrement: true});
						}
						dbversion += 1;
						localStorage.setItem("dbversion_"+userID, dbversion);
						needUpgrade = true;
						console.log("IDB: upgrade finished");
					}
					request.onsuccess = function(event){
						if (needUpgrade) {
							// Accountinformationen anlegen
							var connection2 = event.target.result;
							var objectStore = connection2.transaction(['account'], "readwrite").objectStore("account");
							row = createAccount(dbname);
							var adding = objectStore.add(row);
							adding.onsuccess = function(){
								window.location.reload();
							}
						}
						console.log("IDB: initiiert");

						// ---> Garbage Collection
						connection2.onversionchange = function(event){
							connection2.close();
						}

					};
					request.oncomplete = function(event){
						if (!called) {
							called = true;
							callback();
						}
					}
				}else{
					// -- nein
					localStorage.setItem("dbversion_"+userID, dbversion);
					vCheck.oncomplete = console.log("IDB: dbversion unknown (not in localStorage)");
					callback();
				}
			}else{
				// -- nein
				console.log("IDB: version", dbversion);
				console.log("IDB: init");
				callback();
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


// Neue Klasse anlegen
function db_neueKlasse(callback, id, bezeichnung) {
	dbversion = localStorage.getItem("dbversion_"+userID);
	dbversion = parseInt(dbversion) + 1
	localStorage.setItem("dbversion_"+userID, dbversion);
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		db_addDocument(false, formSettings(id, bezeichnung));

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();

		};
	}
	db.onupgradeneeded = function(event){
		var connection = event.target.result;
		if (!connection.objectStoreNames.contains(id)) {
				console.log("IDB: creating");
				// Erstelle ObhectStore
				var oStore = connection.createObjectStore(id, {keyPath: "id", autoIncrement: true});
				// Erstelle Indexes
				oStore.createIndex("typ", "typ", { unique: false });
				
				// Neue Klasse in Account-Array einfügen
				var changed = timestamp();
				db_simpleUpdate(function(){
					callback();
				}, 1, "klassenliste", "addKlasse", [id, {'bezeichnung': bezeichnung, 'id' : id, 'changed' : changed}], "account");
				
				// Globale Variable speichern
				klasse = id;
				console.log("IDB:", bezeichnung, " (", id, ") created");
		}else{
			klasse = id;
			console.log("IDB:", bezeichnung, " (", id, ") already exists. Do nothing...");
		}
	}
}


// Klasse löschen
function db_dropKlasse(oStore, callback) {
	if (oStore == "" || !oStore) {return;}
	// First: Clear the store
	var db = indexedDB.open(dbname, dbversion);
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
				dbversion += 1;
				localStorage.setItem("dbversion_"+userID, dbversion);
				var db2 = indexedDB.open(dbname, dbversion);
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
					
				}
				db2.onerror = errorHandler;
				db2.onupgradeneeded = function(event){
					var connection2 = event.target.result;
					connection2.deleteObjectStore(oStore);
				}
			}
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
		
	}
	db.onerror = errorHandler;
}


// Neues Document in DB anlegen (typen-unabhängig)
function db_addDocument(callback, newObject, oStore) {
	if (typeof oStore == "undefined") {oStore = klasse;}
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event, rowlist){
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore, "readwrite").objectStore(oStore);

		// multiples Einfügen oder einzelner Datensatz
		var rowlist = (Array.isArray(newObject)) ? newObject : [newObject];

		// Speicher-Iteration
		putNext(0);
		function putNext(iterator) {
			if (iterator<rowlist.length) {
				objectStore.put(rowlist[iterator]).onsuccess = function(){putNext(iterator+1)};
			} else {   // complete
				console.log("IDB: Datensatz eingefügt");
				if (callback) {callback(connection);}
			}
		}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	}
	db.oncomplete = function(){
		if (callback) {callback(event.target.result)}
	}
	return;
}


// Document nach ID löschen
function db_deleteDoc(callback, id){
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		var result = objectStore.delete(id);
		result.onerror = errorHandler;
		result.onsuccess = function(event){
			console.log("IDB: Eintrag ID", id, "gelöscht");
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


// Gesamte Klasse selektieren
function db_readKlasse(callback, targetClass) {
	if (typeof targetClass == "undefined") {targetClass = klasse;}
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		if (connection.objectStoreNames.contains(targetClass)) {
			var oStore = connection.transaction(targetClass).objectStore(targetClass);
			var request = oStore.getAll();
			request.onerror = errorHandler;
			request.onsuccess = function(event){
				var resultList = event.target.result;

				// Liste in Object nach IDs umwandeln
				var result = {};
				for (var i = resultList.length - 1; i >= 0; i--) {
					result[resultList[i].id] = resultList[i];
				}

				callback([targetClass, result]);
			}
		}else{
			callback([targetClass]);
		}
	}
}


// Document nach ID ohne anderen Einschränkungen lesen
function db_readGeneric(callback, id, oStore) {
	if (typeof oStore == "undefined") {oStore = klasse;}
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore).objectStore(oStore);
		var transaction = objectStore.openCursor()
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
				callback(result);
			}
		}
	}
}


// Document anhand Typ und ID selektieren
function db_readSingleData(callback, typ, id, emptyCall) {
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
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
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
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
				if (emptyCall) {
					emptyCall();
				}else{
					callback();
				}
			}
		}
	}
}


// Update eines Eintrags mit Value nach ID, Property und Modus
function db_simpleUpdate(callback, eID, prop, mode, val, oStore) {
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([oStore], 'readwrite').objectStore(oStore);
		var transaction = objectStore.openCursor()
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor) {
				if ( eID == cursor.value.id ) {
					var toUpdate = cursor.value;

					// zu Array hinzufügen
					if (mode == "push") {
						if (Array.isArray(toUpdate[prop])) {
							toUpdate[prop].push(val);
						}else{
							toUpdate[prop] = [val];
						}

					// zu Object hinzufügen
					}else if (mode == "insert") {
						if (typeof(toUpdate[prop]) == "object") {
							toUpdate[prop][val[0]] = val[1];
						}else{
							toUpdate[prop] = {};
							toUpdate[prop][val[0]] = val[1];
						}

					// aus Array entfernen
					}else if (mode == "pop") {
						if (Array.isArray(toUpdate[prop])) {
							var idx = toUpdate[prop].indexOf(val);
							if (idx > -1) {toUpdate[prop].splice(idx, 1);}
						}else{
							toUpdate[prop] = [];
						}

					// Klasse in Account hinzufügen
					}else if (mode == "addKlasse") {
						// in Klassenliste
						toUpdate.klassenliste[val[0]] = val[1];
						// in Local
						toUpdate.local.push(val[0]);

					// Klasse aus Account entfernen
					}else if (mode == "delKlasse") {
						// aus Klassenliste
						delete toUpdate.klassenliste[val];
						// aus Local
						var idx = toUpdate.local.indexOf(val);
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
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	}
}


// Update eines Documents durch Ersetzen
function db_replaceData(callback, newObject, oStore, multi) {
	if (typeof oStore == "undefined") {oStore = klasse;}
	if (typeof multi == "undefined") {multi = false;}

	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([oStore], 'readwrite').objectStore(oStore);

		if (!multi) {
			// einzelnes Object
			updateRequest = objectStore.put(newObject);
			updateRequest.onsuccess = function(event){
				console.log("IDB: item", newObject.id, "replaced");
				callback();
			}
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
				}
			}
		}

		connection.close();
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// Update eines Documents durch Zusammenführung (optional überscheiben)
function db_updateData(callback, newObjects, oStore, overwrite) {
	if (typeof overwrite == "undefined") {overwrite = false;}
	if (typeof oStore == "undefined") {oStore = klasse;}

	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction(oStore, 'readwrite').objectStore(oStore);
		var transaction = objectStore.openCursor()
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor) {
				id = cursor.value.id;
				if (newObjects.hasOwnProperty(id.toString())) {
					var toUpdate = (overwrite) ? newObjects[id] : mergeDeep(cursor.value, newObjects[id]);
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
	var db = indexedDB.open(dbname, dbversion);
	db.onerror = errorHandler;
	db.onsuccess = function(event){
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
						console.log("indexDB: ID", id, "applied");
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
	console.log("IDB: operation went wrong:");
	console.log("IDB:", event);
	return;
}

// Belegte Connection
function blockHandler(event) {
	console.log("DB is blocked !", event.target.result);
}