angular.module('fab-directives', [])

.directive('fabSource', function ($http) {


	// see https://github.com/angular/angular.js/blob/master/src/ng/directive/ngRepeat.js#L327
	var ngRepeatExpressionMatcher = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/;

	// inspired by the ng-repeat's expression matcher
	var fabSourceExpressionMatcher = /^\s*(.*?)(?:(?:\s+as\s+)(.*?))?\s*$/;

	return {
		restrict: 'A',
		priority: 1001,	// priority just above ng-repeat's
		require: ['?form'],
		link: function (scope, element, attrs, ctrls) {

			// location of the data source (url)
			var sourceAddress;

			// name of the property of the scope
			// that will hold the data response from the request
			var scopeDataProperty;


			// attempt to match sourceAddress and scopeDataProperty
			var addressMatch = attrs.fabSource.match(fabSourceExpressionMatcher);

			sourceAddress = addressMatch[1];
			scopeDataProperty = addressMatch[2];


			if (attrs.ngRepeat) {
				// if there is an ng-repeat, 
				// override the scopeDataProperty
				var ngRepeatMatch = attrs.ngRepeat.match(ngRepeatExpressionMatcher);

				scopeDataProperty = ngRepeatMatch[2];
			}

			$http.get(sourceAddress)
				.then(function (res) {
					scope[scopeDataProperty] = res.data;
				})

		}

	}
});
