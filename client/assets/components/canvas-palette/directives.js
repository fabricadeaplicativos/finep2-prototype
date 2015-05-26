angular.module('fab-canvas-palette.directives', [])

.directive('fabComponentPalette', function ($http, $sce) {


  var host = 'https://s3.amazonaws.com/finep';

  var componentsDbUrl = host + '/api/components/registry.json';

  return {
    restrict: 'AE',
   /*
    * AngularJS explanation as to why we need to use $sce.trustAsResourceUrl:
    * AngularJS' Strict Contextual Escaping (SCE) mode (enabled by default) has blocked loading a resource from an insecure URL.
    * Typically, this would occur if you're attempting to load an Angular template from an untrusted source. It's also possible that a custom directive threw this error for a similar reason.
    * Angular only loads templates from trusted URLs (by calling $sce.getTrustedResourceUrl on the template URL).
    * By default, only URLs that belong to the same origin are trusted. These are urls with the same domain, protocol and port as the application document.
    * The ngInclude directive and directives that specify a templateUrl require a trusted resource URL.
    * To load templates from other domains and/or protocols, either adjust the whitelist/ blacklist or wrap the URL with a call to $sce.trustAsResourceUrl.
    */
    templateUrl: $sce.trustAsResourceUrl(host + '/client/assets/components/canvas-palette/templates/component-palette.html'),
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
  
.directive('fabElementPalette', function ($http, $sce) {

  var HOST = 'https://s3.amazonaws.com/finep';
  var ELEMENTS_DB_URL = HOST + '/api/elements/registry.json';

  return {
    restrict: 'AE',
    templateUrl: $sce.trustAsResourceUrl(HOST + '/client/assets/components/canvas-palette/templates/element-palette.html'),
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
      });
    }
  }
})

// droppable
.directive('surface', function ($compile, $http) {

  return {
    restrict : "A",
    link: function(scope, element, attrs) {


      console.log('surface discovered')

      element.bind('dragover', function (e) {
        console.log('dragover')

        element.addClass('dragover');

        e.preventDefault();
        e.stopPropagation();
      });

      element.bind('dragleave', function (e) {

        console.log('dragleave');

        element.removeClass('dragover');
        e.preventDefault();
        e.stopPropagation();
      })

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
              xPath: attrs.xPath,
              fname: attrs.fname,
            }
          };
        } else {
          // data to be sent to the parent window
          data = {
            message: 'addBlock',
            blockData: blockData,
            surfaceData: {
              xPath: attrs.xPath,
              fname: attrs.fname,
            }
          };
        }

        window.parent.postMessage(JSON.stringify(data), '*');

        element.removeClass('dragover');
        e.stopPropagation();

      });

      // element[0].addEventListener("drop", drop, false);
      // element[0].addEventListener("dragover", scope.handleDragOver, false);

    }
  }
});