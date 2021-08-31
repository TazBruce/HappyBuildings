angular.module('app', []).controller('MainCtrl', function($scope) {
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

  const navPages = ["buildingDirectory", "viewAccount", "createAccount"];
  let activeNavBar = "buildingDirectory";
  let pageHistory = [];
  let currentPage = "login";
  let pastPage = "";
  $scope.loggedIn = false;

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

  // Used when a user has logged in
  $scope.login = function(nextPage) {
    $scope.changePage(nextPage);
    $scope.loggedIn = true;
  }

  // Used when a user has logged out
  $scope.logout = function() {
    $scope.changePage("login");
    pastPage = "";
    $scope.loggedIn = false;
    pageHistory = [];
  }
});