define(['atom', 'atomjs/lang'], function (atom, lang) {
	"use strict";

	var models;

	return {
		bind: function () {
			// catch keyup event to update profiles
			this.onWithin('keyup', 'input[type=text]', this.onUpdateProfiles);
		},

		onInit: function (e, callback) {
			var modelElement,
				container = e.target.find('#profiles');

			// some example models - would come from a server-side JSON call in real life.
			models = [
				{
					id: 1,
					name: 'Profile 1',
					description: 'this is profile 1'
				},
				{
					id: 2,
					name: 'Profile 2',
					description: 'this is profile 2'
				},
				{
					id: 3,
					name: 'Profile 3',
					description: 'this is profile 3'
				}
			];

			// first create a new element from the 'models.profile' fragment, based on each model and add to container
			lang.each(models, function (profile) {
				modelElement = atom.modelElement('models.profile', profile.id);
				container.append(modelElement);
			});

			// now bind models to the elements on the page which use them (this same call is used when updating models too)
			atom.dataBindModelsByType(models, 'profile');

			// don't forget to callback from init!
			callback();
		},

		onUpdateProfiles: function (e) {
			// change value in persistent models, or even fetch models again,
			// as long as the id of the model corresponds to the model element with the same id on the page.
			lang.each(models, function (profile) {
				profile.description = profile.name + ' = ' + e.target.val();
			});

			// now re-bind models to the elements on the page which use them.
			// you can remove model elements from the page and re-insert without worrying about binding.
			// when it's time to update, just pass the list of models and the type name, the elements on the page which match both will be updated.
			atom.dataBindModelsByType(models, 'profile');
		}
	};
});