var App = window.App = new Backbone.Marionette.Application({
	Models: {},
	Collections: {},
	Views: {},
	Routers: {}
});

App.addRegions({
	year2table: '#y2t',
	year3table: '#y3t',
	results: '#results'
});

App.Models.Unit = Backbone.Model.extend();

App.Models.Result = Backbone.Model.extend();

App.Collections.Units = Backbone.Collection.extend({
	model: App.Models.Unit,
	setLS: function(name) {
		this.localStorage = new Backbone.LocalStorage('units-'+name);
		return this;
	},
	destroy: function() {
		var model;
		while (model = this.first()) {
			model.destroy();
		}
	}
});



App.Views.UnitTableRow = Backbone.Marionette.ItemView.extend({
	template: '#tUnitTableRow',
	tagName: 'tr',

	initialize: function() {
		this.modelBinder = new Backbone.ModelBinder();
	},

	onRender: function() {
		this.modelBinder.bind(this.model, this.el);
	},

	events: {
		'click .removeUnit': 'removeUnit'
	},

	removeUnit: function(e) {
		e.preventDefault();
		this.model.destroy();
	}
});

App.Views.UnitTable = Backbone.Marionette.CompositeView.extend({
	template: '#tUnitTable',
	itemView: App.Views.UnitTableRow,

	appendHtml: function(collectionView, itemView, index) {
		collectionView.$('tbody').append(itemView.el);
	},

	events: {
		'click .addUnit': 'addUnit',
		'click .removeUnits': 'removeUnits'
	},

	addUnit: function(e) {
		e.preventDefault();
		this.collection.create({
			title: 'Placeholder',
			credits: 20,
			grade: 100
		});
	},

	removeUnits: function(e) {
		e.preventDefault();
		this.collection.destroy();
	}
});


App.Views.Results = Backbone.Marionette.ItemView.extend({
	template: '#tResults',

	initialize: function() {
		this.classifier = this.options.classifier;
	},

	serializeData: function() {
		return {
			results: this.model.toJSON()
		};
	},

	modelEvents: {
		'change': 'render'
	},

	events: {
		'click .generateResults': 'generateResults'
	},

	generateResults: function(e) {
		e.preventDefault();
		this.options.classifier.classify(function(msg) {
			alert(msg);
		});
	}
});



App.Classifier = Backbone.Marionette.Controller.extend({
	initialize: function(options) {
		this.year2 = options.year2;
		this.year3 = options.year3;
		this.results = options.results;

		this.c = window.portsmouthClassifier;
	},

	validate: function(error) {
		if ( ! (this.year2.length && this.year3.length)) {
			error('Units must exist for both years 2 and 3');
			return false;
		}

		var y2credits = this.c.totalCredits(this.year2.toJSON());
		if (y2credits != 120) {
			error('Year 2 must have 120 credits - it has '+y2credits);
			return false;
		}

		var y3credits = this.c.totalCredits(this.year3.toJSON());
		if (y3credits != 120) {
			error('Year 3 must have 120 credits - it has '+y3credits);
			return false;
		}

		return true;
	},

	classify: function(error) {
		if ( ! this.validate(error)) return;

		var results = this.c.classify({
			year2: this.year2.toJSON(),
			year3: this.year3.toJSON()
		});

		console.log('done', results);

		this.results.set(results);
	}
});






App.addInitializer(function(options) {
	var y2c = window.y2 = new App.Collections.Units().setLS('y2');
	y2c.fetch();
	App.year2table.show(new App.Views.UnitTable({
		collection: y2c
	}));

	var y3c = window.y3 = new App.Collections.Units().setLS('y3');
	y3c.fetch();
	App.year3table.show(new App.Views.UnitTable({
		collection: y3c
	}));

	var result = new App.Models.Result();
	App.results.show(new App.Views.Results({
		model: result,
		classifier: new App.Classifier({
			year2: y2c,
			year3: y3c,
			results: result
		})
	}));

	Backbone.history.start();
});

App.start();
