angular.module('app', []).controller('MainCtrl', function ($scope, $http) {
	$scope.pages = {
		login: true,
		resetPassword: false,
		myAccount: false,
		viewAccount: false,
		buildingDirectory: false,
		viewBuilding: false,
		editBuilding: false,
		createBuilding: false,
		viewProject: false,
		editProject: false,
		createProject: false,
		createWork: false,
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
	const navPages = ["buildingDirectory", "myAccount"];
	let activeNavBar = "buildingDirectory";
	let pageHistory = [];
	let currentPage = "login";
	let pastPage = "";

	$scope.buildingID = 0;
	$scope.projectID = 0;
	$scope.workTitle = "";
	$scope.commentTitle = "";
	$scope.buildings = [];
	$scope.projects = {};
	$scope.permittedBuildings = [];
	$scope.selectedBuilding = [];
	$scope.selectedProject = [];
	$scope.selectedWork = [];
	$scope.selectedComment = [];
	$scope.selectedUser = {};

	let confirmDelete = false;
	let itemToBeDeleted = "";
	let itemType = "";
	let modal = "";

	/************************************************************
	 * 						Helper Functions
	 ************************************************************/

	// Creates a list of buildings that a user is permitted to view
	 function getPermittedBuildings() {
		if ($scope.loggedUser["UserType"] === "manager") {
			$scope.permittedBuildings = $scope.buildings;
		} else if ($scope.loggedUser["UserType"] === "owner") {
			for (const building of $scope.buildings) {
				if (building["Owner"] === $scope.loggedUser["LoginName"]) {
					$scope.permittedBuildings.push(building);
				}
			}
		} else {
			for (const building of $scope.buildings) {
				let projects = $scope.projects[building.ID];
				if (projects !== undefined) {
					for (let project of projects) {
						if (project["Contractor"] === $scope.loggedUser["LoginName"]) {
							$scope.permittedBuildings.push(building);
						}
					}
				}
			}
		}
		$scope.$apply();
	}

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

	// Simple line shortener function
	function getValue(id) {
		return document.getElementById(id).value;
	}

	// Helper function for generating building ids
	function generateID(isBuilding) {
		let id = 1;
		while (true) {
			if (isBuilding) {
				if (findBuilding(id) === undefined) {
					return id;
				}
			} else {
				if (findProject(id) === undefined) {
					return id;
				}
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
		return undefined;
	}

	// Helper function for finding a project with a given ID
	function findProject(id) {
		for (const [building, projects] of Object.entries($scope.projects)) {
			for (let project of projects) {
				if (project["ProjectID"] === id.toString()) {
					return project;
				}
			}
		}
		return undefined;
	}

	// Helper function for table sorting
	$scope.toNumber = function (row) {
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

  // Main function for receiving data from server for buildings / projects
	function updateData() {
		getBuildings();
		getProjects();
	}

	// To be used with navbar - doesnt save navbar page to history
	$scope.useNavBar = function (nextPage) {
		if (!pageHistory.includes("buildingDirectory")) {
			pageHistory.push("buildingDirectory");
		}
		switchPage(nextPage);
	}

	// To be used for moving pages via clicking into links
	$scope.changePage = function (nextPage) {
		pageHistory.push(currentPage);
		switchPage(nextPage);
	}

	// Allows for returning to the user's last page
	$scope.goBack = function () {
		const page = pageHistory.pop();
		switchPage(page);
	}

	// To be used with form submissions
	$scope.submit = function (form, nextPage) {
		switchPage(nextPage);
	}

	/************************************************************
	 * 						Logging In/Out
	 ************************************************************/

	// Used when a user has logged out
	$scope.logout = function () {
		$scope.changePage("login");
		pastPage = "";
		$scope.loggedIn = false;
		$scope.loggedUser = [];
		pageHistory = [];
		$scope.permittedBuildings = [];
	}

	// Used when a user clicks login
	$scope.login = async function (nextPage) {
		let result = await checkLogin(getValue("username"), getValue("password"));
		if (result === true) {
			$scope.loggedIn = true;
			document.getElementById("feedback").innerHTML = "";
			clearFields(["username", "password"]);
			updateData();
			$scope.changePage(nextPage);
		}
	}

	// Iterates through users details and checks against server
	async function checkLogin(username, password) {
		await getUsers();
		if (userList !== "") {
			for (let user of userList) {
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
	 * 						Accounts
	 ************************************************************/

	// Navigation function to select accounts
	$scope.viewAccount = function (name, type) {
		$scope.selectedUser = {};
		$scope.selectedUser['LoginName'] = name;
		$scope.selectedUser['UserType'] = type;
		$scope.changePage('viewAccount');
	}

	/************************************************************
	 * 						Buildings
	 ************************************************************/

	// Navigation function to select buildings
	$scope.viewBuilding = function (building) {
		$scope.selectedBuilding = building;
		$scope.changePage("viewBuilding");
	}

	// Navigation function to be used with + or edit button
	$scope.modifyBuilding = function (isCreate) {
		if (isCreate === true) {
			$scope.buildingID = generateID(true);
			$scope.changePage("createBuilding");
		} else {
			$scope.buildingID = parseInt($scope.selectedBuilding["ID"]);
			$scope.changePage("editBuilding");
		}
	}

	// Submit function for buildings
	$scope.submitBuilding = async function (nextPage, isCreate) {
		let building = {};
		if (isCreate === true) {
			building["ID"] = getValue("create-buildingID");
			building["Owner"] = getValue("create-owner");
			building["Address"] = getValue("create-address");
			building["BuildingType"] = getValue("create-buildingType");
			building["ConstructionDate"] = getValue("create-date");
		} else {
			building["ID"] = getValue("ID");
			building["Owner"] = getValue("owner");
			building["Address"] = getValue("address");
			building["BuildingType"] = getValue("buildingType");
			building["ConstructionDate"] = getValue("date");
		}
		await postBuilding(building);
		if (postSucceeded === true) {
			postSucceeded = false;
			if (isCreate === true) {
				clearFields(["create-owner", "create-address", "create-buildingType", "create-date"]);
				document.getElementById("createBuildingFeedback").innerHTML = "";
			} else {
				document.getElementById("buildingFeedback").innerHTML = "";
			}
			$scope.selectedBuilding = building;
			updateData(nextPage);
			switchPage(nextPage);
		}
	}

	/************************************************************
	 * 				Delete Confirmation Functions
	 ************************************************************/

	// This opens a confirmation modal
	$scope.confirmDelete = function(item, type) {
		confirmDelete = false;
		itemToBeDeleted = item;
		itemType = type;
		modal = new bootstrap.Modal(document.getElementById('deletionModal'));
		modal.toggle();
	}

	// This confirms the deletion of an item
	$scope.deleteItem = async function() {
		modal.toggle();
		if (itemType === "project") {
			await $scope.deleteProject(itemToBeDeleted);
		} else if (itemType === "work") {
			await $scope.deleteWork(itemToBeDeleted);
		} else {
			await $scope.deleteComment(itemToBeDeleted);
		}
	}

	/************************************************************
	 * 						Projects
	 ************************************************************/

	// Helper constructor method for projects
	function makeProject(projectID, name, buildingID, status, startDate, endDate, contactPerson,
						 projectManager, contractor, works, comments) {
		let project = {};
		project["ProjectID"] = projectID;
		project["Name"] = name;
		project["BuildingID"] = buildingID;
		project["Status"] = status;
		project["StartDate"] = startDate;
		project["EndDate"] = endDate;
		project["ContactPerson"] = contactPerson;
		project["ProjectManager"] = projectManager;
		project["Contractor"] = contractor;
		project["Works"] = works;
		project["Comments"] = comments;
		console.log(project);
		return project;
	}

	// Bridge method for navigating to a project
	$scope.viewProject = function (project, isEdit) {
		$scope.selectedProject = project;
		if (isEdit === true) {
			$scope.changePage('editProject');
		} else {
			$scope.changePage("viewProject");
		}
	}

	// Main method for deleting a project
	$scope.deleteProject = async function (project) {
		$scope.selectedProject = [];
		await deleteProject(project['ProjectID']);
		updateData();
		switchPage('editBuilding');
	}

	// Main method for creating or editing a project
	$scope.modifyProject = function (isCreate) {
		if (isCreate === true) {
			$scope.projectID = generateID(false);
			$scope.changePage("createProject");
		} else {
			$scope.projectID = parseInt($scope.selectedProject["ProjectID"]);
			$scope.changePage("editProject");
		}
	}

	// Main method for submitting a project
	$scope.submitProject = async function (nextPage, isCreate) {
		let project = {};
		if (isCreate === true) {
			project = makeProject(getValue("create-projectID"), getValue("create-projectName"), $scope.selectedBuilding['ID'],
				getValue("create-projectStatus"), getValue("create-startDate"), getValue("create-endDate"),
				getValue("create-contactPerson"), getValue("create-projectManager"), getValue("create-contractor"), [], []);
		} else {
			project = makeProject(getValue("edit-projectID"), getValue("edit-projectName"), $scope.selectedProject['BuildingID'],
				getValue("edit-projectStatus"), getValue("edit-startDate"), getValue("edit-endDate"),
				getValue("edit-contactPerson"), getValue("edit-projectManager"), getValue("edit-contractor"), $scope.selectedProject['Works'], $scope.selectedProject['Comments'])
		}
		await postProject(project);
		if (postSucceeded === true) {
			postSucceeded = false;
			if (isCreate === true) {
				clearFields(["create-projectName", "create-projectStatus", "create-startDate",
					"create-endDate", "create-contactPerson", "create-projectManager", "create-contractor"]);
				document.getElementById("createBuildingFeedback").innerHTML = "";
			} else {
				document.getElementById("buildingFeedback").innerHTML = "";
			}
			$scope.selectedProject = project;
			updateData();
			switchPage(nextPage);
		}
	}

	/************************************************************
	 * 						Works
	 ************************************************************/

	// Bridge method for creating or editing a work
	$scope.modifyWork = function (work) {
		if (work === undefined) {
			$scope.selectedWork = [];
			$scope.workTitle = "Create";
		} else {
			$scope.selectedWork = work;
			$scope.workTitle = "Edit";
		}
		$scope.changePage("createWork");
	}

	// Main method for deleting a work
	$scope.deleteWork = async function (work) {
		let project = $scope.selectedProject;
		let selectedWork = {};
		if (work === undefined) {
			selectedWork = $scope.selectedWork;
		} else {
			selectedWork = work;
		}
		let index = 0;
		for (let task of project['Works']) {
			if (JSON.stringify(task) === JSON.stringify(selectedWork)) {
				project['Works'].splice(index, 1);
			}
			index++;
		}
		await postProject(project);
		if (postSucceeded === true) {
			postSucceeded = false;
			$scope.selectedProject = project;
			updateData();
			switchPage('viewProject');
		}
	}

	// Main method for submitting a work
	$scope.submitWork = async function (nextPage, isCreate) {
		let work = {};
		let project = $scope.selectedProject;
		work['TypeOfWork'] = getValue("workType");
		work['Status'] = getValue("status");
		if (isCreate === true) {
			project['Works'].push(work);
		} else {
			for (let task of project['Works']) {
				if (JSON.stringify(task) === JSON.stringify($scope.selectedWork)) {
					task = work;
				}
			}
		}
		await postProject(project);
		if (postSucceeded === true) {
			postSucceeded = false;
			if (isCreate === true) {
				clearFields(["workType", "status"]);
			}
			$scope.selectedProject = project;
			updateData();
			switchPage(nextPage);
		}
	}

	/************************************************************
	 * 						Comments
	 ************************************************************/

	// Bridge method that is used for creating or editing a comment
	$scope.modifyComment = function (comment) {
		if (comment === undefined) {
			$scope.selectedComment = [];
			$scope.commentTitle = "Create";
		} else {
			$scope.selectedComment = comment;
			$scope.commentTitle = "Edit";
		}
		$scope.changePage("createComment");
	}

	// Main method for deleting a comment
	$scope.deleteComment = async function (comment) {
		let project = $scope.selectedProject;
		let selectedComment = {};
		if (comment === undefined) {
			selectedComment = $scope.selectedComment;
		} else {
			selectedComment = comment;
		}
		let index = 0;
		for (let storedComment of project['Comments']) {
			if (JSON.stringify(storedComment) === JSON.stringify(selectedComment)) {
				project['Comments'].splice(index, 1);
			}
			index++;
		}
		await postProject(project);
		if (postSucceeded === true) {
			postSucceeded = false;
			$scope.selectedComment = [];
			$scope.selectedProject = project;
			updateData();
			switchPage('viewProject');
		}
	}

	// Main method for submitting a comment
	$scope.submitComment = async function (nextPage, isCreate) {
		let comment = {};
		let project = $scope.selectedProject;
		if (isCreate === true) {
			comment['Text'] = getValue("comment");
			comment['Author'] = $scope.loggedUser['LoginName'];
			project['Comments'].push(comment);
		} else {
			for (let storedComment of project['Comments']) {
				if (JSON.stringify(storedComment) === JSON.stringify($scope.selectedComment)) {
					storedComment['Text'] = getValue('comment');
				}
			}
		}
		await postProject(project);
		if (postSucceeded === true) {
			postSucceeded = false;
			if (isCreate === true) {
				clearFields(["comment"]);
			}
			$scope.selectedComment = [];
			$scope.selectedProject = project;
			updateData();
			switchPage(nextPage);
		}
	}

	/************************************************************
	 * 						HTTP Functions
	 ************************************************************/

	// GET request for updating user logins
	async function getUsers() {
		await $http.get(server + "/user_list.json").then(
			function successCallback(response) {
				userList = response.data.users;
			}, function errorCallback(response) {
				document.getElementById("feedback").innerHTML = "Failed to connect to server.";
			});
	}

	// GET request for updating building list
	function getBuildings() {
		$http.get(server + "/building_dir.json").then(
			function successCallback(response) {
				$scope.buildings = response.data.buildings;
			}, function errorCallback(response) {
				console.log("Failed to grab building data from server")
			}
		);
	}

	// POST request for adding/updating a building
	async function postBuilding(building) {
		await $http.post(server + "/update.building.json", building).then(
			function successCallback(response) {
				postSucceeded = true;
			}, function errorCallback(response) {
				document.getElementById("buildingFeedback").innerHTML = "Failed to upload building, please try again";
			}
		);
	}

	// GET request for grabbing a specific project ID
	async function getProject(id) {
		await $http.get(server + "/project." + id + ".json").then(
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
		getPermittedBuildings();
		projectSearchCompleted = false;
	}

	// DELETE request for removing a project
	async function deleteProject(id) {
		await $http.delete(server + "/delete.project." + id + ".json").then(
			function successCallback(response) {
				console.log("Successfully deleted project");
			}, function errorCallback(response) {
				console.log("Failed to delete project");
			}
		);
	}

	// POST request for updating a project
	async function postProject(project) {
		await $http.post(server + "/update.project.json", project).then(
			function successCallback(response) {
				postSucceeded = true;
				console.log("Successfully updated project");
			}, function errorCallback(response) {
				console.log("Failed to update project");
			}
		);
	}
});