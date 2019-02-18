const matrix = require("matrix-js-sdk");

const client = matrix.createClient("https://matrix.org");

let loginForm = document.getElementById("login-form");
let loginUsername = document.getElementById("login-username");
let loginPassword = document.getElementById("login-password");

let loadingSplash = document.getElementById("loading-splash");
let loginWrapper = document.getElementById("login-wrapper");
let chatWrapper = document.getElementById("chat-wrapper");

setTimeout(() => {
	if (window.localStorage.username && window.localStorage.password) {
		client.loginWithPassword(window.localStorage.username, window.localStorage.password)
			.then((data) => startClient(data, false))
			.catch((e) => console.error(e));
	} else {
		hideLoading();
	}
}, 100);

{ // login
	form.addEventListener("submit", () => {
		client.loginWithPassword(loginUsername.value, loginPassword.value)
			.then((data) => startClient(data, true))
			.catch((e) => console.error(e));
	});
}

function startClient(data, fresh = false) {
	if (!window.localStorage.username && !window.localStorage.password && fresh) {
		window.localStorage.username = loginUsername.value;
		window.localStorage.password = loginPassword.value;
	}

	showLoading().then(() => {
		loginWrapper.classList.add("disabled");
		chatWrapper.classList.remove("disabled");

		hideLoading();
	});
}

function logout() {
	window.localStorage.removeItem("password");
	window.localStorage.removeItem("username");

	window.location.reload();
}

// util

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
