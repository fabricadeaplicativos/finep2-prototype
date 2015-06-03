var app = angular.module('Editor', [
	'ngMaterial',
	'Editor.editors.controller',
	'ui.grid'
]);

app.controller('AppCtrl', function($scope, $mdSidenav, $mdDialog, $window) {
  $scope.frameSrc = $window.CANVAS_CONFIG.socketHost + ':3100/www/index.html#/app/banco-de-dados';
    
  // QRCode
    $scope.generateQRCode = function () {
        $mdDialog.show({
            controller: function($scope) {
                var host = $window.CANVAS_CONFIG.socketHost + ':3100/www/#/app/banco-de-dados';

                $scope.qrcode = {
                    url: "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + host
                };

                $scope.dismissDialog = function() {
                    $mdDialog.hide();
                }
            },
            templateUrl: 'assets/components/dialogs/dialog-qrcode.html',
            clickOutsideToClose: true
        });
    };

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
})

.config(function($sceDelegateProvider) {
    /*
     * If we need to load, say, an HTML from another origin
     * different from localhost, we'll need to whitelist it so
     * we don't have problems with CORS.
     */
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'http://localhost**',
        // Allow resource loading from within Fabrica's network
        'http://192.168.**',
        // Allow loading resources from our Amazon S3 bucket.
        'https://s3.amazonaws.com/finep/**',
        // Allow loading resources from our Amazon EC2 instance
        'http://finep.fabapp.com**'
    ]);
})

.factory('IO', function($window) {
    // get port of the socketServer
    var socketServerPort = $window.socketServerPort || 3102;

    // create socket
    window.socket = io.connect($window.CANVAS_CONFIG.socketHost + ':' + socketServerPort + '/canvas');
    // window.socket = io.connect('http://ec2-52-7-200-59.compute-1.amazonaws.com:' + socketServerPort + '/canvas');

    var ioService = {};

    ioService.connection = function() {
        return window.socket;
    }

    // return socket
    return ioService;
});