angular.module('app', []).controller('MainCtrl', function($scope, $http) {
	$scope.pages = {
		login: true,
		resetPassword: false,
		myAccount: false,
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
	let postSucceeded = false;
	let projectSearchCompleted = false;

	// Login data
	let userList = "";
	$scope.loggedUser = [];
	$scope.loggedIn = false;

	// Navigation data
	const navPages = ["buildingDirectory", "myAccount", "createAccount"];
	let activeNavBar = "buildingDirectory";
	let pageHistory = [];
	let currentPage = "login";
	let pastPage = "";

	$scope.buildingTitle = "";
	$scope.buildingID = 0;
	$scope.buildings = [];
	$scope.projects = {};
	$scope.selectedBuilding = [];
	$scope.selectedProject = [];
	$scope.selectedWork = [];

	/************************************************************
	 * 						Helper Functions
	 ************************************************************/

	// Checks if pageHistory contains currentPage. If true, remove from history
	function checkPages() {
		const latestPage = pageHistory.pop();
		if (latestPage !== currentPage) {
			pageHistory.push(latestPage);
		}
	}

	// Helper function for clearing a list of inputs
	function clearFields(ids) {
		for (const id of ids) {
			document.getElementById(id).value = "";
		}
	}

	function getValue(id) {
		return document.getElementById(id).value;
	}

	// Helper function for finding an item (building, project, work) with a given ID
	function findItem(nextPage, id) {
		if (nextPage === "viewBuilding" || nextPage === "createBuilding") {
			$scope.selectedBuilding = findBuilding(id);
		}
		if (nextPage === "viewProject" || nextPage === "createProject") {
			getProject(id);
		}
		if (nextPage === "createTask") {
			for (let work of $scope.selectedProject["Works"]) {
				if (work["TypeOfWork"] === id.toString()) {
					$scope.selectedWork = work;
				}
			}
		}
		console.log($scope.selectedBuilding);
		console.log($scope.selectedProject);
		console.log($scope.selectedWork);
	}

	// Helper function for generating building ids
	function generateID() {
		let id = 1;
		while (true) {
			if (findBuilding(id) === "") {
				return id;
			}
			id++;
		}
	}

	// Helper function for finding a building with a given ID
	function findBuilding(id) {
		for (let building of $scope.buildings) {
			if (building["ID"] === id.toString()) {
				return building;
			}
		}
		return "";
	}

	// Helper function for table sorting
	$scope.toNumber = function(row) {
		return parseInt(row.ID);
	}

	/************************************************************
	 * 						Navigation
	 ************************************************************/

	// main function for switching pages
	function switchPage(nextPage) {
		console.log(pageHistory)
		$scope.pages[currentPage] = false;
		$scope.pages[nextPage] = true;
		pastPage = currentPage;
		currentPage = nextPage;
		updateNavBar(nextPage);
		updatePage(nextPage);
		checkPages();
	}

	// To be used for updating the navbar
	function updateNavBar(nextPage) {
		if (navPages.includes(nextPage)) {
			document.getElementById(activeNavBar).className = "nav-link";
			activeNavBar = nextPage;
			document.getElementById(nextPage).className = "nav-link active";
		}
	}

	function updatePage(page) {
		if (page === "buildingDirectory") {
			getBuildings();
		}
		if (page === "viewBuilding" || page === "createBuilding") {
			getProjects();
		}
	}

	// To be used with navbar - doesnt save navbar page to history
	$scope.useNavBar = function(nextPage) {
		if (!pageHistory.includes("buildingDirectory")) {
			pageHistory.push("buildingDirectory");
		}
		switchPage(nextPage);
	}

	// To be used for moving pages via clicking into links
	$scope.changePage = function(nextPage, id) {
		if (id !== undefined) {
			findItem(nextPage, id);
		}
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

	// Navigation function to be used with + button
	$scope.modifyBuilding = function(isCreate) {
		if (isCreate) {
			clearFields(["owner", "address", "buildingType", "date"]);
			$scope.selectedBuilding = [];
			$scope.buildingID = generateID();
			$scope.buildingTitle = "Create Building";
		} else {
			$scope.buildingID = parseInt($scope.selectedBuilding["ID"]);
			$scope.buildingTitle = "Edit Building";
			document.getElementById("owner").value = $scope.selectedBuilding["Owner"];
			document.getElementById("address").value = $scope.selectedBuilding["Address"];
			document.getElementById("buildingType").value = $scope.selectedBuilding["BuildingType"];
			document.getElementById("date").value = $scope.selectedBuilding["ConstructionDate"];
		}
		$scope.changePage("createBuilding");
	}

	// Submit function for buildings
	$scope.submitBuilding = async function(nextPage) {
		let building = {};
		building["ID"] = getValue("ID");
		building["Owner"] = getValue("owner");
		building["Address"] = getValue("address");
		building["BuildingType"] = getValue("buildingType");
		building["ConstructionDate"] = getValue("date");
		await postBuilding(building);
		if (postSucceeded === true) {
			postSucceeded = false;
			clearFields(["owner", "address", "buildingType", "date"]);
			$scope.selectedBuilding = building;
			document.getElementById("buildingFeedback").innerHTML = "";
			switchPage(nextPage);
		}
	}

	/************************************************************
	 * 						Logging In/Out
	 ************************************************************/

	// Used when a user has logged out
	$scope.logout = function() {
		$scope.changePage("login");
		pastPage = "";
		$scope.loggedIn = false;
		$scope.loggedUser = [];
		pageHistory = [];
	}

	// Used when a user clicks login
	$scope.login = function(nextPage) {
		if (checkLogin(getValue("username"), getValue("password"))) {
			$scope.changePage(nextPage);
			$scope.loggedIn = true;
			document.getElementById("feedback").innerHTML = "";
			clearFields(["username", "password"]);
		}
	}

	// Iterates through users details and checks against server
	async function checkLogin(username, password) {
		await getUsers();
		if (userList !== "") {
			for (const user of userList) {
				if (user["LoginName"] === username) {
					if (user["Password"] === password) {
						$scope.loggedUser = user;
						return true;
					}
				}
			}
			document.getElementById("feedback").innerHTML = "You have entered an invalid username or password.";
			return false;
		}
		document.getElementById("feedback").innerHTML = "Failed to connect to server.";
		return false;
	}

	/************************************************************
	 * 						HTTP Functions
	 ************************************************************/

	// GET request for updating user logins
	async function getUsers() {
		await $http.get(server+"/user_list.json").then(
			function successCallback(response) {
				userList = response.data.users;
			}, function errorCallback(response) {
				document.getElementById("feedback").innerHTML = "Failed to connect to server.";
			});
	}

	// GET request for updating building list
	function getBuildings() {
		$http.get(server+"/building_dir.json").then(
			function successCallback(response) {
				$scope.buildings = response.data.buildings;
			}, function errorCallback(response) {
				console.log("Failed to grab building data from server")
			}
		);
	}

	// POST request for adding/updating a building
	async function postBuilding(building) {
		await $http.post(server+"/update.building.json", building).then(
			function successCallback(response) {
				postSucceeded = true;
			}, function errorCallback(response) {
				document.getElementById("buildingFeedback").innerHTML = "Failed to upload building, please try again";
			}
		);
	}

	// GET request for grabbing a specific project ID
	async function getProject(id) {
		await $http.get(server+"/project."+id+".json").then(
			function successCallback(response) {
				let buildingID = response.data["BuildingID"];
				if (buildingID in $scope.projects) {
					$scope.projects[buildingID].push(response.data);
				} else {
					let projectList = [];
					projectList.push(response.data);
					$scope.projects[buildingID] = projectList;
				}
			}, function errorCallback(response) {
				console.log("Finished finding projects");
				projectSearchCompleted = true;
			}
		);
	}

	// Main project updater
	async function getProjects() {
		let id = 1;
		$scope.projects = {};
		let pastDict = {};
		while (projectSearchCompleted === false) {
			await getProject(id);
			if (JSON.stringify(pastDict) === JSON.stringify($scope.projects)) {
				projectSearchCompleted = true;
			}
			pastDict = JSON.stringify($scope.projects);
			id = id + 1;
		}
		console.log($scope.projects);
		projectSearchCompleted = false;
	}

	/************************************************************
	 * 						JQuery Functions
	 ************************************************************/

	$("select").select2({
		theme: "bootstrap-5",
	});

	$(document).ready(function() {
		$('.select').select2();
	});
});