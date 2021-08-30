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
    viewTask: false,
    createTask: false,
    createComment: false
  };

  $scope.pastPage = "";
  $scope.currentPage = "login";
  $scope.loggedIn = false;

  // Primary function for changing the currently viewed page
  $scope.changePage = function(nextPage) {
    $scope.pages[$scope.currentPage] = false;
    $scope.pages[nextPage] = true;
    $scope.pastPage = $scope.currentPage;
    $scope.currentPage = nextPage;
  }

  //
  $scope.goBack = function() {

  }

  $scope.login = function(nextPage) {
    $scope.changePage(nextPage)
    $scope.loggedIn = true;
  }

  $scope.logout = function() {
    $scope.changePage("login")
    $scope.pastPage = "";
    $scope.loggedIn = false;
  }
});