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
// ============ DEV Notizen============================= //
// ===================================================== //
/*
> löschen von Schülern, Leistungen und ganzen Klassen
	gleich synchronisieren
*/

// ===================================================== //
// == grundlegende Datenbankinteraktionen=============== //
// ===================================================== //

// Alle Klassen auflisten
function listKlassen(callback) {
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
function neueKlasse(bezeichnung) {
	dbversion = localStorage.getItem("dbversion");
	dbversion = parseInt(dbversion) + 1
	localStorage.setItem("dbversion", dbversion);
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		addSettings(connection);

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();

		};
	}
	request.onupgradeneeded = function(event){
		var connection = event.target.result;
		if (!connection.objectStoreNames.contains(bezeichnung)) {
				console.log("indexedDB: creating");
				connection.createObjectStore(bezeichnung, {keyPath: "id", autoIncrement: true});
				klasse = bezeichnung;
				console.log("indexedDB:", bezeichnung, "created");
		}else{
			klasse = bezeichnung;
			console.log("indexedDB:", bezeichnung, "already exists. Do nothing...");
		}
	}
}


// Klassenspezifische Einstellungen anlegen
function addSettings(dbConnection) {
	var objectStore = dbConnection.transaction([klasse], "readwrite").objectStore(klasse);
	row = {
		'id' : 0,
		'fspzDiff' : false,
		'gewichtung' : {
			'mndl' : 0.6,
			'fspz' : 0.2,
			'schr' : 0.4,
		},
		'klasse' : klasse,
		'kompetenzen' : {'Gesamt': "Gesamt", 1:"Kategorie 1", 2:"Kategorie 2", 3:"Kategorie 3", 4:"Kategorie 4"},
		'notenverteilung' : {1:95,2:80,3:75,4:50,5:25,6:0},
		'showVorjahr' : false,
		'studSort' : false,
	}
	objectStore.add(row);
	return;
}


// Klasse löschen
function dropKlasse(bezeichnung, callback) {
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


// Neuen Schüler in Klasse anlegen
function neuerStudent(data, callback) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		row = {
			'name' : {
				'vname' : data[0],
				'nname' : data[1],
				'sex' : "-",
			},
			'mndl' : {
				'alle' : [],
			},
			'fspz' : {
				'alle' : [],
			},
			'schr' : {
				'alle' : [],
			},
			'gesamt' : {
				'omndl': null,
				'ofspz': {
					'gesamt': null,
					'vokabeln': null,
					'grammatik': null,
				},
				'oschr': null,
				'rechnerisch': null,
				'eingetragen': null,
				'vorjahr': null,
			},
			'kompetenzen' : [],
			'changed' : 0,
		}
		var result = objectStore.add(row);
		result.onerror = errorHandler;
		result.onsuccess = function(event){
			var connection = event.target.result;
			if (callback) {callback(connection);}
			console.log("indexedDB:", data[0], data[1], "inserted");
		}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};
	}
	return;
}


// Schüler aus Klasse löschen
function deleteStudent(id) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		var result = objectStore.delete(id);
		result.onerror = errorHandler;
		result.onsuccess = function(event){console.log("indexedDB: Eintrag ID", id, "gelöscht");}
		connection.close();

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();

		};

		return;
	}
}


// ID aus der aktuellen Klasse lesen (default=0, Settings)
function readData(callback, id) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse]).objectStore(klasse);
		id = (id == null) ? 0 : parseInt(id);
		var result = {};
		if (id) {
			var transaction1 = objectStore.get(id)
			transaction1.onerror = errorHandler;
			transaction1.onsuccess = function(event){
				connection2 = event.target.result;
				callback(connection2);
			};
		}else{
			var transaction2 = objectStore.openCursor()
			transaction2.onerror = errorHandler;
			transaction2.onsuccess = function(event){
				var cursor = event.target.result;
				if (cursor) {
					result[cursor.key] = cursor.value;
					cursor.continue();
				}else{
					callback(result);
				}
			}
		}
	}
}


// Objekt (jeder Art) updaten in aktueller Klasse
function updateData(callback, newObjects) {
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
				console.log(id);
				console.log(cursor.key);
				if (id in newObjects) {
					toUpdate = cursor.value;
					for (k in newObjects[id]){
						toUpdate[k] = newObjects[id][k];
					}
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("indexDB: ID", id,"updated...")
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