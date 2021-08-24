angular.module('app', []).controller('MainCtrl', function($scope) {
  $scope.pages = {
    login: true,
    signup: false,
    forgotPassword: false,
    buildingDirectory: false,
    buildingPage: false,
    projectPage: false,
    workPage: false,
    commentPage: false
  };

  $scope.currentPage = "login";
  $scope.loggedIn = false;

  $scope.changePage = function(nextPage) {
    $scope.pages[$scope.currentPage] = false;
    $scope.pages[nextPage] = true;
    $scope.currentPage = nextPage;
  }

  $scope.login = function(nextPage) {
    $scope.changePage(nextPage)
    $scope.loggedIn = true;
  }

  $scope.logout = function() {
    $scope.changePage("login")
    $scope.loggedIn = false;
  }
});