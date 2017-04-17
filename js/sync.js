function showArchiv(old_arr,sel){
    var i;
    var temp_arr = [];
    if (serverIP){
        $.ajax({
            url:serverIP+'/ShowAll.py',
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

function initSyncSQL(){
    popUp("item0Sync");
    var _element = document.getElementById('syncStatus');
    var _elementTxt = document.getElementById('syncText');
    // Fake StatusBar
    setTimeout(function(){
        _element.style.width = "100%";
    },500);
    var syncResult;
    if (navigator.onLine && serverIP) {
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
                        url:serverIP+'/HowAreYou.py',
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
                url:serverIP+'/pushToServer.py',
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
        url:serverIP+'/pullFromServer.py',
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


function deleteStudent(studID) {
    $.ajax({
        url:serverIP+'/deleteStudent.py',
        type:'post',
        crossDomain:true,
        data:{
            klasse:klasse,
            user:userID,
            studID:studID,
        },
        dataType:'json',
        error:function(jqXHR, status, data){console.log("ERROR (status, jqXHR, data):", status, jqXHR, data);},
        }
        ).done(function(data, status, jqXHR){
            alert("Schüler vom Gerät und auf dem SyncServer gelöscht !\nTrotzdem musst du diesen Schüler von jedem Gerät selbst löschen, damit er beim Sync nicht wieder hinzugefügt wird.");
    });
}


function deleteKlasse(selKlasse){
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
                url:serverIP+'/deleteKlasse.py',
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