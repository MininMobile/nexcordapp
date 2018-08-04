const { dialog } = require('electron').remote;
const discord = require("discord.js");

let form = document.getElementById("loginform");
let token = document.getElementById("token");

form.addEventListener("submit", (e) => {
	const eClient = new discord.Client();

	eClient.login(token.value).then(async () => {
		// store token and go to client
	}).catch((e) => {		
		dialog.showMessageBox({
			type: "error",
			title: "Error",
			message: e.toString()
		});
	});
});
