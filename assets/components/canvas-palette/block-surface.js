angular.module('fab-block-surface', [])


// draggable
.directive('block', function ($http) {


  return {
    restrict: "A",
    link : function(scope, element, attrs) {


      // set the element to be draggable
      element.attr('draggable', true);

      // set handlers for the dragging action
      element.on('dragstart', function (e) {
        console.log(e);
        //      console.log(el.outerHTML);
        event.dataTransfer.setData('Text', attrs.block);
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

        var fullHTML = document.querySelector('body').innerHTML;

          
        var origin = "*";
        window.parent.postMessage(fullHTML, origin);

  return {
    restrict : "A",
    link: function(scope, element, attrs) {

      element.bind('dragover', function (e) {
        console.log('dragover')
        e.preventDefault();
      });

      element.bind('drop', function (e) {
        // console.log(arguments)
        // 



        var elSrc = e.dataTransfer.getData('Text');


        // load the html template
        $http.get(elSrc);

        var newElHtml = '<ng-include src="\'' + elSrc + '\'"></ng-include>';

        console.log(newElHtml);
        var newEl = $compile(newElHtml)(scope);

        console.log(newEl);

        console.log('drop')

        element.append(newEl);


        var fullHTML = document.querySelector('body').innerHTML;

          
        var origin = "*";
        window.parent.postMessage(fullHTML, origin);

      });

      // element[0].addEventListener("drop", drop, false);
      // element[0].addEventListener("dragover", scope.handleDragOver, false);

    }
  }
});