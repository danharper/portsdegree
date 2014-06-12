
/*
  run with:
  portsmouthClassifier.classify(marks);
*/

var portsmouthClassifier = (function() {

	var totalCredits = function(year) {
		return _.reduce(year, function(memo, unit) {
			return memo + parseInt(unit.credits, 10);
		}, 0);
	};

	var sortByGrade = function(year) {
		return _.sortBy(year, function(unit) { return -unit.grade; });
	};

	var cloneYearMarks = function(year) {
		var clone = year.slice(0);
		return _.map(clone, function(unit) { return _.clone(unit); });
	};

	var sumGrades = function(year) {
		return _.reduce(year, function(memo, unit) {
			return memo + parseInt(unit.grade, 10);
		}, 0);
	};

	var grader = function(mark) {
		var grade, borderline = false;

		if (mark <= 39) {
			grade = 'Fail';
		}
		else if (mark >= 40 && mark <= 49) {
			grade = '3rd';
		}
		else if (mark >= 49 && mark < 50) {
			grade = '3rd or 2:2'
			borderline = true;
		}
		else if (mark >= 50 && mark <= 59) {
			grade = '2:2';
		}
		else if (mark >= 59 && mark < 60) {
			grade = '2:2 or 2:1';
			borderline = true;
		}
		else if (mark >= 60 && mark <= 69) {
			grade = '2:1';
		}
		else if (mark >= 69 && mark < 70) {
			grade = '2:1 or 1st';
			borderline = true;
		}
		else if (mark >= 70) {
			grade = '1st';
		}

		return {
			grade: grade,
			borderline: borderline
		};
	};

	// turn all units into 10-credit equivalents
	var standardiseUnits = function(marks) {
		var year = cloneYearMarks(marks);
		var newMarks = [];

		_.each(year, function(y) {
			y.grade = parseInt(y.grade, 10);

			if (y.credits == 10) {
				newMarks.push(y);
			}
			else if (y.credits == 20) {
				y.credits = 10;
				newMarks.push(y);
				newMarks.push(y);
			}
			else if (y.credits == 40) {
				y.credits = 10;
				newMarks.push(y);
				newMarks.push(y);
				newMarks.push(y);
				newMarks.push(y);
			}
			else {
				throw new Error('Unknown number of credits: '+y.credits);
			}
		});


		return sortByGrade(newMarks);
	};

	var removeWorst20Credits = function(marks) {
		return marks.slice(0, -2);
	};

	var validateMarks = function(marks, error) {
		error = error || function(msg) { throw new Error(msg); };
		// console.log('in', marks);

		if ( ! (marks.year2.length && marks.year3.length)) {
			error('Units must exist for both years 2 and 3');
			return false;
		}

		var y2credits = totalCredits(marks.year2);
		if (y2credits != 120) {
			error('Year 2 must have 120 credits - it has '+y2credits);
			return false;
		}

		var y3credits = totalCredits(marks.year3);
		if (y3credits != 120) {
			error('Year 3 must have 120 credits - it has '+y3credits);
			return false;
		}

		return true;
	};

	var classifiers = {
		ruleA: function(grades) {
			var y2 = removeWorst20Credits(standardiseUnits(grades.year2));
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));

			var meanY2 = sumGrades(y2) / y2.length;
			var meanY3 = sumGrades(y3) / y3.length;

			return ((meanY2 / 100 * 40) + (meanY3 / 100 * 60)).toFixed(3);
		},

		ruleB: function(grades) {
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));
			return (sumGrades(y3) / y3.length).toFixed(3);
		},

		ruleC: function(grades) {
			var y2 = removeWorst20Credits(standardiseUnits(grades.year2));
			var y3 = removeWorst20Credits(standardiseUnits(grades.year3));

			// combine them & sort them
			var join = sortByGrade(y2.concat(y3));

			// grab 100 credits (top 50%) worth of units
			var creditCount = 0,
				i = 0,
				top120 = [],
				tempUnit;

			while (creditCount < 120) {
				tempUnit = join[i];
				creditCount += parseInt(tempUnit.credits, 10);
				top120.push(tempUnit);
				i++;
			}

			// take bottom grade
			return (_.last(top120).grade).toFixed(3);
		}
	};

	var classify = function(marks, error) {
		if ( ! validateMarks(marks, error)) return false;

		var results = [
			classifiers.ruleA(marks),
			classifiers.ruleB(marks),
			classifiers.ruleC(marks)
		];

		var result = _.first(_.sortBy(results, function(r) { return -r; }));

		var graderResult = grader(result);

		return {
			grade: graderResult.grade,
			borderline: graderResult.borderline,
			result: result+'%',
			details: {
				ruleA: results[0]+'%',
				ruleB: results[1]+'%',
				ruleC: results[2]+'%'
			}
		};
	};

	return {
		totalCredits: totalCredits,
		classify: classify,
		validate: validateMarks
	};

})();

