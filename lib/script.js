angular.module('app', []).controller('MainCtrl', function($scope, $http) {
	$scope.pages = {
		login: true,
		resetPassword: false,
		viewAccount: false,
		createAccount: false,
		buildingDirectory: false,
		viewBuilding: false,
		createBuilding: false,
		viewProject: false,
		createProject: false,
		createTask: false,
		createComment: false
	};

	const server = "https://happybuildings.sim.vuw.ac.nz/api/brucetasm";
	let userList = "";
	$scope.loggedUser = "";
	$scope.loggedIn = false;

	const navPages = ["buildingDirectory", "viewAccount", "createAccount"];
	let activeNavBar = "buildingDirectory";
	let pageHistory = [];
	let currentPage = "login";
	let pastPage = "";

	// Helper function for switching pages
	function switchPage(nextPage) {
		console.log(pageHistory)
		$scope.pages[currentPage] = false;
		$scope.pages[nextPage] = true;
		pastPage = currentPage;
		currentPage = nextPage;
		updateNavBar(nextPage);
		checkPages();
	}

	// Checks if pageHistory contains currentPage. If true, remove from history
	function checkPages() {
		const latestPage = pageHistory.pop();
		if (latestPage !== currentPage) {
			pageHistory.push(latestPage);
		}
	}

	// To be used for updating the navbar
	function updateNavBar(nextPage) {
		if (navPages.includes(nextPage)) {
			document.getElementById(activeNavBar).className = "nav-link";
			activeNavBar = nextPage;
			document.getElementById(nextPage).className = "nav-link active";
		}
	}

	// Helper function for clearing a list of inputs
	function clearFields(ids) {
		for (const id of ids) {
			document.getElementById(id).value = "";
		}
	}

	// Helper function for getting a field value
	function getValue(id) {
		return document.getElementById(id).value;
	}

	// To be used with navbar - doesnt save navbar page to history
	$scope.useNavBar = function(nextPage) {
		if (!pageHistory.includes("buildingDirectory")) {
			pageHistory.push("buildingDirectory");
		}
		switchPage(nextPage);
	}

	// To be used for moving pages via clicking into links
	$scope.changePage = function(nextPage) {
		pageHistory.push(currentPage);
		switchPage(nextPage);
	}

	// Allows for returning to the user's last page
	$scope.goBack = function() {
		const page = pageHistory.pop();
		switchPage(page);
	}

	// To be used with form submissions
	$scope.submit = function(form, nextPage) {
		switchPage(nextPage);
	}

	// Used when a user has logged out
	$scope.logout = function() {
		$scope.changePage("login");
		pastPage = "";
		$scope.loggedIn = false;
		$scope.loggedUser = "";
		pageHistory = [];
	}

	// Used when a user clicks login
	$scope.login = function(nextPage) {
		if (checkLogin(getValue("email"), getValue("password"))) {
			$scope.changePage(nextPage);
			$scope.loggedIn = true;
			document.getElementById("feedback").innerHTML = "";
			clearFields(["email", "password"]);
		}
	}

	// Iterates through users details and checks against server
	function checkLogin(email, password) {
		getUsers();
		console.log(userList);
		if (userList !== "") {
			for (const user of userList) {
				if (user["LoginName"] === email) {
					if (user["Password"] === password) {
						$scope.loggedUser = user;
						return true;
					}
				}
			}
			document.getElementById("feedback").innerHTML = "You have entered an invalid username or password.";
		}
		return false;
	}

	// GET request for updating user logins
	function getUsers() {
		$http.get(server+"/user_list.json").then(
			function successCallback(response) {
				userList = response.data.users;
			}, function errorCallback(response) {
				document.getElementById("feedback").innerHTML = "Failed to connect to server.";
			});
	}

	// JQuery Functions
	$("select").select2({
		theme: "bootstrap-5",
	});

	$(document).ready(function() {
		$('.select').select2();
	});
});