const matrix = require("matrix-js-sdk");

let client;

// get big boys
let loadingSplash = document.getElementById("loading-splash");
let loginWrapper = document.getElementById("login-wrapper");
let chatWrapper = document.getElementById("chat-wrapper");
// get lists
let roomList = document.getElementById("room-list");
let messageList = document.getElementById("message-list");
let memberList = document.getElementById("member-list");
// get message box
let messageBoxForm = document.getElementById("messagebox-form");
let messageBox = document.getElementById("messagebox");
// get other shit
let roomTitle = document.getElementById("room-title");
let roomClose = document.getElementById("room-close");

// temp data store
let rooms = undefined;
let currentRoom = undefined;
let ctrl = false;
let shift = false;
let alt = false;

{ // add login
	if (window.localStorage.username && window.localStorage.token) {
		client = matrix.createClient({
			baseUrl: "https://matrix.org",
			accessToken: window.localStorage.token,
			userId: `@${window.localStorage.username}:matrix.org`
		});

		setTimeout(() => startClient(), 100);
	} else {
		client = matrix.createClient("https://matrix.org");
		setTimeout(() => hideLoading(), 100);
	}

	document.getElementById("login-form").addEventListener("submit", () => {
		let loginUsername = document.getElementById("login-username");
		let loginPassword = document.getElementById("login-password");

		client.loginWithPassword(loginUsername.value, loginPassword.value)
			.then((data) => startClient(data, true))
			.catch((e) => console.error(e));
	});
}

{ // client actions
	function startClient(data, fresh = false) {
		if (!window.localStorage.username && !window.localStorage.token && fresh) {
			let loginUsername = document.getElementById("login-username");
			let loginPassword = document.getElementById("login-password");

			window.localStorage.username = loginUsername.value;
			window.localStorage.token = data.access_token;
		}

		showLoading().then(() => {
			loginWrapper.classList.add("disabled");
			chatWrapper.classList.remove("disabled");

			client.startClient();

			client.once("sync", (state, prevState, data) => {
				if (state == "PREPARED") {
					getRooms();
					hideLoading();
				}
			});
		});
	}

	function getRooms() {
		roomList.innerHTML = "";

		rooms = client.getRooms();

		rooms.forEach((r) => {
			let button = document.createElement("div");
			button.classList.add("room");
			button.id = r.roomId;
			button.title = r.name;
			button.innerText = r.name;

			button.addEventListener("click", () => {
				openRoom(r);
			});

			roomList.appendChild(button);
		});
	}

	function openRoom(room) {
		currentRoom = room;

		{ // update member list
			memberList.innerHTML = "";

			room.getJoinedMembers().forEach((m) => {
				let button = document.createElement("div");
				button.classList.add("member");
				button.title = m.name;
				button.innerText = m.name;

				button.addEventListener("click", () => {
					// smth
				});

				memberList.appendChild(button);
			});
		}

		{ // get timeline
			messageList.innerHTML = "";

			room.timeline.forEach((msg) => {
				if (msg.event.type == "m.room.redaction") return;

				let message = document.createElement("div");
					message.classList.add("message");
					messageList.appendChild(message);

				let author = document.createElement("div");
					author.classList.add("author");

				let content = document.createElement("div");
					content.classList.add("content");

				{ // author info
					let title = document.createElement("div");
						title.classList.add("title");
						title.innerText = msg.sender.name;
						author.appendChild(title);

					let date = "";

					{ // get date
						let t = msg.getDate();

						let h = t.getHours();
						let m = t.getMinutes();
					
						h = h.toString().length == 1 ? `0${h}` : h;
						m = m.toString().length == 1 ? `0${m}` : m;
					
						let month = t.getMonth() + 1;
						let day = t.getDate();
					
						month = month.toString().length == 1 ? `0${month}` : month;
						day = day.toString().length == 1 ? `0${day}` : day;
					
						date = `${h}:${m} ${month}/${day}/${t.getFullYear()}`;
					}

					let timestamp = document.createElement("div");
						timestamp.classList.add("timestamp");
						timestamp.innerText = date;
						author.appendChild(timestamp);
				}

				{ // message content
					let redacted = false;

					if (msg.event.unsigned) {
						if (msg.event.unsigned.redacted_because) {
							redacted = true;
						}
					}

					if (redacted) {
						content.classList.add("redacted");
					} else {
						let text = "";

						switch (msg.event.type) {
							case "m.room.message": {
								text = msg.event.content.body;
							} break;
	
							case "m.room.member": {
								message.classList.add("no-author");
	
								switch (msg.event.content.membership) {
									case "join": {
										text = `${msg.sender.name} has joined the room.`;
									} break;

									case "invite": {
										text = `${msg.sender.name} invited ${msg.target.name}.`;
									} break;
	
									case "leave": {
										if (msg.sender != msg.target) {
											text = `${msg.sender.name} kicked ${msg.target.name}.`;
	
											if (msg.event.content.reason)
												text += ` Reason: ${msg.event.content.reason}`;
										} else {
											text = `${msg.sender.name} has left the room.`;
										}
									} break;
								}
							} break;
	
							case "m.room.topic": {
								message.classList.add("no-author");
	
								text = `${msg.sender.name} set the topic to "${msg.event.content.topic}".`;
							} break;
						}

						content.innerHTML = escapeHtml(text);
					}
				}

				message.classList.contains("no-author") ? message.appendChild(content) : message.appendChild(author);
				message.classList.contains("no-author") ? message.appendChild(author) : message.appendChild(content);
			});
		}

		{ // show selected
			let allButtons = document.getElementsByClassName("room");

			for (let i = 0; i < allButtons.length; i++) {
				allButtons[i].classList.remove("selected");
			}

			let button = document.getElementById(room.roomId);

			button.classList.add("selected");
		}

		// update room menu
		roomClose.classList.remove("disabled");
		roomTitle.innerText = room.name;

		// scroll to bottom
		messageList.scrollTop = messageList.scrollHeight;
	}

	function closeRoom() {
		currentRoom = undefined;

		let allButtons = document.getElementsByClassName("room");

		for (let i = 0; i < allButtons.length; i++) {
			allButtons[i].classList.remove("selected");
		}

		messageList.innerHTML = "";
		memberList.innerHTML = "";

		roomTitle.innerText = "Manex";

		roomClose.classList.add("disabled");
	}

	function logout() {
		window.localStorage.removeItem("username");
		window.localStorage.removeItem("token");

		client.stopClient();

		window.location.reload();
	}

	client.on("Room.timeline", (e, room, toStartOfTimeline) => {
		if (currentRoom) {
			if (room.roomId == currentRoom.roomId) {
				openRoom(currentRoom);
			}
		}
	});
}

{ // page actions
	document.addEventListener("keydown", (e) => {
		switch (e.code) {
			case "ControlLeft": ctrl = true; break;
			case "ShiftLeft": shift = true; break;
			case "AltLeft": alt = true; break;
			case "ControlRight": ctrl = true; break;
			case "ShiftRight": shift = true; break;
			case "AltRight": alt = true; break;
		}

		messageBox.focus();
	});

	document.addEventListener("keyup", (e) => {
		switch (e.code) {
			case "ControlLeft": ctrl = false; break;
			case "ShiftLeft": shift = false; break;
			case "AltLeft": alt = false; break;
			case "ControlRight": ctrl = true; break;
			case "ShiftRight": shift = true; break;
			case "AltRight": alt = true; break;

			case "Escape": if (shift) closeRoom(); break;
		}
	});

	roomClose.addEventListener("click", closeRoom);

	messageBoxForm.addEventListener("submit", () => {
		if (!currentRoom) return;
		if (!currentRoom.roomId) return;
		if (messageBox.value.length == 0) return;

		client.sendEvent(currentRoom.roomId, "m.room.message", {
			"body": messageBox.value,
			"msgtype": "m.text"
		}, "").then((data) => {
			openRoom(currentRoom);
		}).catch((e) => {
			console.log(e);
		});

		messageBox.value = "";
	});
}

{ // util
	function escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	 }

	function showLoading() {
		return new Promise((resolve, reject) => {
			if (!loadingSplash.classList.contains("hidden")) {
				resolve();
			} else {
				loadingSplash.classList.remove("hidden");

				setTimeout(() => {
					resolve();
				}, 300);
			}
		});
	}

	function hideLoading() {
		return new Promise((resolve, reject) => {
			if (loadingSplash.classList.contains("hidden")) {
				resolve();
			} else {
				loadingSplash.classList.add("hidden");

				setTimeout(() => {
					resolve();
				}, 300);
			}
		});
	}
}
