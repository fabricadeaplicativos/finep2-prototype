var app = angular.module('Editor', [
	'ngMaterial',
	'Editor.editors.controller',
	'ui.grid'
]);

app.controller('AppCtrl', function($scope, $mdSidenav, $mdDialog){

	$scope.falaroi = function() {
		alert('Oi luciana');
	}
	$scope.toggleSidenav = function(menuId) {
		$mdSidenav(menuId).toggle();
	};
 	
 	$scope.alert = '';
  $scope.showAlert = function(ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    // Modal dialogs should fully cover application
    // to prevent interaction outside of dialog
    $mdDialog.show(
      $mdDialog.alert()
        .parent(angular.element(document.body))
        .title('This is an alert title')
        .content('You can specify some description text in here.')
        .ariaLabel('Alert Dialog Demo')
        .ok('Got it!')
        .targetEvent(ev)
    );
  };

  $scope.showConfirm = function(ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
      .parent(angular.element(document.body))
      .title('Would you like to delete your debt?')
      .content('All of the banks have agreed to forgive you your debts.')
      .ariaLabel('Lucky day')
      .ok('Please do it!')
      .cancel('Sounds like a scam')
      .targetEvent(ev);
    $mdDialog.show(confirm).then(function() {
      $scope.alert = 'You decided to get rid of your debt.';
    }, function() {
      $scope.alert = 'You decided to keep your debt.';
    });
  };

   $scope.showAdvanced = function(ev) {
    $mdDialog.show({
      controller: function DialogController($scope, $mdDialog) {
				  $scope.hide = function() {
				    $mdDialog.hide();
				  };
				  $scope.cancel = function() {
				    $mdDialog.cancel();
				  };
				  $scope.answer = function(answer) {
				    $mdDialog.hide(answer);
				  };

				  $scope.oi = function () {
				  	alert('oi')
				  }
				},
      templateUrl: 'assets/components/dialogs/dialog-advanced.html',
      targetEvent: ev,
    })
    .then(function(answer) {
     alert('You said the information was "' + answer + '".');
    }, function() {
      $scope.alert = 'You cancelled the dialog.';
    });
  };
});