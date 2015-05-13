angular.module('fab-canvas-palette.directives', [])

.directive('fabComponentPalette', function ($http) {


  var host = 'http://localhost:3000';

  var componentsDbUrl = host + '/api/components/registry.json';

  return {
    restrict: 'AE',
    templateUrl: host + '/client/assets/components/canvas-palette/templates/component-palette.html',
    link: function (scope, element, attrs) {

      // declare var to hold components
      var components = [];
      scope.components = components;

      $http.get(componentsDbUrl)
        .then(function (res) {

          res.data.forEach(function (cp) {
            components.push(cp);
          });
        })
    }
  }
})
  
.directive('fabElementPalette', function ($http) {

  var HOST = 'http://localhost:3000';
  var ELEMENTS_DB_URL = HOST + '/api/elements/registry.json';

  return {
    restrict: 'AE',
    templateUrl: HOST + '/client/assets/components/canvas-palette/templates/element-palette.html',
    link: function (scope, element, attrs) {

      // declare var to hold elements
      var elements = [];
      scope.elements = elements;

      $http.get(ELEMENTS_DB_URL)
        .then(function (res) {

          for (var i = 0; i < res.data.length; i++) {
            elements.push(res.data[i]);
          }
        })
    }
  }
})

// draggable
.directive('block', function ($http) {


  return {
    restrict: "A",
    link : function(scope, element, attrs) {

      // set the element to be draggable
      element.attr('draggable', true);

      // set handlers for the dragging action
      element.on('dragstart', function (e) {
        event.dataTransfer.setData('blockData', attrs.blockData);
      })

      $http.get(attrs.block).then(function (res) {
        element.html(res.data);
      })
      // element[0].addEventListener("dragstart", scope.handleDragStart, false);
      // element[0].addEventListener("dragend", scope.handleDragEnd, false);
      // element[0].addEventListener("dragenter", scope.handleDragEnter, false);
      // element[0].addEventListener("dragleave", scope.handleDragLeave, false);
    }
  }
})

// droppable
.directive('surface', function ($compile, $http) {

  return {
    restrict : "A",
    link: function(scope, element, attrs) {


      console.log('surface discovered')
      console.log(element)

      element.bind('dragover', function (e) {
        console.log('dragover')
        e.preventDefault();
      });

      element.bind('drop', function (e) {

        // data about the block
        var blockData = JSON.parse(e.dataTransfer.getData('blockData'));

        // the url of the placeholder 
        var placeholderUrl = blockData.placeholderUrl;

        // load the html template
        $http.get(placeholderUrl);

        var newElHtml = '<ng-include src="\'' + placeholderUrl + '\'"></ng-include>';

        var newEl = $compile(newElHtml)(scope);

        element.append(newEl);

        var data = {};
        if (blockData.category === 'component') {
          // data to be sent to the parent window
          data = {
            message: 'addBlock',
            blockData: blockData,
            surfaceData: {
              xPath: '/html/body/ion-pane/ion-content',
              fname: 'www/index.html',
            }
          };
        } else {
          // data to be sent to the parent window
          data = {
            message: 'addBlock',
            blockData: blockData,
            surfaceData: {
              xPath: '/html/body/ion-pane/ion-content/div/a',
              fname: 'www/index.html',
            }
          };
        }

        window.parent.postMessage(JSON.stringify(data), '*');

        e.stopPropagation();

      });

      // element[0].addEventListener("drop", drop, false);
      // element[0].addEventListener("dragover", scope.handleDragOver, false);

    }
  }
});