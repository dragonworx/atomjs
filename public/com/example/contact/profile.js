define(['atom', 'atomjs/lang'], function (atom, lang) {
	"use strict";

	var profileModels;

	return {
		bind: function () {
			// catch keyup event to update profiles
			this.onWithin('keyup', 'input[type=text]', this.onUpdateProfiles);
		},

		onInit: function (e, callback) {
			var profilesContainer = $('#profiles-container'),
				profileOptions;

			// some example models - would come from a server-side JSON call in real life.
			profileModels = [
				{
					id: 1,
					name: 'Profile 1 Name',
					description: 'this is profile 1 description (it has extra css class values)'
				},
				{
					id: 2,
					name: 'Profile 2 Name',
					description: 'this is profile 2 description'
				},
				{
					id: 3,
					name: 'Profile 3 Name',
					description: 'this is profile 3 description'
				}
			];

			// first create a new element from the 'models.profile' fragment, based on each model and add to container
			lang.each(profileModels, function (profile, index) {
				// create options for new element
				profileOptions = {
					fragment: 'com.example.fragments.profile',
					model: {
						id: profile.id,
						type: 'com.example.models.profile'
					},
					container: profilesContainer
				};

				// add some example classes for the first index
				if (index === 0) {
					profileOptions.classes = 'label label-info';
				}

				// create new element, will be added to container through options
				atom.create(profileOptions);
			});

			// data bind all models data required by elements found in container
			atom.dataBind({
				models: profileModels,
				type: 'com.example.models.profile',
				container: profilesContainer
			});

			// don't forget to callback from init!
			callback();
		},

		onUpdateProfiles: function (e) {
			var profilesContainer = $('#profiles-container');

			// modify profiles
			lang.each(profileModels, function (profile) {
				profile.description = profile.name + ' = ' + e.target.val();
			});

			// re-data bind all models data required by elements found in container
			atom.dataBind({
				models: profileModels,
				type: 'com.example.models.profile',
				container: profilesContainer
			});
		}
	};
});