const port = 1111
const WS = require('ws')
const wss = new WS.Server({port: port})

let id_to_ws = {}
let ws_to_id = {}
let share_requests = {}

// Helper functions
function determineJSON(m) {
	try         { return ['json', JSON.parse(m)] }
	catch (err) { return ['not-json', m] }
}
WS.prototype.sendJSON = function(m) { this.send(JSON.stringify(m)) }

function error(ws, err="error: unspecified") {
	ws.sendJSON({err: true, msg: err})
	console.error(err)
}

wss.on('connection', ws => {
	ws.on('message', m => {
		// Emit to 'json' and 'not-json' as appropriate
		if (ws.listenerCount('json') + ws.listenerCount('not-json') > 0) {
			ws.emit(...determineJSON(m))
		}
	})
	.on('json', j => {
		if (j.err) { error(ws, `received error: ${j.msg}`) }
		// Set ID of socket unless ID already taken
		if (j.id) {
			let id = j.id.toLowerCase()
			if (id_to_ws.msg) { error(ws, `id taken: ${id}`) }
			id_to_ws[id] = ws
			ws_to_id[ws] = id
			console.log(`identified: ${id}`)
		}
		// Pass on message if SENDER has ID and RECIPIENT is connected
		if (j.to) {
			j.to = j.to.toLowerCase()
			j.from = ws_to_id[ws]    // ID registered to sender
			to = id_to_ws[j.to]    // socket for recipient
			if (!j.from) { return error(ws, `not identified`) }
			if (!to) { return error(ws, `id nonexistant: ${j.to}`) }
			to.sendJSON(j)
			console.log(`sent msg: ${j.from} ---> ${j.to}`)
		}
		ws.send('--------------------')    // XXX DEBUG
	})
	.on('not-json', m => {
		ws.send(`That's right. ${m}`)    // XXX DEBUG
	})

	ws.send(`Connected on ${port}.`)
})
