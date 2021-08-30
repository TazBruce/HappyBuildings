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

  $scope.pageHistory = [];
  $scope.currentPage = "login";
  $scope.loggedIn = false;

  // Primary function for changing the currently viewed page
  $scope.changePage = function(nextPage) {
    $scope.pageHistory.push($scope.currentPage);
    $scope.pages[$scope.currentPage] = false;
    $scope.pages[nextPage] = true;
    $scope.currentPage = nextPage;
  }

  // Allows for returning to the user's last page
  $scope.goBack = function() {
    const page = $scope.pageHistory.pop();
    $scope.pages[$scope.currentPage] = false;
    $scope.pages[page] = true;
    $scope.currentPage = page;
  }

  // Used when a user has logged in
  $scope.login = function(nextPage) {
    $scope.changePage(nextPage);
    $scope.loggedIn = true;
  }

  // Used when a user has logged out
  $scope.logout = function() {
    $scope.changePage("login");
    $scope.loggedIn = false;
    $scope.pageHistory = [];
  }
});