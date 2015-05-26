angular.module('Dialog.dialogs.controllers', ['Editor.editors.services'])

.controller('ColumnAssociationController', [
	'$scope',
	'$mdDialog',
	'DatabaseService',
	function($scope, $mdDialog, DatabaseService) {
		// *************************************
		// S T A R T - U P   P R O P E R T I E S
		// *************************************

		var NEW_COLUMN_ASSOCIATION = "newColumnAssociation";
		var EXISTING_COLUMN_ASSOCIATION = "existingColumnAssociation";		

		/*
		 * Example:
		 	["<collection-name1>", "<collection-name2>", "<collection-name3>", ...]
		 */
		$scope.collections = [];

		/*
		 * Example:
		 	{
				"<collection-name1>": {
					"<property-name>": {
						"name": "<property-name>",
						"type": "<property-type>",
						"typeLabel": "<property-type>",
						"required": false,
						"id": "<property-name>"
					},
					"<property-name>": {...}
				},
				"<collection-name2>": {...}
		 	}
		 */
		$scope.properties = {};

		// If true, hides the "associate with existing column" options
		$scope.hideExistingColumnOption = false;

		// If true, hides the "associate with new column" options
		$scope.hideNewColumnOption = true;

		// If true, hides the "insert content without associating to any column" options  
		$scope.hideManualEditionOption = true;

		// If true, shows an input field so the user can choose the new column's name
		// and a drop-down so she can select its type.
		$scope.showColumnNameTypeInput = false;

		// Hold the collection and the property chosen by the user.
		// If the user selects an existing column, she'll have to choose a collection
		// and a property. But if she wants just to create a column, $scope.selectedItems.property
		// will be undefined
		// $scope.selectedItems = {
		// 	option: "existingColumnAssociation",
		// 	collection: undefined,
		// 	property: undefined
		// };
		$scope.selectedItems = {
			option: "existingColumnAssociation"
		};

		/*
		 * Available types for new columns
		 */
		$scope.types = [
			{ label: 'texto'	, value: 'string' 	 },
			{ label: 'número'	, value: 'number' 	 }
		];

		// *******************************
		// S T A R T - U P   A C T I O N S
		// *******************************

		// Gets all the collections and their properties so the user can choose
		// a collection and a column to associate the new element to.
		var getCollectionsPromise = DatabaseService.getCollections();

		getCollectionsPromise.then(function(collections) {
			/*
			 * collections should look like:
			 	[  
			      {  
			         "type":"Collection",
			         "properties":{  
			            "image":{  
			               "name":"image",
			               "type":"string",
			               "typeLabel":"string",
			               "required":false,
			               "id":"image",
			               "order":0
			            },
			            "title":{  
			               "name":"title",
			               "type":"string",
			               "typeLabel":"string",
			               "required":false,
			               "id":"title",
			               "order":1
			            },
			            "description":{  
			               "name":"description",
			               "type":"string",
			               "typeLabel":"string",
			               "required":false,
			               "id":"description",
			               "order":2
			            }
			         },
			         "id":"gallery_1431426867950"
			      },
			      {...}
			    ]
			 */

			collections.forEach(function(collection) {
				$scope.collections.push(collection.id);
				$scope.properties[collection.id] = collection.properties;
			});

			console.log(JSON.stringify($scope.collections));
			console.log(JSON.stringify($scope.properties));
		}, function(err) {
			console.error('Error while trying to get collections');
			console.error(err);
		});

		// *****************
		// F U N C T I O N S
		// *****************

		$scope.closeModal = function() {
			/*
			 * Before we return the selected items, we need to do
			 * some processing. If the user chooses to create a new column,
			 * it's possible that she picks a composed name with spaces.
			 * if we create a property with space, it'll break everything.
			 * What we need to do is to make the name chosen by the user
			 * as the property label, and remove the space so it can become
			 * the "default_name".
			 */
			if ($scope.selectedItems.option === NEW_COLUMN_ASSOCIATION) {
				$scope.selectedItems.label = $scope.selectedItems.property;
				$scope.selectedItems.property = $scope.selectedItems.property.replace(/ /g, '_');
			}

			$mdDialog.hide($scope.selectedItems);
		};

		$scope.cancelColumnAssociationOp = function() {
			$mdDialog.hide();
		}

		$scope.radioButtonSelected = function() {
			if ($scope.selectedItems.option === EXISTING_COLUMN_ASSOCIATION) {
				$scope.hideExistingColumnOption = false;
				$scope.hideNewColumnOption = true;
				$scope.hideManualEditionOption = true;			
			} else if ($scope.selectedItems.option === NEW_COLUMN_ASSOCIATION) {
				$scope.hideExistingColumnOption = true;
				$scope.hideNewColumnOption = false;
				$scope.hideManualEditionOption = true;

				/*
				 * When the dialog pops up, the first option is already selected.
				 * if the user picks a table and a column and clicks the "new column association"
				 * option, the name of the table will already be chosen 
				 * (because they share $scope.selectedItems.collection and $scope.selectedItems.property).
				 * So we need to clean them up first so she can chooses a table.
				 */
				$scope.selectedItems.collection = undefined;
				$scope.selectedItems.property = undefined;
			} else {
				$scope.hideExistingColumnOption = true;
				$scope.hideNewColumnOption = true;
				$scope.hideManualEditionOption = false;
			}
		}

		// Executes when user chooses a table after selecting 
		// "associate element to a new column" option
		$scope.userDidChooseCollection = function() {
			if (typeof $scope.selectedItems.collection !== 'undefined') {
				$scope.showColumnNameTypeInput = true;
			} else {
				$scope.showColumnNameTypeInput = false;
			}
		}
	}
])

.controller("NewElementController", [
	"$scope",
	"$mdDialog", 
	function ($scope, $mdDialog) {

		// *************************************
		// S T A R T - U P   P R O P E R T I E S
		// *************************************

		var HOST = "https://s3.amazonaws.com/finep/";

		$scope.elements = [
			{url: HOST + "api/elements/titles/h1/placeholder.html", value: "h1"},
			{url: HOST + "api/elements/titles/h2/placeholder.html", value: "h2"},
			{url: HOST + "api/elements/titles/h3/placeholder.html", value: "h3"},
			{url: HOST + "api/elements/titles/h4/placeholder.html", value: "h4"},
			{url: HOST + "api/elements/texts/p/placeholder.html",   value: "p"},
		];

		$scope.types = [
			{ label: 'texto'		, value: 'string' 		},
			{ label: 'número'		, value: 'number' 		}
		];

		$scope.selectedItems = {};		

		// *****************
		// F U N C T I O N S
		// *****************

		$scope.closeDialog = function() {
			$mdDialog.hide($scope.selectedItems);
		};

		$scope.cancelNewElementCreation = function() {
			$mdDialog.hide();
		}
	}
])
