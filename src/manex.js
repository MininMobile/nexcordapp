const matrix = require("matrix-js-sdk");
const open = require("open");
const remote = require("electron").remote;
const { clipboard, dialog } = remote;

const win = remote.getCurrentWindow();

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
let messageBoxFormContainer = document.getElementById("messagebox-form-container");
let messageBoxForm = document.getElementById("messagebox-form");
let messageBox = document.getElementById("messagebox");
// get other shit
let contextContainer = document.getElementById("context-container");
let contextMenu = document.getElementById("context");
let dialogContainer = document.getElementById("dialog");
let roomTitle = document.getElementById("room-title");
let roomClose = document.getElementById("room-close");

// temp data store
let favoriteRooms = undefined;
let directRooms = undefined;
let rooms = undefined;
let currentRoom = undefined;
let ctrl = false;
let shift = false;
let alt = false;

{ // preserve window size
	let size = JSON.parse(window.localStorage.size || "{}");

	if (size.x == undefined) {
		size = win.getBounds();
		window.localStorage.size = JSON.stringify(size);
	}

	win.setBounds(size);
}

{ // preserve favorites/directs
	if (window.localStorage.favorites) {
		favoriteRooms = JSON.parse(window.localStorage.favorites);
	} else {
		favoriteRooms = [];
		window.localStorage.favorites = JSON.stringify(favoriteRooms);
	}

	if (window.localStorage.directs) {
		directRooms = JSON.parse(window.localStorage.directs);
	} else {
		directRooms = [];
		window.localStorage.directs = JSON.stringify(directRooms);
	}
}

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
		let getRoomButton = (room) => {
			let button = document.createElement("div");
				button.classList.add("room");
				button.id = room.roomId;
				button.title = room.name;

			let avatar = document.createElement("div");
				avatar.classList.add("avatar");
				avatar.style.backgroundImage = "url('" +
					room.getAvatarUrl().replace("undefined", "https://matrix.org") + "')";
				button.appendChild(avatar);

			let text = document.createElement("span");
				text.innerText = room.name;
				button.appendChild(text);

			button.addEventListener("mouseup", (e) => {
				if (e.button == 0) {
					openRoom(room);
				} else if (e.button == 2) {
					showContext({
						"Favorite": () => toggleFavorite(room.roomId),
						"Direct Chat": () => toggleDirect(room.roomId),
					}, { x: e.clientX, y: e.clientY });
				}
			});

			return button;
		}

		rooms = client.getRooms();

		roomList.innerHTML = "";

		if (favoriteRooms.length > 0) { // favorites
			let favoriteTitle = document.createElement("div");
			let favoriteList = document.createElement("div");

			favoriteTitle.classList.add("category");
			favoriteTitle.innerText = "Favorites";
			favoriteTitle.addEventListener("click", () => {
				favoriteTitle.classList.toggle("hidden");
				favoriteList.classList.toggle("hidden");
			});
			roomList.appendChild(favoriteTitle);

			favoriteList.classList.add("list");
			roomList.appendChild(favoriteList);

			rooms.forEach((r) => {
				if (!favoriteRooms.includes(r.roomId)) return;

				let button = getRoomButton(r);
				favoriteList.appendChild(button);
			});
		}

		if (directRooms.length > 0) { // directs
			let directTitle = document.createElement("div");
			let directList = document.createElement("div");

			directTitle.classList.add("category");
			directTitle.innerText = "People";
			directTitle.addEventListener("click", () => {
				directTitle.classList.toggle("hidden");
				directList.classList.toggle("hidden");
			});
			roomList.appendChild(directTitle);

			directList.classList.add("list");
			roomList.appendChild(directList);

			rooms.forEach((r) => {
				if (!directRooms.includes(r.roomId) || favoriteRooms.includes(r.roomId)) return;

				let button = getRoomButton(r);
				directList.appendChild(button);
			});
		}

		{ // other
			let normalTitle = document.createElement("div");
			let normalList = document.createElement("div");

			normalTitle.classList.add("category");
			normalTitle.innerText = "Rooms";
			normalTitle.addEventListener("click", () => {
				normalTitle.classList.toggle("hidden");
				normalList.classList.toggle("hidden");
			});
			roomList.appendChild(normalTitle);

			normalList.classList.add("list");
			roomList.appendChild(normalList);

			rooms.forEach((r) => {
				if (favoriteRooms.includes(r.roomId) ||
					directRooms.includes(r.roomId))
						return;

				let button = getRoomButton(r);
				normalList.appendChild(button);
			});
		}
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
				let supportedEvent = true;

				let message = document.createElement("div");
					message.classList.add("message");

				let avatar = document.createElement("div");
					avatar.classList.add("avatar");
					avatar.style.backgroundImage = "url('" +
						msg.sender.getAvatarUrl().replace("undefined", "https://matrix.org") + "')";

				let author = document.createElement("div");
					author.classList.add("author");

				{ // author info
					let title = document.createElement("div");
						title.classList.add("title");
						title.innerText = msg.sender.name;
						author.appendChild(title);

					let timestamp = document.createElement("div");
						timestamp.classList.add("timestamp");
						author.appendChild(timestamp);

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

						timestamp.innerText = `${h}:${m} ${month}/${day}/${t.getFullYear()}`;
					}
				}

				let content;

				if (msg.event.content.msgtype == "m.image") {
					content = document.createElement("img");
					content.classList.add("content");
					content.src = client.mxcUrlToHttp(msg.event.content.info.thumbnail_url);
					content.title = `${msg.event.content.body}`;

					content.addEventListener("click", () => {
						let container = document.createElement("div");

						let image = document.createElement("img");
							image.classList.add("image-preview");
							image.src = client.mxcUrlToHttp(msg.event.content.url);
							container.appendChild(image);

						let linkContainer = document.createElement("div");
							linkContainer.classList.add("image-preview-link");
							container.appendChild(linkContainer);

						{ // links
							let openLink = document.createElement("span");
								openLink.innerText = "Open Original";
								openLink.addEventListener("click", () =>
									open(client.mxcUrlToHttp(msg.event.content.url)));
								linkContainer.appendChild(openLink);

							let divider = document.createElement("div");
								divider.classList.add("divider");
								linkContainer.appendChild(divider);

							let copyLink = document.createElement("span");
								copyLink.innerText = "Copy Image Link";
								copyLink.addEventListener("click", () =>
									clipboard.writeText(client.mxcUrlToHttp(msg.event.content.url)));
								linkContainer.appendChild(copyLink);
						}

						showDialog(container);
					});

					content.addEventListener("load", () => {
						messageList.scrollTop = messageList.scrollHeight;
					});
				} else {
					content = document.createElement("div");
						content.classList.add("content");

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

								default: {
									supportedEvent = false;
								} break;
							}

							content.innerHTML = escapeHtml(text);
						}
					}
				}

				if (message.classList.contains("no-author")) {
					message.appendChild(avatar);

					message.appendChild(content);
					message.appendChild(author);
				} else {
					author.insertBefore(avatar, author.firstElementChild);

					message.appendChild(author);
					message.appendChild(content);
				}

				if (supportedEvent) messageList.appendChild(message);
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

		// reveal elements
		messageBoxFormContainer.classList.remove("disabled");
		memberList.classList.remove("disabled");

		// update room menu
		roomClose.classList.remove("disabled");
		roomTitle.innerText = room.name;

		// scroll to bottom
		messageList.scrollTop = messageList.scrollHeight;
	}

	function closeRoom() {
		currentRoom = undefined;

		// remove selection indicator
		let allButtons = document.getElementsByClassName("room");

		for (let i = 0; i < allButtons.length; i++) {
			allButtons[i].classList.remove("selected");
		}

		// hide elements
		messageBoxFormContainer.classList.add("disabled");
		memberList.classList.add("disabled");

		// clear lists
		messageList.innerHTML = "";
		memberList.innerHTML = "";

		// update room menu
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
	{ // titlebars
		{ // login titlebar
			let minimize = document.getElementById("login-action-minimize");
			let maximize = document.getElementById("login-action-maximize");
			let close = document.getElementById("login-action-close");

			minimize.addEventListener("click", () => win.minimize());
			maximize.addEventListener("click", () => toggleMaximize());
			close.addEventListener("click", () => window.close());
		}

		{ // main titlebar
			let minimize = document.getElementById("main-action-minimize");
			let maximize = document.getElementById("main-action-maximize");
			let close = document.getElementById("main-action-close");

			minimize.addEventListener("click", () => win.minimize());
			maximize.addEventListener("click", () => toggleMaximize());
			close.addEventListener("click", () => window.close());
		}
	}

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

	dialogContainer.addEventListener("mouseup", (e) => {
		if (e.target == dialogContainer) {
			hideDialog();
		}
	});

	contextContainer.addEventListener("mouseup", (e) => {
		if (e.target == contextContainer) {
			hideContext();
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

	win.removeAllListeners("resize");
	win.removeAllListeners("move");

	win.on("resize", () =>
		window.localStorage.size = JSON.stringify(win.getBounds()));

	win.on("move", () =>
		window.localStorage.size = JSON.stringify(win.getBounds()));
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

	function toggleFavorite(roomId) {
		if (favoriteRooms.includes(roomId)) {
			let fr = [];

			favoriteRooms.forEach((r) => {
				if (r != roomId)
					fr.push(r);
			});

			favoriteRooms = fr;
			window.localStorage.favorites = JSON.stringify(favoriteRooms);
		} else {
			favoriteRooms.push(roomId);
			window.localStorage.favorites = JSON.stringify(favoriteRooms);
		}

		getRooms();
	}

	function toggleDirect(roomId) {
		if (directRooms.includes(roomId)) {
			let dr = [];

			directRooms.forEach((r) => {
				if (r != roomId)
					dr.push(r);
			});

			directRooms = dr;
			window.localStorage.directs = JSON.stringify(directRooms);
		} else {
			directRooms.push(roomId);
			window.localStorage.directs = JSON.stringify(directRooms);
		}

		getRooms();
	}

	function toggleMaximize() {
		let a = document.getElementById("login-action-maximize");
		let b = document.getElementById("main-action-maximize");

		if (win.isMaximized()) {
			a.classList.remove("maximized");
			b.classList.remove("maximized");
			win.unmaximize();
		} else {
			a.classList.add("maximized");
			b.classList.add("maximized");
			win.maximize();
		}
	}

	function showContext(menu, position = { x: 0, y: 0 }) {
		contextMenu.innerHTML = "";

		contextContainer.classList.remove("hidden");

		contextMenu.style.left = position.x + "px";
		contextMenu.style.top = position.y + "px";

		Object.keys(menu).forEach((action) => {
			let item = document.createElement("div");
			item.innerText = action;

			item.addEventListener("click", () => {
				menu[action]();
			})

			contextMenu.appendChild(item);
		});
	}

	function hideContext() {
		contextContainer.classList.add("hidden");
		contextMenu.innerHTML = "";
	}

	function showDialog(content) {
		dialogContainer.appendChild(content);
		dialogContainer.classList.remove("hidden");
	}

	function hideDialog(content) {
		dialogContainer.classList.add("hidden");

		setTimeout(() => {
			dialogContainer.innerHTML = "";
		}, 300);
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
