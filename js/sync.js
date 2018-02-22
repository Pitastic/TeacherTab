/*
- Funktionen von Sync-Funktion trennen
- DOM-Manipulation in *.js oder all.js in eigene Funktion schieben
- DEV-Note in all.js - formStudent() über generating IDs
*/

function testCreds(callback) {
// eingetragene Credentials testen
	$.ajax({
		url: SyncServer + '/' + btoa(userID) + '/check/',
		type: 'GET',
		headers: {
			"Authorization": "Basic " + btoa(userID + ":" + passW)
		},
		timeout: 4000,
		success: function(jqXHR, status, data){
			callback(data.status);
		},
		error: function(jqXHR, status, data){
			callback(data.status);
		},
	});
}

function sync_getAccount(callback, localAccount) {
// Klassenliste und Metainfos für den Benutzer abfragen, mergen und weitergeben
	if (AUTH) {
		console.log("ACCOUNT: sync/merge");
		$.ajax({
			url: SyncServer + '/' + btoa(userID) + '/account',
			type: 'GET',
			headers: {
				"Authorization": "Basic " + btoa(userID + ":" + passW)
			},
			timeout: 4000,
			success: function(data, status, jqXHR){
				// GET
				var newData = (data.payload && isObject(data.payload)) ? decryptData(data.payload.data) : {};
				// Merge
				var merged = mergeAccount(newData, localAccount);
				// Save and Push back
				db_replaceData(function(){
					sync_pushBack(callback, merged, "account");
				}, merged, "account");
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync des Accounts durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(localAccount); 
			},
		});
	}else{
		callback(localAccount);
	}
}


function sync_getKlasse(callback, classObjectArray) {
// Eine Klasse des Benutzers abfragen, mergen und weitergeben

	var klassenHash = classObjectArray[0];
	// Klasse vorhanden oder nur Hash übereben ?
	klassenObject = (classObjectArray.length === 1) ? {} : classObjectArray[1];
	console.log(klassenObject);

	if (AUTH) {
		console.log("SYNC:", klassenHash);
		$.ajax({
			url: SyncServer + '/' + btoa(userID) + '/class/' + klassenHash,
			type: 'GET',
			headers: {
				"Authorization": "Basic " + btoa(userID + ":" + passW)
			},
			timeout: 4000,
			success: function(data, status, jqXHR){
				// GET Klasse
				//DEV console.log("SYNC local:", klassenObject);
				var newData = (data.payload && isObject(data.payload)) ? decryptData(data.payload.data) : {};
				//DEV console.log("SYNC recieved:", newData);
				// Merge Klasse
				var merged = mergeKlasse(newData, klassenObject);
				if (merged) {
					//DEV console.log("SYNC merged to:", merged);
					// (Create)
					db_neueKlasse(function(){
						// Save lokal
						db_replaceData(function(){
							// Push zurück zu Server
							sync_pushBack(callback, merged, ["class", klassenHash]);
						}, merged, klassenHash, true);
					}, klassenHash, merged[1].name)
				}else{
					alert("Die Klasse konnte nicht abgerufen werden, weil weder auf dem Server noch auf deinem Gerät Daten dazu gefunden wurden !\nDer Eintrag ist eine Karteileiche !");
				}
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync der Klasse "+klassenObject.name+" ("+klassenHash+") durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(klassenObject); 
			},
		});
	}else{
		callback(klassenObject);
	}
}


function sync_getMultiKlasses(callback, klassenListe) {
// Mehrere Klasse des Benutzers abfragen, mergen und weitergeben
	if (AUTH) {
		var hashList = ""; // Join Klassenhashes aus den Objekten zu kommagetrennter Liste
		$.ajax({
			url: SyncServer + '/' + btoa(userID) + '/classes',
			type: 'GET',
			dataType: 'json',
			data: { 'ids' : hashList },
			headers: {
				"Authorization": "Basic " + btoa(userID + ":" + passW)
			},
			timeout: 4000,
			success: function(data, status, jqXHR){
				/*
				Klassen abrufen und mergen (eigene Funtkion)
				*/
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync der Klassenliste", hashList, "durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(klassenObject); 
			},
		});
	}else{
		callback(klassenObject);
	}
}

function sync_pushBack(callback, Data, uri) {
// Daten an den Server schicken (generic Function)
	if (AUTH) {
		// keine lokalen Daten pushen
		var pushData = Object.assign({}, Data);
		if (pushData.hasOwnProperty('local')) {pushData.local = null;}
		var encrypted = encryptData(pushData);
		var url = (Array.isArray(uri)) ? uri.filter(function (val) {return val;}).join("/") : uri;
		url = "/" + url + "/";
		$.ajax({
			url: SyncServer + '/' + btoa(userID) + url,
			type: 'PUT',
			dataType: 'json',
			data: { 'payload' : encrypted },
			headers: {
				"Authorization": "Basic " + btoa(userID + ":" + passW)
			},
			timeout: 4000,
			success: function(data, status, jqXHR){
				//DEV console.log("Push:", pushData);
				//DEV console.log("Response:", jqXHR);
				console.log("SYNC:", data.payload, " changed dataset(s) on server");
				callback(Data); // Callback bekommt gepushten Daten im Klartext
			},
			error: function(data, status, jqXHR){
				console.log("Failed !", data);
			},
		});
	}else{
		console.log("Keine Synchronisierung...");
		callback(Data); // Callback bekommt gepushten Daten im Klartext
	}
}

function mergeAccount(newData, localData) {
//-> Metadaten mergen: Grundvorraussetzungen für Folgeoperationen
	var account = createAccount(localData.username);
	account.klassenliste = localData.klassenliste; // wird um lokale Klassenliste ergänzt, wenn Eintrag nicht auf Blacklist
	account.blacklist = localData.blacklist; // wird um lokale Blacklist ergänzt und anschließend ge-uniqued
	account.local = localData.local; // (wird vom Client behalten und nicht gemerged)


	if (Object.keys(newData).length > 0) {

		// Blacklist ergänzen
		if (newData.blacklist) {
			// Konflikt beseitigen (zusammenführen und unique)
			var newBlacklist = localData.blacklist.concat(newData.blacklist);
			account.blacklist = removeDups(newBlacklist);
		}

		// Lokale Klassenliste mit (ggf. neuer) Blacklist bereinigen
		var localHashes = Object.keys(account.klassenliste);
		for (var i = account.blacklist.length - 1; i >= 0; i--) {
			if (localHashes.indexOf(account.blacklist[i]) > -1){
				delete account.klassenliste[account.blacklist[i]];
			}
		}
		
		// Klassenliste ergänzen
		if (Object.keys(newData.klassenliste).length > 0) {
			//DEV console.log("...merge Klassenliste...");
			for (var hash in newData.klassenliste){
				if (account.blacklist.indexOf(hash) === -1) {
					// Hash nicht lokal vorhanden und nicht auf Blacklist
					//DEV console.log("...check Hash", hash);
					if (account.klassenliste.hasOwnProperty(hash)) {
						// -- Konflikt beseitigen (nur neueste übernehmen)
						//DEV console.log("...Konflikt (recieved / lokal)", newData.klassenliste[hash], account.klassenliste[hash]);
						account.klassenliste[hash] = (newData.klassenliste[hash].changed > account.klassenliste[hash].changed) ? newData.klassenliste[hash] : account.klassenliste[hash];
					}else{
						// -- einfach hinzufügen
						//DEV console.log("...einfaches Einfügen", newData.klassenliste[hash]);
						account.klassenliste[hash] = newData.klassenliste[hash];
					}
				}
			}
		}

	}

	return account;
}


function mergeKlasse(newData, localData) {
//-> Klasse mergen: Liste mit Objekten rekursiv zusammenführen
	if(Object.keys(newData).length === 0 && Object.keys(localData).length === 0) {
		// Weder Daten auf Server noch lokal - Something went wrong...
		console.log("MERGE-ERROR: Object-Key ist weder in neuen noch in lokalen Daten vorhanden ?!");
		return false;

	}else if (Object.keys(newData).length === 0) {

		// Es sind keine Daten auf dem Server vorhanden => localData zurückgeben
		console.log("MERGE: no action - return localData");
		return localData;

	}else if (Object.keys(localData).length === 0) {

		// Es sind keine Daten lokal vorhanden => newData zurückgeben
		console.log("MERGE: no action - return newData");
		return newData;

	}else{

		// Es sind Daten vorhanden => TRICKY Merge - Loop
		console.log("MERGE: localData and newData - return TRICKY");
		var Klasse = {};

		// -- Liste mit allen Keys beider Objecte (unique)
		var keyList = Object.keys(localData).concat(Object.keys(newData));
		keyList = removeDups(keyList);

		// -- Loop mittels Key-Liste
		for (var row, i = keyList.length - 1; i >= 0; i--) {
			row = keyList[i]

			if (isObject(newData[row]) && isObject(localData[row])) {

				// -- Konflikt beseitigen (nur neueste übernehmen)
				
				if (newData[row].typ != "student") {
					// changed der Kategorien vergleichen
					//DEV console.log("MERGE: id", row, " NORMAL mode");
					Klasse[row] = (newData[row].changed > localData[row].changed) ? newData[row] : localData[row];

				}else{
					// Attribut 'changed' bei Typ 'student' differenzierter betrachten
					//DEV console.log("MERGE: id", row, "TRICKY mode");
					Klasse[row] = Object.assign({}, localData[row]);
					
					// Name
					delete Klasse[row].name
					Klasse[row].name = (newData[row].name.changed > localData[row].name.changed) ? newData[row].name : localData[row].name;
					
					// Gesamt
					delete Klasse[row].gesamt
					Klasse[row].gesamt = (newData[row].gesamt.changed > localData[row].gesamt.changed) ? newData[row].gesamt : localData[row].gesamt;
					
					// Leistungen mündlich
					// -- Leistungs-Loop
					var leistungsArten = ["mndl", "fspz", "schr"];
					for (var l = leistungsArten.length - 1; l >= 0; l--) {
						var lArt = leistungsArten[l];
						Klasse[row][lArt] = {};
						
						// -- Liste mit allen Keys beider Objecte (unique)
						var artKeyList = Object.keys(localData[row][lArt]).concat(Object.keys(newData[row][lArt]));
						artKeyList = removeDups(artKeyList);

						// -- Alle Leistungen einer Art (nach ID)
						for (var k in artKeyList){
							var lID = artKeyList[k];

							if (isObject(newData[row][lArt][lID]) && isObject(localData[row][lArt][lID])) {
								// -- Konflikt beseitigen (nur neueste übernehmen)
								Klasse[row][lArt][lID] = (newData[row][lArt][lID].changed > localData[row][lArt][lID].changed) ? newData[row][lArt][lID] : localData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, " is TRICKY");

							}else if (isObject(newData[row][lArt][lID]) && !isObject(localData[row][lArt][lID])) {
								// -- nur in neuen Daten vorhanden
								Klasse[row][lArt][lID] = newData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, "von newData");

							}else if (!isObject(newData[row][lArt][lID]) && isObject(localData[row][lArt][lID])) {
								// -- nur in lokalen Daten vorhanden
								Klasse[row][lArt][lID] = localData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, "von localData");

							}else{
								console.log("MERGE-ERROR: art", lArt, ", lID", lID, " ist nirgends vorhanden ?!"); //DEV

							}
						}
					}

				}

			}else if (isObject(newData[row]) && !isObject(localData[row])) {
				// -- nur in neuen Daten vorhanden
				//DEV console.log("MERGE: id", row, "von newData");
				Klasse[row] = newData[row];

			}else if (!isObject(newData[row]) && isObject(localData[row])) {
				// -- nur in lokalen Daten vorhanden
				//DEV console.log("MERGE: id", row, "von localData");
				Klasse[row] = localData[row];

			}
		}

		// merged zurückgeben
		return Klasse;

	}
}

function sync_deleteKlasse(selKlasse){
//>> Fake Delete-Sync bis zur Umstellung
	if (AUTH) {
		console.log("SYNC-ERROR: Löschen von Klassen auf dem Server noch nicht möglich (NOT IMPLEMENTED)");
	}else{
		console.log("SYNC: Kein Account mit entsprechenden Berechtigungen eingerichtet");
	}
}


// DEPRECATED
function showArchiv(old_arr,sel){
	var i;
	var temp_arr = [];
	if (SyncServer){
		$.ajax({
			url:SyncServer+'/ShowAll.py',
			type:'post',
			crossDomain:true,
			data:{
				klasse:klasse,
				user:userID,
			},
			dataType:'json',
			timeout:4000,
			success:function(response,status,jqXHR){
				console.log("Request:", status);
				stbls = response.all_tables;
				for (i=0;i<stbls.length;i++){
					if (old_arr.indexOf(stbls[i])<0){
						temp_arr.push(stbls[i]+"#");
						var opt = new Option("# "+stbls[i]);
						opt.value = "new"+stbls[i];
						sel.appendChild(opt);
					}
				}
			},
			error:function(jqXHR, status, data){console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);},
			}
		);
	}
}

// DEPRECATED
function initSyncSQL(){
//>> Fake Sync bis zur Umstellung der Methode
	popUp("item0Sync");
	var _element = document.getElementById('syncStatus');
	var _elementTxt = document.getElementById('syncText');
	// Fake StatusBar
	setTimeout(function(){
		_element.style.width = "100%";
	},500);
	_element.innerHTML = "Funktion noch nicht verfügbar !";
	document.getElementById('item0Sync').getElementsByClassName('button')[0].classList.remove('hide');
}

function old_initSyncSQL(){
	popUp("item0Sync");
	var _element = document.getElementById('syncStatus');
	var _elementTxt = document.getElementById('syncText');
	// Fake StatusBar
	setTimeout(function(){
		_element.style.width = "100%";
	},500);
	var syncResult;
	if (navigator.onLine && SyncServer) {
		// Sync oder neu anlegen ?
		if (klasse.substring(1,4)=="new") {
			sessionStorage.setItem('klasse',"["+klasse.substring(4,klasse.length));
			createTables("["+klasse.substring(4,klasse.length));
			klasse = "["+klasse.substring(4,klasse.length);
			var str_klasse = klasse.substring(1,klasse.length-1);
			_elementTxt.innerHTML = 'Klasse wird vom Server heruntergeladen!';
		}
		
		// Versionsabgleich Client <-> Server
		sessionStorage.setItem('changed', 0);
		db.transaction(
			function(transaction){transaction.executeSql(
				"SELECT changed FROM " + klasse+" ORDER BY changed DESC LIMIT 1;", [],
				function(transaction, results) {
					var changed = results.rows.item(0).changed;
					console.log("Synchronisiere: "+klasse+" (v"+changed+")");
					// Serverfragen, welche Version neuer ist:
					$.ajax({
						url:SyncServer+'/HowAreYou.py',
						type:'post',
						crossDomain:true,
						data:{
							klasse:klasse,
							changed:changed,
							user:userID,
						},
						dataType:'json',
						timeout:4000,
						success:function(jqXHR, status, data){
							// Switch anhand Result: pushToServer <-> pullFromServer
							data = data.responseJSON;
							console.log("Request:", status, data.result);
							switch (data.result){
								case "newerOnClient":
									console.log("Push Data - Client >>> Server");
									var server_stamp = data.server_version || 0;
									pushToServer(server_stamp, _element);
									break;
								case "newerOnServer":
									console.log("Pull Data - Client <<< Server");
									var client_stamp = data.client_version || 0;
									pullToClient(client_stamp, _element);
									break;
							}
							},
						error:function(jqXHR, status, data){
							console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);
							_element.classList.add('error');
							_element.classList.remove('ok');
							_element.innerHTML = "Kein Sync durchgeführt !";
							document.getElementById('item0Sync').getElementsByClassName('button')[0].classList.remove('hide');
							},
						}
						)
						.done();
				})});
	}else{
		_element.classList.add('error');
		_element.innerHTML = "Kein Sync durchgeführt !";
		document.getElementById('item0Sync').getElementsByClassName('button')[0].classList.remove('hide');
	}
}

function pushToServer(server_stamp, _element) {
console.log("pushing...");
	// dump Client DB as [{key:value}]
	db.transaction(
		function(transaction){transaction.executeSql(
			"SELECT * FROM " + klasse + " WHERE changed > "+server_stamp+";", [], 
			function(transaction, results) {
				var i, row, _fields, _values, col, val, data="";
				for (i = 0; i < results.rows.length; i++) {
					row = results.rows.item(i);
					_fields = [];
					_values = [];
					for (col in row) {
						// Spalten ausschließen:
						if (noSyncCols.indexOf(col) > -1){
							continue;
						}else{
							_fields.push(col);
							val = "'"+row[col]+"'" || "''";
							_values.push(val);
						}
					}
					data += "INSERT OR REPLACE INTO "+klasse+" ("+_fields.join(',')+") VALUES ("+ _values.join(',') + ");";
				}
			$.ajax({
				url:SyncServer+'/pushToServer.py',
				type:'post',
				crossDomain:true,
				data:{
					klasse:klasse,
					user:userID,
					sql:data,
				},
				dataType:'json',
				timeout:4000,
				success:function(data, status, jqXHR){
					console.log("Sync is complete!");
					_element.classList.remove('error');
					_element.classList.add('ok');
					_element.innerHTML = "Fertig !";
				},
				error:function(jqXHR, status, data){console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);},
				}
				)
			.done(function(jqXHR, status, data){
				document.getElementById('item0Sync').getElementsByClassName('button')[0].classList.remove('hide');
			})
			})});
}

function pullToClient(client_stamp, _element) {
console.log("pulling...");
	$.ajax({
		url:SyncServer+'/pullFromServer.py',
		type:'post',
		crossDomain:true,
		data:{
			klasse:klasse,
			user:userID,
			changed:client_stamp,
		},
		dataType:'json',
		timeout:4000,
		success:function(data, status, jqXHR){
			console.log("Request:", status);
				var data = jqXHR.responseJSON.data.split(";");
				var values = jqXHR.responseJSON.values;
				var sql_array = [];
				var i=0;
				for (i=0;i<data.length-1;i++){
					var vlen = values[i].length;
					values[i][0] = parseInt(values[i][0].substring(1,values[i][0].length-1)) || 0;
					values[i][vlen-1] = parseInt(values[i][vlen-1].substring(1,values[i][vlen-1].length)) || 0;
					sql_array.push(data[i]+" ("+values[i].join(',')+")");
				}
				db.transaction(
				function(transaction){
					var i2 = 0;
					for (i2=0;i2<sql_array.length;i2++){
						transaction.executeSql(sql_array[i2]+";",[],function(transaction, results){
							console.log("Eintrag gespeichert");
						}, errorHandler);
					}
				});
				console.log("Sync is complete!");
				_element.classList.remove('error');
				_element.classList.add('ok');
				_element.innerHTML = "Fertig !";
			},
		error:function(jqXHR, status, data){console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);},
		}
		).done(function(jqXHR, status, data){
			document.getElementById('item0Sync').getElementsByClassName('button')[0].classList.remove('hide');
		}
		);
}


function sync_deleteDoc(ID) {
	alert("Syncing: Delete... [disabled]");
	/*
	$.ajax({
		url:SyncServer+'/deleteDoc.py',
		type:'post',
		crossDomain:true,
		data:{
			klasse:klasse,
			user:userID,
			entry:ID,
		},
		dataType:'json',
		error:function(jqXHR, status, data){console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);},
		}
		).done(function(data, status, jqXHR){
			alert("Eintrag vom Gerät und auf dem SyncServer gelöscht !\nTrotzdem musst du diesen Eintrag von jedem Gerät selbst löschen, damit er beim nächsten Sync nicht wieder hinzugefügt wird.");
	});
	*/
}


function old_deleteKlasse(selKlasse){
	// DEV:
	// Beim Löschen auf den Callback von indexedDB & den Sync warten... !
	// ==================================================================
	var syncResult;
	var _element = document.getElementById('syncStatus');
	var _elementTxt = document.getElementById('syncText');
	_elementTxt.innerHTML = "Lösche Klasse";
	popUp("item0Sync");
	setTimeout(function() {
	if (navigator.onLine){
		dropKlasse(selKlasse);
		if (window.confirm('Du bist online.\nSoll die Klasse auch auf dem SyncServer gelöscht werden ?')){
			_elementTxt.innerHTML = "Lösche Klasse von diesem Gerät und vom SyncServer !";
			$.ajax({
				url:SyncServer+'/deleteKlasse.py',
				type:'post',
				crossDomain:true,
				data:{
					klasse:selKlasse,
					user:userID,
				},
				dataType:'json',
				timeout:4000,
				success:function(jqXHR, status, data){syncResult = true;},
				error:function(jqXHR, status, data){
					syncResult = false;
					_elementTxt.innerHTML = "Lösche Klasse nur von diesem Gerät ! (SyncServer nicht erreichbar)";
					},
				}).done(function(){console.log("Response:", status, "Deleted:", syncResult);});
			}else{
				_elementTxt.innerHTML = "Lösche Klasse nur von diesem Gerät !";
				syncResult = false;
			}
	}else{
		_elementTxt.innerHTML = "Lösche Klasse nur von diesem Gerät ! (du bist offline)";
		dropKlasse(selKlasse);
		syncResult = false;
	}
	_element.style.width = "100%";
	setTimeout(function(){
		if (syncResult){
			_element.classList.add('ok');
			_element.innerHTML = "Fertig !";
			document.getElementById('item0Sync').getElementsByClassName('button')[1].classList.remove('hide');
		}else{
			_element.classList.add('error');
			_element.innerHTML = "Keine Änderungen auf SyncServer !";
			document.getElementById('item0Sync').getElementsByClassName('button')[1].classList.remove('hide');
		}},1000);
	}, 600);
}


// -- Gesamtübersicht (X)
// -- Einzelne Leistungen ( )
function export_to_csv (expklasse) {
console.log(klasse, " wird exportiert");
	db.transaction(
		function(transaction){
			transaction.executeSql(
			"SELECT * FROM " + klasse + " ORDER BY nName;", [], 
			function(transaction, results) {
					var columns=['mndl','fspz','schr'];
					var nameDict={};
					var buffer = "";
					var buffer_row="";
					var tempO, row, i;
					for (var i_outer = 0; i_outer < results.rows.length; i_outer++) {
						buffer_row = "";
						row = results.rows.item(i_outer);
						if (!row.id) {
							// - Gesamtuebersicht Header
							if (row.mndl){
								var mndl = JSON.parse(decodeURIComponent(row.mndl));
								var lengthMndl = 0;
								for (i=0; i<mndl.alle.length;i++){
									nameDict[mndl.alle[i]] = mndl[mndl.alle[i]].Bezeichnung;
									lengthMndl++;
								}
							}
							if (row.mndl){
								var fspz = JSON.parse(decodeURIComponent(row.fspz));
								var lengthFspz = 0;
								for (i=0; i<fspz.alle.length;i++){
									nameDict[fspz.alle[i]] = fspz[fspz.alle[i]].Bezeichnung;
									lengthFspz++;
								}
							}
							if (row.schr){
								var schr = JSON.parse(decodeURIComponent(row.schr));
								var lengthSchr = 0;
								for (i=0; i<schr.alle.length;i++){
									nameDict[schr.alle[i]] = schr[schr.alle[i]].Bezeichnung;
									lengthSchr++;
								}
							}
							buffer_row += "Gesamtübersicht\n\n;";
							buffer_row += Array(lengthMndl+1).join("m;");
							buffer_row += Array(lengthFspz+1).join("f;")+"(fspz DS);";
							buffer_row += "mndl (DS);";
							buffer_row += Array(lengthSchr+1).join("s;")+"schr (DS);rechnerisch;Gesamt";
						}else{
							// - Gesamtuebersicht Daten
							buffer_row += row.nName+", "+row.vName+";";
							tempO = JSON.parse(decodeURIComponent(row.mndl));
							for (var key in tempO) {
								if (tempO[key] && !tempO[key].length){
									buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
								}
							}
							tempO = JSON.parse(decodeURIComponent(row.fspz));
							for (key in tempO) {
								if (tempO[key] && !tempO[key].length){
									buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
								}
							}
							buffer_row += JSON.parse(decodeURIComponent(row.ofspz)).Gesamt.toString().replace(".",",")+";";
							buffer_row += row.omndl.toString().replace(".",",")+";";
							tempO = JSON.parse(decodeURIComponent(row.schr));
							for (key in tempO) {
								if (key !== "alle" && tempO[key]){
									buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
								}
							}
							buffer_row += row.oschr.toString().replace(".",",")+";";
							buffer_row += JSON.parse(decodeURIComponent(row.gesamt)).rechnerisch.toPrecision(3)+";";
							buffer_row += JSON.parse(decodeURIComponent(row.gesamt)).eingetragen+";";
						}
						// cache Data bis hier hin
						buffer += buffer_row+"%0A";
					}
					var eintragung;
					var Leistung;
					buffer += "%0A";
					for (var i=0; i<columns.length;i++){
						eintragung = null;
						row = results.rows.item(0);
						var oHeader = JSON.parse(decodeURIComponent(row[columns[i]]));
						for (var i2=0;i2<oHeader.alle.length;i2++){
							buffer_row = "";
							var _id = oHeader.alle[i2];
							// Header-Daten
							eintragung = oHeader[_id].Eintragung;
							buffer_row += oHeader[_id].Bezeichnung+";("+[columns[i]]+");;Art :;"+eintragung+";\n"+oHeader[_id].Datum+";%0A";
							if (eintragung == "Rohpunkte"){
								buffer_row += ";;Kat. 1;Kat. 2;Kat. 3;Kat. 4;Gesamt;Prozent;Note;%0A";
								for (var v in oHeader[_id].Verteilungen){
									buffer_row += "Verteilung: "+oHeader[_id].Verteilungen[v]+";;"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat1+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat2+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat3+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat4+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Gesamt+";-;-;%0A";
								}
							}else if (eintragung == "Punkte") {
								var maxPts = oHeader[_id].Standard.Gesamt;
								buffer_row += ";;Max.;"+maxPts+";;Punkte;Note;;;%0A";
							}else{
								buffer_row += ";;Note;;;;;;;%0A";
							}
							buffer_row += "%0A";
							// Schüler-Daten
							for (i_outer = 0; i_outer < results.rows.length; i_outer++) {
								row = results.rows.item(i_outer);
								if (row.id){
									tempO = JSON.parse(decodeURIComponent(row[columns[i]]))[_id] || {};
									if (eintragung=="Noten"){
										Leistung = tempO.Note || "-";
										buffer_row += row.nName+", "+row.vName+";;"+Leistung+";;;;;;;%0A";
									}else if (eintragung=="Punkte"){
										Leistung = (tempO.Mitschreiber == "true") ? ";;;"+tempO.Gesamt+";"+tempO.Note+";;;" : ";;;-;-;;;";
										buffer_row += row.nName+", "+row.vName+";;"+Leistung+";%0A";                                    	
									}else{
										Leistung = (tempO.Mitschreiber == "true") ? tempO.Kat1+";"+tempO.Kat2+";"+tempO.Kat3+";"+tempO.Kat4+";"+tempO.Gesamt+";"+tempO.Prozent.replace(".",",")+";"+tempO.Note+";"+tempO.Verteilung : "-;-;-;-;-;-;-;-";
										buffer_row += row.nName+", "+row.vName+";;"+Leistung+";%0A";
									}
								}
							}
							buffer += "%0A%0A%0A"+buffer_row;
						}
						
					}
					// download stuff
					// - Datei Download
					var link = document.getElementById('export_to_csv');
					var fileName = "export.csv";
					if (true) {
					//if(link.download !== undefined) { // feature detection
						// Browsers that support HTML5 download attribute
						// Replace NewLine Zeichen
						buffer = buffer.replace(/%0A/g,"\n");
						var blob = new Blob([buffer], {
							"type": "text/csv;charset=utf8;"			
						});
						link.setAttribute("href", window.URL.createObjectURL(blob));
						link.setAttribute("download", fileName);
					 } else {
						// Weiterleitung mit GET-Übergabe
						link.setAttribute("href", link.getAttribute('href')+"?csv="+escape(buffer));
					}
				}
			);
		}
	);
}


function import_sql(sql_string_1, sql_string_2) {
	//INSERT INTO
	db.transaction(
		function(transaction){
		transaction.executeSql(
		sql_string_1+';', [], alert("Table erstellt"), errorHandler);
		});
	db.transaction(
		function(transaction){
		transaction.executeSql(
		sql_string_2+';', [], alert("Einträge erstellt"), errorHandler);
		});
}


// =================================================== //
// ================ Helper Functions ================= //
// =================================================== //


function encryptData(readAble){
//-> Daten verschlüsseln
	if (readAble != "" && readAble) {
		readAble = JSON.stringify(readAble);
		return CryptoJS.AES.encrypt(readAble, passW).toString();
	}else{
		return "";
	}
}

function decryptData(unKnown){
//-> JSON Daten entschlüsseln
	var readAble = CryptoJS.AES.decrypt(unKnown, passW).toString(CryptoJS.enc.Utf8);
	return JSON.parse(readAble);
}

function hashData(readAble){
//-> Daten hashen
	return CryptoJS.SHA1(readAble).toString();
}