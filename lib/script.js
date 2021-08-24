angular.module('app', []).controller('MainCtrl', function($scope) {
  $scope.pages = {
    login: true,
    forgotPassword: false,
    buildingDirectory: false,
    buildingPage: false,
    projectPage: false,
    workPage: false,
    commentPage: false
  };

  $scope.loggedIn = false;

  $scope.changePage = function(currentPage, nextPage) {
    $scope.pages[currentPage] = false;
    $scope.pages[nextPage] = true;
  }

  $scope.login = function(currentPage, nextPage) {
    $scope.changePage(currentPage, nextPage)
    $scope.loggedIn = true;
  }
});