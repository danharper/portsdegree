angular.module('DegreeCalculator', [])

.factory('Classifier', function() {
	return window.portsmouthClassifier;
})

.controller('ResultsCtrl', function($scope, Classifier, UnitStorage) {
	window.ddd = UnitStorage;
	$scope.units = UnitStorage.fetch();

	$scope.addUnit = function(year) {
		$scope.units['year'+year].push({ title: 'Placeholder', credits: 20, grade: 100 })
	}

	$scope.removeUnit = function(year, unit) {
		$scope.units['year'+year] = $scope.units['year'+year].filter(function(u) { return u !== unit });
	}

	$scope.clearUnits = function(year) {
		$scope.units['year'+year] = [];
	}

	$scope.results = null;
	$scope.classifierError = null;

	$scope.$watch('units', function() {
		$scope.results = Classifier.classify($scope.units, function(msg) {
			$scope.classifierError = msg;
			$scope.results = null;
		})
		UnitStorage.persist($scope.units);
	}, true);
})

.factory('UnitStorage', function(OldDataExtractor) {
	return {
		persist: function(units) {
			var cloneUnit = function(u) { return _.pick(u, 'title', 'credits', 'grade') }

			var cloned = { year2: units.year2.map(cloneUnit), year3: units.year3.map(cloneUnit) };

			window.localStorage.setItem('units', JSON.stringify(cloned));
		},
		fetch: function() {
			var units = window.localStorage.getItem('units');
			if (units) return JSON.parse(units);

			// extract data from old app's storage
			units = OldDataExtractor.extract();
			if (units.year2.length || units.year3.length) {
				this.persist(units);
			}

			return units;
		}
	}
})

.factory('OldDataExtractor', function() {
	return {
		extract: function() {
			var units = { year2: [], year3: [] };

			Object.keys(localStorage).forEach(function(key) {
				if (key.match(/units-y[2,3]-/)) {
					var unit = JSON.parse(localStorage.getItem(key));
					var year = key.match(/units-y2-/) ? 'year2' : 'year3';

					units[year].push({
						title: unit.title,
						credits: unit.credits,
						grade: unit.grade
					});
				}
			});

			return units;
		}
	}
})
