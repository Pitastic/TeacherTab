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
		'leistungen' : {
			'mndl' : {},
			'fspz' : {},
			'schr' : {},
		},
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
	request.onsuccess = function(event, rowlist){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], "readwrite").objectStore(klasse);
		var rowlist = [];
		// -- FCK js Object-Handling
		row = JSON.stringify(
			{
			'name' : {
				'nname':"",
				'vname':"",
				'sex':"-",
			},
			'mndl' : {},
			'fspz' : {},
			'schr' : {},
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
		})
		// Concat massenAdd if present
		var newName;
		if (Array.isArray(data[0])) {
			for (var i = 0; i < data.length; i++) {
				newName = JSON.parse(row);
				newName.name.vname = data[i][1];
				newName.name.nname = data[i][0];
				newName.name.sex = "-";
				rowlist.push(newName);
				newName = null;
			}
		}else{
			newName = JSON.parse(row);
			newName.name.vname = data[0];
			newName.name.nname = data[1];
			newName.name.sex = "-";
			rowlist.push(newName);
			newName = null;
		}

		putNext(0);
		function putNext(iterator) {
			if (iterator<rowlist.length) {
				objectStore.put(rowlist[iterator]).onsuccess = function(){putNext(iterator+1)};
			} else {   // complete
				console.log("indexedDB: Schüler eingefügt");
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


// neue Leistung in aktueller Klasse anlegen
function neueLeistung(callback, art, Leistung) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		var transaction = objectStore.openCursor()
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var id, cursor = event.target.result;
			if (cursor && cursor.value.id == 0) {
				new_entry = cursor.value;
				new_entry.leistungen[art][Leistung.id] = Leistung;
				var requestUpdate = cursor.update(new_entry);
				requestUpdate.onsuccess = function() {
					console.log("indexedDB: ID", Leistung.id,"updated...")
					connection.close();
					callback();
				};
			}
		}
		
		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		};

	}
}


// Leistung aus aktueller Klasse löschen
function deleteLeistung(callback, art, id) {
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


// ID aus der aktuellen Klasse lesen (default => Array mit allen)
function readData(callback, id) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse]).objectStore(klasse);
		//id = (id == null) ? 0 : parseInt(id);
		var result = {};
		if (id || id == 0) {
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


// Objekt (mit Tiefe von 0 bis 1) updaten in aktueller Klasse
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


// Schüler-Objekte der Leistungen in aktueller Klasse aktualisieren
function updateLeistung(callback, art, newObjects) {
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
				if (id in newObjects) {
					toUpdate = cursor.value;
					// Objekte vereinen
					if (id == 0) {
						// Eine Ebene tiefer bei ID 0
						for (l_id in newObjects[id]){
							Object.assign(toUpdate.leistungen[art][l_id]['Verteilungen'], newObjects[id][l_id]['Verteilungen']);
						}
					}else{
						toUpdate[art] = Object.assign(toUpdate[art], newObjects[id][art]);
					}
					var requestUpdate = cursor.update(toUpdate);
					requestUpdate.onsuccess = function() {
						console.log("indexedDB: Leistung geupdated bei ID", id, "...");
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


// Durchschnitte von Leistungen aktualisieren (default = alles bei allen)
function updateSchnitt(callback, id) {
	var request = indexedDB.open(dbname, dbversion);
	request.onerror = errorHandler;
	request.onsuccess = function(event){
		var connection = event.target.result;
		var objectStore = connection.transaction([klasse], 'readwrite').objectStore(klasse);
		var transaction = objectStore.openCursor();
		transaction.onerror = errorHandler;
		transaction.onsuccess = function(event){
			var ds_art, Student, cursor;
			var art = ["mndl","fspz","schr"];
			cursor = event.target.result;
			if (cursor){
				if ((!id && cursor.value.id) || (id && id == cursor.value.id)) {					
					Student = cursor.value;
					// Durchschnitt aller Bereiche
					for (var i = 0; i < art.length; i++) {
						ds_art = "o"+art[i];
						if (ds_art == "ofspz") {
							// Spezialfall Fspz und Verrechnung mit Mndl beachten
							Student.gesamt["ofspz"] = schnitt(Student[art[i]], true);
							Student.gesamt['omndl'] = schnitt_m_f(Student.gesamt['omndl'], Student.gesamt['ofspz'].Gesamt);						
						}else{
							Student.gesamt[ds_art] = schnitt(Student[art[i]], false);
						}
					}
					// Kategorien
					// -- (calc_KatDS [all.js])
					// Erst möglich, wenn Rohpunkt-Leistungen implementiert sind
					// --
					// Durchschnitt insgesamt
					if (Student.gesamt['omndl'] && Student.gesamt['schriftlich']){
						Student.gesamt.rechnerisch = Student.gesamt['omndl']*SETTINGS.gewichtung['mündlich'] + Student.gesamt['oschr']*SETTINGS.gewichtung['schriftlich']
					}else{
						Student.gesamt.rechnerisch = 0;
					}
					// Speichern
					var requestUpdate = cursor.update(Student);
					requestUpdate.onerror = errorHandler;
					requestUpdate.onsuccess = function() {
						console.log("indexDB: Durchschnitt ID", Student.id, "updated...")
					};
				}
				cursor.continue();
			}else{
				callback();
			}
		connection.close();
		}

		// ---> Garbage Collection
		connection.onversionchange = function(event) {
			connection.close();
		}

	};
}


function updateVerteilung(inputs, Pkt_Verteilung, callback){
//--> Verteilungen ändern, in DB, (laden der Verteilung als callback) ?
	// =======
	//	var alleSchuler = document.getElementById('arbeit_leistung');
	// =======
	/*
	In SessionStorage packen ????
	if (inputs.length>1) {
		for (i=0; i<inputs.length;i++){
			wertArray[i] = parseFloat(inputs[i].value);
			sessionStorage.setItem(Pkt_Verteilung+'_Kat'+(i+1), wertArray[i]);
		}
		sessionStorage.setItem(Pkt_Verteilung+'_Gesamt', sum(wertArray));
	}
	*/
	var i, maxPts, wertArray = [];
	var art = sessionStorage.getItem('leistung_art');
	var l_id = sessionStorage.getItem('leistung_id');
	var newObject = { 0: {}};
	if (inputs.length>1) {
		// Kategorien
		for (i=0; i<inputs.length;i++){
			wertArray[i] = parseFloat(inputs[i].value);
		}
		maxPts = sum(wertArray);
	}else{
		// MaxPts
		wertArray = [0, 0, 0, 0]
		maxPts = inputs[0].value;
	}
	// DB - Object
	newObject[0][l_id] = {'Verteilungen':{},};
	newObject[0][l_id]['Verteilungen'][Pkt_Verteilung] = {
		'Kat1': wertArray[0],
		'Kat2': wertArray[1],
		'Kat3': wertArray[2],
		'Kat4': wertArray[3],
		'Gesamt': maxPts,
	}
	
	// in DB speichern
	updateLeistung(function(result){
		//updateVerteilungHTML(Pkt_Verteilung);
		void(0);

	// Save in SessionStoreage
	if (inputs.length>1){
		for (var i = 0; i < wertArray.length; i++) {
			sessionStorage.setItem(Pkt_Verteilung+'_Kat'+(i+1), wertArray[i]);
		}
		sessionStorage.setItem(Pkt_Verteilung+'_Gesamt', maxPts);
		//updateVerteilungHTML(Pkt_Verteilung);
		void(0);
	}else{
		sessionStorage.setItem('Standard_Gesamt', maxPts);
	}
	
	// ==== Schülerleistung neuberechnen für ggf. geänderte Verteilung
	//	updateNoten(alleSchuler, false);
	// ====

	if (callback != null) {callback(result);}
	
	}, art, newObject);
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