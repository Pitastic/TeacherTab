#!/usr/bin/python
# -*- coding: utf-8 -*-


import sqlite3
import time
import codecs
from collections import defaultdict
import os
import json
import urllib
from bottle import Bottle, BaseRequest, PasteServer, static_file, run, template, request, response

# Global Variables
app = Bottle()
os.chdir(os.path.dirname(os.path.realpath(__file__)))
db_file = 'UserDBs/'
ex_file = os.getcwd()+'/export'



# Allgemeine Funktionen
def formDate(string, bol_time):
	# Datum von SQLite nach sauberen String
	arr_Monate = ['none', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
	arr_datum = string.split(' ')
	datum = arr_datum[0].split('-')
	datum = datum[2]+". "+arr_Monate[int(datum[1])]+" "+datum[0]
	zeit = unicode(int(arr_datum[1].split(':')[0])+2)+":"+arr_datum[1].split(':')[1]+" Uhr"
	if bol_time:
		return datum+" , um "+zeit
	else:
		return datum

def formDate2(secs):
	# Datum von Sekunden nach Datum
	secs = time.localtime(float(secs))
	secs = time.strftime("%Y-%m-%d", secs)
	return secs

def db_to_html(klasse, userID, useTemplate='pdf'):
	# Klasse in Template schreiben und Dateiname samt Pfad zurückgeben
	print "Pfad: ", db_file
	print "UserID: ", userID
	spalten_liste = ['vName', 'nName', 'sex', 'fspz', 'mndl', 'schr', 'gesamt']
	settings = defaultdict(dict)
	conn = sqlite3.connect(db_file+userID)
	conn.row_factory = sqlite3.Row
	cur = conn.cursor()
	try:
		cur.execute("SELECT * FROM "+ klasse +" ORDER BY nName;")
		conn.commit()
	except:
		return False
	# Settings-Objekt erstellen
	settings_row = cur.fetchone()
	for i in spalten_liste:
		settings[i] = json.loads(urllib.unquote(unicode(settings_row[i]).encode('utf-8')))
	return template(useTemplate+'.tpl', cur=cur, conn=conn, klasse=klasse[1:-1], settings=settings)

# Decorators
# - enable cross-Browser Requests
def enable_cors(fn):
	def _enable_cors(*args, **kwargs):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT'
		response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'
		if request.method != 'OPTIONS':
			# actual request; reply with the actual response
			return fn(*args, **kwargs)
	return _enable_cors

# Static Files
@app.route('/<filename:re:.*\.css>')
def stylesheets(filename):
	return static_file(filename, root='css')
@app.route('/<filename:re:.*\.(jpg|png|gif|ico)>')
def images(filename):
	return static_file(filename, root='img')
@app.route('/<filename:re:.*\.js>')
def scripts(filename):
	return static_file(filename, root='js')


# Routings
@app.route('/')
def welcome():
	return """
<h1>Bottle is working !</h1>
<h2>Synchronisierungsserver für die TeacherTab WebApp</h2>
<p>Derzeitige Funktionen :</p>
<ul style="outline: 1px solid blue;display: inline-block;padding: 1em 2em;margin: 1em;">
<li>/ShowAll</li>
<li>/HowAreYou</li>
<li>/storeFromClient</li>
<li>/giveToClient</li>
<li>/deleteStudentOnServer</li>
<li>/deleteKlasse</li>
<li>/pdf_export</li>
<li>/checkDB</li>
</ul>
<p>Pfadname des Scripts: {0}</p>
<p style="font-size: 0.75em;text-align: center;margin-top: 3em;">WebApp unter <a href="http://www.teachertab.de/WebApp">TeacherTab.de/WebApp</p>
""".format(os.path.dirname(os.path.realpath(__file__)))

@app.route('/ShowAll', method='POST')
@enable_cors
def listTables():
	userID = request.forms.user
	conn = sqlite3.connect(db_file+userID)
	conn.row_factory = sqlite3.Row
	cur = conn.cursor()
	cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
	all_tables = [row[0] for row in cur.fetchall()]
	conn.commit()
	conn.close()
	return json.dumps({'all_tables':all_tables})

@app.route('/HowAreYou', method='POST')
@enable_cors
def compareVersions():
	klasse = request.forms.klasse
	c_version = float(request.forms.changed)
	userID = request.forms.user
	# SQL-Versionsabfrage
	conn = sqlite3.connect(db_file+userID)
	conn.row_factory = sqlite3.Row
	cur = conn.cursor()
	try:
		cur.execute("SELECT changed FROM "+klasse+" ORDER BY changed DESC LIMIT 1")
		s_version = cur.fetchone()
		if s_version:
			s_version = s_version['changed']
	except conn.Error, e:
		print "DB Error: "+e.args[0]+"\n"
		s_version = False
		cur.execute("CREATE TABLE IF NOT EXISTS "+klasse+" (id INTEGER PRIMARY KEY, vName TEXT, nName TEXT, sex TEXT, mndl TEXT, fspz TEXT, schr TEXT, omndl TEXT, ofspz TEXT, oschr TEXT, gesamt TEXT, Kompetenzen TEXT, changed INTEGER)")
	conn.commit()
	conn.close()
	# Vergleich
	richtung = "newerOnServer" if s_version > c_version else "newerOnClient"
	return json.dumps({'Klasse':klasse, 'client_version':c_version, 'server_version':s_version, 'result':richtung})

@app.route('/storeFromClient', method='POST')
@enable_cors
def storeClientData():
	data = request.forms.sql
	userID = request.forms.user
	# SQL-String zerlegen und in Schleife ausführen
	conn = sqlite3.connect(db_file+userID)
	cur = conn.cursor()
	data = data.split(";")
	for sql in data:
		cur.execute(sql+";")
	conn.commit()
	conn.close()
	return json.dumps({'neue_zeilen':len(data)-1})

@app.route('/giveToClient', method='POST')
@enable_cors
def sellServerData():
	klasse = request.forms.klasse
	c_version = request.forms.changed
	userID = request.forms.user
	# SQL-String erzeugen
	conn = sqlite3.connect(db_file+userID)
	conn.row_factory = sqlite3.Row
	cur = conn.cursor()
	cur.execute("PRAGMA TABLE_INFO(" + klasse + ");")
	_fields = [t[1] for t in cur.fetchall()]
	cur.execute("SELECT * FROM " + klasse + " WHERE changed > "+ c_version +";")
	data = ""
	_values = []
	for row in cur:
		inner_values = []
		for col in row:
			val = "'"+unicode(col)+"'" if col else "'';"
			inner_values.append(val)
		data += "INSERT OR REPLACE INTO "+klasse+" ("+','.join(_fields)+") VALUES;;"
		_values.append(inner_values)
	conn.commit()
	conn.close()
	return json.dumps({'klasse':klasse, 'data':data, 'values':_values})

@app.route('/deleteStudentOnServer', method='POST')
@enable_cors
def deleteKlasse():
	klasse = request.forms.klasse
	studID = request.forms.studID
	userID = request.forms.user
	conn = sqlite3.connect(db_file+userID)
	cur = conn.cursor()
	cur.execute('DELETE FROM '+klasse+' WHERE ID='+studID+';')
	conn.commit()
	conn.close()
	return json.dumps({'klasse':klasse, 'sudID':studID})

@app.route('/deleteKlasse', method='POST')
@enable_cors
def deleteKlasse():
	klasse = request.forms.klasse
	userID = request.forms.user
	conn = sqlite3.connect(db_file+userID)
	cur = conn.cursor()
	cur.execute("DROP TABLE IF EXISTS " + klasse + ";")
	conn.commit()
	conn.close()
	return json.dumps({'klasse':klasse})

@app.route('/pdf_export', method='POST')
@enable_cors
def pdf_export():
	klasse = request.forms.klasse
	userID = request.forms.userID
	with codecs.open(ex_file+"/html_file.htm", "w+", "utf-8") as html_file:
		html_buffer = db_to_html(klasse, userID)
		if html_buffer:
			html_file.write(html_buffer)
			os.system('/usr/local/bin/wkhtmltopdf.sh --title "{0}" -O landscape "file://{1}/html_file.htm" {1}/export.pdf'.format(klasse[1:-1],ex_file))
			return static_file("export.pdf", root="./export/", download="export.pdf")
	return """
		<h2>Meldung vom SyncServer: <span style="color: red;">Aktion abgebrochen</span></h2>
		<p>Die ausgewählte Klasse ist in der Datenbank nicht vorhanden.</p>
		<p>Wähle und synchronisiere die Klasse zuerst aus dem DropDown-Menu und drücke dann auf 'Exportieren' !</p>
		"""
@app.route('/html_export', method='POST')
@enable_cors
def html_export():
	klasse = request.forms.klasse
	userID = request.forms.userID
	with codecs.open(ex_file+"/html_file.htm", "w+", "utf-8") as html_file:
		return db_to_html(klasse, userID, useTemplate='html')
	return """
		<h2>Meldung vom SyncServer: <span style="color: red;">Aktion abgebrochen</span></h2>
		<p>Die ausgewählte Klasse ist in der Datenbank nicht vorhanden.</p>
		<p>Wähle und synchronisiere die Klasse zuerst aus dem DropDown-Menu und drücke dann auf 'Exportieren' !</p>
		"""

# Settings und Service-Start
BaseRequest.MEMFILE_MAX = 102400 * 10 # = 10 MB
run(app, host='0.0.0.0', port='8100', server=PasteServer, debug=True)
