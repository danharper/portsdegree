angular.module('DegreeCalculator', [])

.factory('Classifier', function() {
	return window.portsmouthClassifier;
})

.service('UnitStorage', function() {
	return {
		persist: function(units) {
			var units = units.map(function(u) {
				return {
					title: u.title,
					credits: u.credits,
					grade: u.grade,
					year: u.year
				};
			});
			window.localStorage.setItem('units', JSON.stringify(units));
		},
		fetch: function() {
			var units = window.localStorage.getItem('units');
			if ( ! units) return [];
			return JSON.parse(units);
		}
	}
})

.controller('ResultsCtrl', function($scope, Classifier, UnitStorage) {
	$scope.units = UnitStorage.fetch();

	$scope.addUnit = function(year) {
		$scope.units.push({ year: year, title: 'Placeholder', credits: 20, grade: 100 })
	}

	$scope.removeUnit = function(unit) {
		$scope.units = $scope.units.filter(function(u) { return u !== unit });
	}

	$scope.clearUnits = function(year) {
		$scope.units = $scope.units.filter(function(u) { return u.year !== year });
	}

	$scope.results = null;
	$scope.classifierError = null;

	$scope.$watch('units', function() {
		var marks = {
			year2: $scope.units.filter(function(u) { return u.year === 2 }),
			year3: $scope.units.filter(function(u) { return u.year === 3 })
		}
		$scope.results = Classifier.classify(marks, function(msg) {
			$scope.classifierError = msg;
			$scope.results = null;
		})
		UnitStorage.persist($scope.units);
	}, true);
});