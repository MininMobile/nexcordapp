const matrix = require("matrix-js-sdk");

const client = matrix.createClient("https://matrix.org");

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
let roomMenu = document.getElementById("room-menu");

// temp data store
let rooms = undefined;
let currentRoom = undefined;
let ctrl = false;
let shift = false;
let alt = false;

{ // add login
	let loginForm = document.getElementById("login-form");
	let loginUsername = document.getElementById("login-username");
	let loginPassword = document.getElementById("login-password");

	setTimeout(() => {
		if (window.localStorage.username && window.localStorage.password) {
			client.loginWithPassword(window.localStorage.username, window.localStorage.password)
				.then((data) => startClient(data, false))
				.catch((e) => console.error(e));
		} else {
			hideLoading();
		}
	}, 100);

	loginForm.addEventListener("submit", () => {
		client.loginWithPassword(loginUsername.value, loginPassword.value)
			.then((data) => startClient(data, true))
			.catch((e) => console.error(e));
	});
}

{ // client actions
	function startClient(data, fresh = false) {
		if (!window.localStorage.username && !window.localStorage.password && fresh) {
			window.localStorage.username = loginUsername.value;
			window.localStorage.password = loginPassword.value;
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
				button.innerText = m.name;

				button.addEventListener("click", () => {
					// smth
				});

				memberList.appendChild(button);
			});
		}

		{ // get timeline
			messageList.innerHTML = "";

			room.timeline.forEach((m) => {
				let message = document.createElement("div");
					message.classList.add("message");
					messageList.appendChild(message);

				let author = document.createElement("div");
				author.classList.add("author");
					message.appendChild(author);

				let content = document.createElement("div");
					content.classList.add("content");
					message.appendChild(content);

				{ // author info
					let title = document.createElement("div");
						title.classList.add("title");
						title.innerText = m.sender.name;
						author.appendChild(title);

					let timestamp = document.createElement("div");
						timestamp.classList.add("timestamp");
						timestamp.innerText = m.getDate();
						author.appendChild(timestamp);
				}

				switch (m.event.type) {
					case "m.room.message": {
						content.innerHTML = m.event.content.body;
					} break;

					//case "m.room.member": {
					//	message.content = m.event.content.membership;
					//} break;
				}
			});
		}

		roomMenu.innerText = room.name;

		// scroll to bottom
		messageList.scrollTop = messageList.scrollHeight;
	}

	function closeRoom() {
		currentRoom = undefined;

		messageList.innerHTML = "";
		memberList.innerHTML = "";

		roomMenu.innerText = "Manex";
	}

	function logout() {
		window.localStorage.removeItem("password");
		window.localStorage.removeItem("username");

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
