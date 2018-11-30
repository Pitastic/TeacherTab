"use strict";var GLOBALS={"AUTH":null,"userID":null,"passW":null,"SyncServer":"c/api","timeout":6000,"appversion":"1.1","dbname":null,"dbversion":null,"dbToGo":null,"dbFinished":null,"noSyncCols":null,"klasse":null,"klassenbezeichnung":null,"knownDevice":null,"perfStart":null,"perfEnd":null,"deferredPrompt":null};var SETTINGS;window.addEventListener("load",function(){GLOBALS.noSyncCols=["vorjahr"];if(localStorage.getItem("TeacherTab")){GLOBALS.userID=localStorage.getItem("userID");GLOBALS.passW=localStorage.getItem("passW");GLOBALS.klasse=sessionStorage.getItem("klasse");GLOBALS.dbname=GLOBALS.userID;GLOBALS.dbversion=parseInt(localStorage.getItem("dbversion_"+GLOBALS.userID));GLOBALS.knownDevice=true}else{GLOBALS.knownDevice=false}$.stayInWebApp("a.stay");checkAuth()});function addListener(){var add=document.getElementById("btn_Add");add.onclick=function(){popUp(add.getAttribute("data-name"))}}function closeListener(){var closeX=document.getElementsByClassName("close");var i;for(i=0;i<closeX.length;i++){closeX[i].getElementsByTagName("a")[0].onclick=function(){popUpClose(this)}}}function Schuljahre(){var selectBox=document.getElementById("jahrKlasse");var copyBox=document.getElementById("jahrCopyKlasse");var thisYear=new Date().getFullYear()-1;var nextYear=(thisYear+1).toString().substring(2,4);var opt,opt2;opt=new Option(thisYear+" / "+nextYear+" (2. Hj.)");opt2=new Option(thisYear+" / "+nextYear+" (2. Hj.)");selectBox.appendChild(opt);copyBox.appendChild(opt2);thisYear=thisYear+1;nextYear=(thisYear+1).toString().substring(2,4);opt=new Option(thisYear+" / "+nextYear+" (1. Hj.)");opt2=new Option(thisYear+" / "+nextYear+" (1. Hj.)");selectBox.appendChild(opt);copyBox.appendChild(opt2);opt=new Option(thisYear+" / "+nextYear+" (2. Hj.)");opt2=new Option(thisYear+" / "+nextYear+" (2. Hj.)");selectBox.appendChild(opt);copyBox.appendChild(opt2)}function loadVerteilung(Pkt_Verteilung){if(Pkt_Verteilung==null){Pkt_Verteilung="Standard"}return}function updateNoten(liste,bol_singel,newObs_init){var newObs;if(newObs_init==null){updateNotenHTML(liste,bol_singel);return}else if(Array.isArray(newObs_init)){newObs={};for(var k=0;k<newObs_init.length;k++){newObs[newObs_init[k].id]=newObs_init[k]}}else{newObs=newObs_init}var i,gesamtWert,erreicht,note,span;liste=bol_singel?[liste]:liste.getElementsByTagName("li");var lART=sessionStorage.getItem("leistung_art");var lID=parseInt(sessionStorage.getItem("leistung_id"));for(i=0;i<liste.length;i++){var sID=parseInt(liste[i].getAttribute("data-rowid").substring(4));if(liste[i].querySelector("[data-name=Gesamt]")){span=liste[i].getElementsByClassName("Note")[0].getElementsByTagName("span");var erreicht_prozent;if(newObs[sID][lART][lID]&&newObs[sID][lART][lID].Mitschreiber==true){gesamtWert=sessionStorage.getItem(newObs[sID][lART][lID].Verteilung+"_Gesamt");erreicht=newObs[sID][lART][lID].Gesamt||0;erreicht_prozent=Math.round(erreicht/gesamtWert/0.005)*0.5;note=RohpunkteAlsNote(erreicht_prozent,false);span[0].innerHTML=note;span[1].innerHTML=erreicht_prozent+" %";newObs[sID][lART][lID].Gesamt=erreicht;newObs[sID][lART][lID].Note=note;newObs[sID][lART][lID].Prozent=erreicht_prozent}else{span[0].innerHTML="-";span[1].innerHTML="%"}}else{span=liste[i].getElementsByClassName("Note standalone")[0].getElementsByTagName("span")[0];if(newObs[sID][lART][lID]&&newObs[sID][lART][lID].Mitschreiber==true){gesamtWert=sessionStorage.getItem("Standard_Gesamt");erreicht=parseFloat(liste[i].getElementsByClassName("Gesamtpunkte")[0].getElementsByTagName("span")[0].innerHTML);erreicht_prozent=Math.round(erreicht/gesamtWert/0.005)*0.5;note=RohpunkteAlsNote(erreicht_prozent,false);span.innerHTML=note;newObs[sID][lART][lID].Note=note}else{span.innerHTML="-"}}}return newObs}function updateNotenHTML(liste,bol_singel){var i,gesamtWert,erreicht,note,span;liste=bol_singel?[liste]:liste.getElementsByTagName("li");setTimeout(function(){for(i=0;i<liste.length;i++){if(liste[i].querySelector("[data-name=Gesamt]")){gesamtWert=sessionStorage.getItem(liste[i].getAttribute("data-verteilung")+"_Gesamt");erreicht=parseFloat(liste[i].querySelector("[data-name=Gesamt]").innerHTML);erreicht=Math.round(erreicht/gesamtWert/0.005)*0.5;note=RohpunkteAlsNote(erreicht,false);span=liste[i].getElementsByClassName("Note")[0].getElementsByTagName("span");span[0].innerHTML=liste[i].getAttribute("data-mitschreiber")=="true"?note:"-";span[1].innerHTML=erreicht+" %"}else{gesamtWert=sessionStorage.getItem("Standard_Gesamt");erreicht=parseFloat(liste[i].getElementsByClassName("Gesamtpunkte")[0].getElementsByTagName("span")[0].innerHTML);erreicht=Math.round(erreicht/gesamtWert/0.005)*0.5;note=RohpunkteAlsNote(erreicht,false);span=liste[i].getElementsByClassName("Note standalone")[0].getElementsByTagName("span")[0];span.innerHTML=liste[i].getAttribute("data-mitschreiber")=="true"?note:"-"}}},10)}function RohpunkteAlsNote(val,bol_15pkt){if(val||val==0){var i;if(!bol_15pkt){for(i=1;i<6;i++){if(val>=parseFloat(SETTINGS.notenverteilung[i])){return i}}return 6}else{for(i=15;i>0;i--){if(val>=parseFloat(SETTINGS.notenverteilung[i])){return i}}}}else{return"-"}}function updateStatus(progress,statustext,statustitle,elements,error){if(document.getElementById("item0Sync")){if(!elements||elements==[]||typeof elements=="undefined"){elements=false}var el_statusbar=elements?elements[0]:document.getElementById("syncStatus");var el_statustitle=elements?elements[1]:document.getElementById("syncText");var el_statustext=elements?elements[2]:document.getElementById("syncInnerText");el_statusbar.style.width=progress.toString()+"%";if(statustitle||statustitle==""){el_statustitle.innerHTML=statustitle}if(statustext||statustext==""){el_statustext.innerHTML=statustext}if(progress>=100&&!error){el_statusbar.classList.add("ok");el_statusbar.classList.remove("error")}else if(error){el_statusbar.style.width="100%";el_statusbar.classList.remove("ok");el_statusbar.classList.add("error")}}return}function isObject(item){return item&&typeof item==="object"&&!Array.isArray(item)}function objLength(obj){var size=0,key;for(key in obj){if(obj.hasOwnProperty(key))size++}return size}function mergeObjects(old1,new1){for(var k in new1){if(typeof new1[k]=="object"){Object.assign(old1[k],new1[k])}else{old1[k]=new1[k]}}return old1}function mergeDeep(target){for(var _len=arguments.length,sources=new Array(_len>1?_len-1:0),_key=1;_key<_len;_key++){sources[_key-1]=arguments[_key]}if(!sources.length)return target;var source=sources.shift();if(isObject(target)&&isObject(source)){for(var key in source){if(isObject(source[key])){if(!target[key])Object.assign(target,{[key]:{}});mergeDeep(target[key],source[key])}else{Object.assign(target,{[key]:source[key]})}}}return mergeDeep.apply(void 0,[target].concat(sources))}function checkAuth(){GLOBALS.AUTH=localStorage.getItem("auth")=="true"?true:false;return}function sum(n){var i,r=0;for(i=0;i<n.length;i++){r+=parseInt(n[i])}return r}function removeDups(a,filter){if(typeof filter=="undefined"){filter=[]}var seen={};var out=[];var len=a.length;var j=0;for(var i=0;i<len;i++){var item=a[i];if(seen[item]!==1){seen[item]=1;if(filter){if(filter.indexOf(item)===-1&&filter.indexOf(item.toString())===-1&&filter.indexOf(parseInt(item))===-1){out[j++]=item}}else{out[j++]=item}}}return out}function compareKlassen(a,b){if(a[1].bezeichnung<b[1].bezeichnung)return-1;if(a[1].bezeichnung>b[1].bezeichnung)return 1;return 0}function compareStudents(a,b){if(SETTINGS.studSort){var a_sort=a.name.sort?a.name.sort+">":"zzz>";var a_name=a.name.nname+">"+a.name.vname;var b_sort=b.name.sort?b.name.sort+">":"zzz>";var b_name=b.name.nname+">"+b.name.vname;return(a_sort+a_name).localeCompare(b_sort+b_name)}else{return(a.name.nname+">"+a.name.vname).localeCompare(b.name.nname+">"+b.name.vname)}}function datum(numeric,given){var d;if(!given){d=new Date}else{d=new Date(given)}var monate=["Januar","Februar","M\xE4rz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];var tag,monat,jahr;tag=d.getDate();if(!numeric){monat=monate[d.getMonth()];jahr=d.getFullYear();return tag+". "+monat+" "+jahr}else{var options={year:"numeric",month:"2-digit",day:"2-digit"};return d.toLocaleDateString("de-DE",options)}}function timestamp(){return Math.round(new Date().getTime()/1000)}function uniqueID(){var part_ts=new Date().getTime().toString().substring(2);part_ts+=GLOBALS.dbToGo;var nav=window.navigator;var screen=window.screen;var part_guid=nav.mimeTypes.length;part_guid+=nav.plugins.length;part_guid+=screen.height||"";part_guid+=screen.width||"";part_guid+=screen.pixelDepth||"";var id=parseInt(part_ts+part_guid)||parseInt(part_ts);return id}function uniqueClassID(klassenname){return hashData(klassenname+timestamp())}function stampImport(importData,stamp){if(typeof stamp=="undefined"){stamp=timestamp()}for(var key in importData){if(importData.hasOwnProperty(key)){if(importData[key].typ=="leistung"||importData[key].typ=="settings"){importData[key].changed=stamp}if(importData[key].typ=="student"){importData[key].name.changed=stamp;importData[key].gesamt.changed=stamp;var leistung;for(leistung in importData[key].fspz){importData[key].fspz[leistung].changed=stamp}for(leistung in importData[key].mndl){importData[key].mndl[leistung].changed=stamp}for(leistung in importData[key].schr){importData[key].schr[leistung].changed=stamp}}}}return importData}function schnitt_gesamt(Student,Leistungen){var ds_art;var art=["mndl","fspz","schr"];var i;for(i=0;i<art.length;i++){ds_art="o"+art[i];if(ds_art=="ofspz"){Student.gesamt["ofspz"]=schnitt(Student[art[i]],true);Student.gesamt["omndl"]=schnitt_m_f(Student.gesamt["omndl"],Student.gesamt["ofspz"].Gesamt)}else{Student.gesamt[ds_art]=schnitt(Student[art[i]],false)}}if(Student.gesamt["omndl"]&&Student.gesamt["oschr"]){Student.gesamt.rechnerisch=Student.gesamt["omndl"]*SETTINGS.gewichtung["m\xFCndlich"]+Student.gesamt["oschr"]*SETTINGS.gewichtung["schriftlich"]}else{Student.gesamt.rechnerisch=Student.gesamt["omndl"]||Student.gesamt["oschr"]||0}var kompetenzen=[0,0,0,0,0];var Infos,temp_leistung,i2;for(i2=0;i2<Leistungen.length;i2++){Infos=Leistungen[i2];temp_leistung=Student[Infos.subtyp][Infos.id];if(temp_leistung&&temp_leistung.Mitschreiber&&temp_leistung.Verteilung){var hundertProzent=Infos.Verteilungen[temp_leistung.Verteilung];kompetenzen[0]+=temp_leistung.Kat1/hundertProzent.Kat1;kompetenzen[1]+=temp_leistung.Kat2/hundertProzent.Kat2;kompetenzen[2]+=temp_leistung.Kat3/hundertProzent.Kat3;kompetenzen[3]+=temp_leistung.Kat4/hundertProzent.Kat4;kompetenzen[4]+=1}}Student.kompetenzen=[Math.round(kompetenzen[0]/kompetenzen[4]*100)/100||0,Math.round(kompetenzen[1]/kompetenzen[4]*100)/100||0,Math.round(kompetenzen[2]/kompetenzen[4]*100)/100||0,Math.round(kompetenzen[3]/kompetenzen[4]*100)/100||0];return Student}function schnitt(_obj,bol_fspz){var _row,r=0;var iAnz=0;var _Gra={};var _Vok={};if(!bol_fspz){if(_obj=={}){return""}else{for(_row in _obj){iAnz+=_obj[_row].Gewichtung;r=r+parseFloat(_obj[_row].Note*_obj[_row].Gewichtung)}return Math.round(r/iAnz*100)/100||""}}else{for(_row in _obj){if(_obj[_row].Bezeichnung=="Grammatik"){_Gra[_row]=_obj[_row]}else if(_obj[_row].Bezeichnung=="Vokabeln"){_Vok[_row]=_obj[_row]}}return{Vokabeln:schnitt(_Vok)||"",Grammatik:schnitt(_Gra)||"",Gesamt:schnitt(_obj)}}}function schnitt_m_f(omndl,ofspz){var gew_fspz=SETTINGS.gewichtung["davon fachspezifisch"];var gew_mndl0=1-gew_fspz;if(ofspz>0&&omndl>0){return Math.round((omndl*gew_mndl0+ofspz*gew_fspz)*100)/100||""}else if(omndl){return Math.round(omndl*100)/100||""}else if(ofspz){return Math.round(ofspz*100)/100||""}return""}function itemAbort(names,target_site){var i;for(i=0;i<names.length;i++){document.getElementById(names[i]).classList.remove("show")}setTimeout(function(){window.location=target_site},400)}function slide(){scroll(0,0);var addBtn=document.getElementById("btn_Add");var i,slideElements=document.getElementsByClassName("uebersicht");for(i=0;i<slideElements.length;i++){slideElements[i].classList.toggle("show")}var slideIndex=document.getElementsByClassName("uebersicht show")[0].id;addBtn.setAttribute("data-name",slideIndex+"Add");document.getElementsByClassName("marker")[0].className="marker "+slideIndex;sessionStorage.setItem("lastview",slideIndex)}function slide1(id,location){if(typeof location=="undefined"){var slide=document.getElementById(id);slide.classList.remove("hide");setTimeout(function(){slide.classList.add("show")},250);return}else{setTimeout(function(){window.location=location},500);document.getElementById(id).classList.remove("show")}}function slide2(slideName){scroll(0,0);var addBtn=document.getElementById("btn_Add");document.getElementsByClassName("marker")[0].className="marker "+slideName;var items=["item1","item2"];var slideElement=items.splice(items.indexOf(slideName),1)[0];slideElement=document.getElementById(slideElement);slideElement.classList.add("show");var hideElement=document.getElementById(items[0]);hideElement.classList.remove("show");addBtn.setAttribute("data-name",slideName+"Add");sessionStorage.setItem("lastview",slideName)}function keyFunctions(event){if(event.keyCode==27){var popUp=document.querySelector(".showPop .close a");popUpClose(popUp,false)}}function fspz_Bezeichnung(){var nArt=document.getElementById("notenArt");var gewichtung=document.getElementById("rangeSlide");if(SETTINGS.fspzDiff){var textfield=document.getElementById("notenBezeichnung");var selectfield=document.getElementById("notenBezeichnung_Select");if(nArt.value=="fspz"){textfield.classList.add("hide");selectfield.classList.remove("hide");textfield.value=selectfield.value}else{textfield.classList.remove("hide");selectfield.classList.add("hide")}}if(nArt.value=="fspz"){gewichtung.setAttribute("disabled","disabled");document.getElementById("rangeWert").innerHTML=1;gewichtung.value=1}else if(gewichtung.getAttribute("disabled")){gewichtung.removeAttribute("disabled")}return true}function fspz_Bezeichnung2(){document.getElementById("notenBezeichnung").value=document.getElementById("notenBezeichnung_Select").value}function popUp(popWindow){document.getElementById("fadeBlack").classList.remove("hide");setTimeout(function(){document.getElementById(popWindow).classList.add("showPop");document.getElementById("fadeBlack").classList.add("show")},50);window.addEventListener("keydown",keyFunctions)}function popUpClose(thisElement,bol_refresh,keepBlack){if(bol_refresh){db_readMultiData(listStudents,"student");db_readMultiData(listLeistung,"leistung")}thisElement.parentNode.parentNode.classList.remove("showPop");if(!keepBlack){document.getElementById("fadeBlack").classList.remove("show");setTimeout(function(){thisElement.parentNode.parentNode.parentNode.classList.add("hide")},250)}window.removeEventListener("keydown",keyFunctions)}function popUpSwitch(thisElement,target_id){thisElement.parentNode.parentNode.classList.remove("showPop");if(target_id){document.getElementById(target_id).classList.add("showPop")}}function createAccount(accountname){return{"id":1,"username":accountname,"klassenliste":{},"local":[],"blacklist":[]}}function formSettings(id,bezeichnung){return{"id":1,"typ":"settings","changed":0,"fspzDiff":false,"gewichtung":{"m\xFCndlich":0.6,"davon fachspezifisch":0.2,"schriftlich":0.4},"klasse":id,"name":bezeichnung,"kompetenzen":{"Gesamt":"Gesamt",1:"Kategorie 1",2:"Kategorie 2",3:"Kategorie 3",4:"Kategorie 4"},"notenverteilung":{1:95,2:80,3:75,4:50,5:25,6:0},"showVorjahr":false,"studSort":false,"blacklist":[]}}function formStudent(vName,nName,sex){sex=typeof sex=="undefined"?sex:"-";var id=uniqueID();return{"id":id,"typ":"student","name":{"nname":nName,"vname":vName,"sex":sex,"sort":null,"changed":0},"mndl":{},"fspz":{},"schr":{},"gesamt":{"omndl":null,"ofspz":{"gesamt":null,"vokabeln":null,"grammatik":null},"oschr":null,"rechnerisch":null,"eingetragen":null,"vorjahr":null,"changed":0},"kompetenzen":[]}}function formLeistung(art,bezeichnung,datum,eintragung,gewicht){var id=uniqueID();return{"id":id,"typ":"leistung","subtyp":art,"changed":0,"Bezeichnung":bezeichnung,"Datum":datum,"Eintragung":eintragung,"DS":undefined,"Gewichtung":gewicht,"Verteilungen":{"Standard":{"Kat1":0,"Kat2":0,"Kat3":0,"Kat4":0,"Gesamt":0}},"Schreiber":{"Bester":undefined,"Schlechtester":undefined,"nMitschr":undefined}}}function waitForDB(callback){if(GLOBALS.dbFinished>=GLOBALS.dbToGo){callback()}else{setTimeout(function(){waitForDB(callback)},250)}}function klassenSyncHandler(location,newWindow){GLOBALS.perfStart=performance.now();popUp("item0Sync");var progress=0;progress+=10;updateStatus(progress,"Lokale Daten lesen","Synchronisiere...");db_readKlasse(function(klassenObject){progress+=50;updateStatus(progress,"Serverdaten anfordern","Synchronisiere...");sync_getKlasse(function(mergedKlasse){GLOBALS.perfEnd=performance.now();console.log("INFO: Finished opening Class in "+Math.round(GLOBALS.perfEnd-GLOBALS.perfStart,1)+" milliseconds.");if(isObject(mergedKlasse)){progress+=30;updateStatus(progress,"Daten entschl\xFCsseln und zusammenf\xFChren","Synchronisiere...");setTimeout(function(){progress+=10;updateStatus(progress,progress+" %","Synchronisation erfolgreich !");setTimeout(function(){if(newWindow){window.open(location,"_blank")}else{window.location.href=location}},1200)},500)}else{if(klassenObject){updateStatus(progress,mergedKlasse,"Keine Synchronisation durchgef\xFChrt !",false,true);setTimeout(function(){if(newWindow){window.open(location,"_blank")}else{window.location.href=location}},3000)}else{updateStatus(progress,mergedKlasse,"Keine Synchronisation und Klasse nicht vorhanden !",false,true)}}},klassenObject)})}function klassenDeleteHandler(){popUp("item0Sync");var progress=0;progress+=30;updateStatus(progress,progress+" %","L\xF6sche Klassendaten: Aus dem Speicher und Verzeichnis dieses Ger\xE4ts");db_dropKlasse(GLOBALS.klasse,function(){progress+=40;updateStatus(progress,progress+" %","L\xF6sche Klassendaten: Aus dem Speicher und Verzeichnis des Servers");sync_deleteKlasse(GLOBALS.klasse,function(msg){if(msg){progress=100;updateStatus(progress,progress+" %","L\xF6sche Klassendaten: Erfolgreich !")}else{updateStatus(progress,msg,"Klasse nicht vom Server gel\xF6scht",false,true)}setTimeout(function(){window.location.reload()},3000)})});return}function klassenImportHandler(){popUp("item0Sync");var progress=0;progress+=50;updateStatus(progress,"Einlesen der Daten","Importiere Backup...");var jsonBackup=document.getElementById("jsonBackup").value;try{jsonBackup=JSON.parse(jsonBackup)}catch(e){updateStatus(progress,"Falsches Datenformat!","Importiere Backup: Ein Fehler ist aufgetreten !",false,true)}jsonBackup=stampImport(jsonBackup,changed);jsonBackup[1].name=jsonBackup[1].name+" (Import "+datum(true)+")";jsonBackup[1].klasse=uniqueClassID(jsonBackup[1].name);var changed=timestamp();var target=jsonBackup[1].klasse;progress+=30;updateStatus(progress,"verschl\xFCsselte Daten senden","Importiere Backup...");sync_pushBack(function(unencrypted,errormsg){if(errormsg&&typeof errormsg!="undefined"){setTimeout(function(){updateStatus(progress,errormsg,"Import fehlgeschlagen !",false,true)},3000)}console.log("IDB: adding Class to Account (not local)");db_simpleUpdate(function(){setTimeout(function(){progress=100;updateStatus(progress,progress+" %","Import erfolgreich abgeschlossen !");setTimeout(function(){window.location.reload()},1200)},500)},1,"notlocal","addKlasse",[target,{"bezeichnung":jsonBackup[1].name,"id":target,"changed":changed}],"account")},jsonBackup,["class",target]);return}function handleDeleteLeistung(callback,lART,lID){db_dynamicUpdate(function(r){db_deleteDoc(function(){db_simpleUpdate(callback,1,"blacklist","push",lID.toString())},lID)},function(Student){delete Student[lART][lID];return Student},"student")}function handleSchnitt(callback,sID){db_readMultiData(function(Leistungen){db_dynamicUpdate(callback,function(Student){return schnitt_gesamt(Student,Leistungen)},"student",sID)},"leistung",function(){console.log("INFO: keine Schnittberechnung wegen leerer DB-Abfrage");callback()})}