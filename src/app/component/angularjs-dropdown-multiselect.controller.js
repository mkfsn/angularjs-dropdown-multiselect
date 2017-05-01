/*
	eslint no-param-reassign: [
		"error",
		{
			"props": true,
			"ignorePropertyModificationsFor": [
				"$scope"
			]
		}
	]
*/

const Mode = {
	normal: 1,
	edit: 2,
};

function contains(collection, target) {
	let containsTarget = false;
	collection.some((object) => {
		if (object === target) {
			containsTarget = true;
			return true;
		}
		return false;
	});
	return containsTarget;
}

function getIndexByProperty(collection, objectToFind, property) {
	let index = -1;
	collection.some((option, ind) => {
		if (option[property] === objectToFind[property]) {
			index = ind;
			return true;
		}
		return false;
	});
	return index;
}

export default function dropdownMultiselectController(
		$scope,
		$element,
		$filter,
		$document,
) {
	'ngInject';

	$scope.mode = Mode.normal;

	const $dropdownTrigger = $element.children()[0];
	const externalEvents = {
		onItemSelect: angular.noop,
		onItemDeselect: angular.noop,
		onSelectAll: angular.noop,
		onDeselectAll: angular.noop,
		onInitDone: angular.noop,
		onMaxSelectionReached: angular.noop,
		onSearchNotFound: angular.noop,
		onSelectionChanged: angular.noop,
		onOptionUpdate: angular.noop,
		onClose: angular.noop,
	};

	const settings = {
		dynamicTitle: true,
		dynamicSearchBox: false,
		scrollable: false,
		scrollableHeight: '300px',
		closeOnBlur: true,
		closeOnTab: false,
		showNotFound: false,
		forceFocusSearchField: false,
		enterSelectAll: true,
		displayProp: 'label',
		enableSearch: false,
		clearSearchOnClose: false,
		selectionLimit: 0,
		showAmount: false,
		showCheckAll: true,
		showUncheckAll: true,
		showEnableSearchButton: false,
		seperateSelectedItem: false,
		closeOnSelect: false,
		buttonClasses: 'btn btn-default',
		closeOnDeselect: false,
		groupBy: undefined,
		checkBoxes: false,
		groupByTextProvider: null,
		smartButtonMaxItems: 0,
		smartButtonTextConverter: angular.noop,
		customHTML: angular.noop,
		customFilter: null,
		styleActive: false,
		selectedToTop: false,
		keyboardControls: false,
		template: '{{getPropertyForObject(option, settings.displayProp)}}',
		searchField: '$',
		showAllSelectedText: false,
	};

	const texts = {
		checkAll: 'Check All',
		uncheckAll: 'Uncheck All',
		selectionCount: 'checked',
		selectionOf: '/',
		searchPlaceholder: 'Search...',
		buttonDefaultText: 'Select',
		dynamicButtonTextSuffix: 'checked',
		customFilterLabel: null,
		disableSearch: 'Disable search',
		enableSearch: 'Enable search',
		selectGroup: 'Select all:',
		searchNotFoundText: 'No Result',
		allSelectedText: 'All',
	};

	const input = {
		searchFilter: $scope.searchFilter || '',
		editText: $scope.editText || '',
	};

	angular.extend(settings, $scope.extraSettings || []);
	angular.extend(externalEvents, $scope.events || []);
	angular.extend(texts, $scope.translationTexts);

	if (settings.closeOnBlur) {
		$document.on('click', (e) => {
			$scope.mode = Mode.normal;
			if ($scope.open) {
				let target = e.target.parentElement;
				let parentFound = false;

				while (angular.isDefined(target) && target !== null && !parentFound) {
					if (!!target.className.split && contains(target.className.split(' '), 'multiselect-parent') && !parentFound) {
						if (target === $dropdownTrigger) {
							parentFound = true;
						}
					}
					target = target.parentElement;
				}

				if (!parentFound) {
					$scope.$apply(() => {
						$scope.close();
					});
				}
			}
		});
	}

	$scope.$on('$destroy', () => {
		$document.off('click');
	});

	angular.extend($scope, {
		toggleDropdown,
		checkboxClick,
		externalEvents,
		settings,
		texts,
		input,
		close,
		selectCurrentGroup,
		getGroupLabel,
		getButtonText,
		getPropertyForObject,
		selectAll,
		deselectAll,
		setSelectedItem,
		isChecked,
		keyDownLink,
		keyDownSearchDefault,
		keyDownSearch,
		finishEdit,
		isEditMode,
		getFilter,
		toggleSearch,
		keyDownToggleSearch,
		tryCustomFilter,
		tryShowAmount,
		orderFunction,
		enterEditMode,
	});
	$scope.customFilteredItem = [];

	$scope.externalEvents.onInitDone();
	if (settings.seperateSelectedItem) {
		$scope.$watch('[selectedModel, options]', () => {
			updateSelection();
		}, true);
	}

	function updateSelection() {
		$scope.selectedItem = $scope.options.filter(v => $scope.isChecked(v) && v.visible);
		if ($scope.mode === Mode.normal) {
			$scope.unSelectedItem = $scope.options.filter(v => !$scope.isChecked(v) && !v.editable && v.visible);
		} else {
			$scope.unSelectedItem = $filter('filter')($scope.options, $scope.getFilter($scope.input.searchFilter))
				.filter(v => !$scope.isChecked(v) && !v.editable && v.visible);
		}
	}

	function focusFirstOption() {
		setTimeout(() => {
			const elementToFocus = angular.element($element)[0].querySelector('.option');
			if (angular.isDefined(elementToFocus) && elementToFocus != null) {
				elementToFocus.focus();
			}
		}, 0);
	}

	function focusSearchField() {
		setTimeout(() => {
			const elementToFocus = angular.element($element)[0].querySelector('.searchField');
			if (angular.isDefined(elementToFocus) && elementToFocus != null) {
				if ($scope.settings.dynamicSearchBox && $scope.open && !$scope.editModel) {
					elementToFocus.classList.remove('ng-hide');
				}
				elementToFocus.focus();
			}
		}, 0);
	}

	function toggleDropdown() {
		if ($scope.open) {
			$scope.close();
		} else { $scope.open = true; }
		if ($scope.settings.keyboardControls) {
			if ($scope.open) {
				if ($scope.settings.forceFocusSearchField) {
					focusSearchField();
				} else if ($scope.settings.selectionLimit === 1 && $scope.settings.enableSearch) {
					focusSearchField();
				} else {
					focusFirstOption();
				}
			}
		}
		if ($scope.settings.enableSearch) {
			if ($scope.open) {
				updateSelection();
				focusSearchField();
			}
		}
	}

	function checkboxClick($event, option) {
		$scope.setSelectedItem(option, false, true);
		$event.stopImmediatePropagation();
	}

	function close() {
		$scope.open = false;
		$scope.input.searchFilter = $scope.settings.clearSearchOnClose ? '' : $scope.input.searchFilter;
		$scope.customFilteredItem = [];
		$scope.externalEvents.onClose();
	}

	function selectCurrentGroup(currentGroup) {
		$scope.selectedModel.splice(0, $scope.selectedModel.length);
		$scope.options.forEach((item) => {
			if (item[$scope.settings.groupBy] === currentGroup) {
				$scope.setSelectedItem(item, false, false);
			}
		});
		$scope.externalEvents.onSelectionChanged();
	}

	function getGroupLabel(groupValue) {
		if ($scope.settings.groupByTextProvider !== null) {
			return $scope.settings.groupByTextProvider(groupValue);
		}

		return groupValue;
	}

	function getButtonText() {
		if ($scope.settings.dynamicTitle && $scope.selectedModel && $scope.selectedModel.length > 0) {
			if ($scope.settings.smartButtonMaxItems > 0) {
				let itemsText = [];

				angular.forEach($scope.options, (optionItem) => {
					if ($scope.isChecked(optionItem)) {
						const displayText = $scope.getPropertyForObject(optionItem, $scope.settings.displayProp);
						const converterResponse = $scope.settings.smartButtonTextConverter(displayText, optionItem);

						itemsText.push(converterResponse || displayText);
					}
				});

				if ($scope.selectedModel.length > $scope.settings.smartButtonMaxItems) {
					itemsText = itemsText.slice(0, $scope.settings.smartButtonMaxItems);
					itemsText.push('...');
				}

				return itemsText.join(', ');
			}
			const totalSelected = angular.isDefined($scope.selectedModel) ? $scope.selectedModel.length : 0;

			if (totalSelected === 0) {
				return $scope.texts.buttonDefaultText;
			}

			if ($scope.settings.showAllSelectedText && totalSelected === $scope.options.length) {
				return $scope.texts.allSelectedText;
			}

			return `${totalSelected} ${$scope.texts.dynamicButtonTextSuffix}`;
		}
		return $scope.texts.buttonDefaultText;
	}

	function getPropertyForObject(object, property) {
		if (angular.isDefined(object) && Object.prototype.hasOwnProperty.call(object, property)) {
			return object[property];
		}

		return undefined;
	}

	function selectAll() {
		$scope.deselectAll(true);
		$scope.externalEvents.onSelectAll();

		const searchResult = $filter('filter')($scope.options, $scope.getFilter($scope.input.searchFilter));
		angular.forEach(searchResult, (value) => {
			$scope.setSelectedItem(value, true, false);
		});
		$scope.externalEvents.onSelectionChanged();
		$scope.selectedGroup = null;
	}

	function deselectAll(dontSendEvent = false) {
		if (!dontSendEvent) {
			$scope.externalEvents.onDeselectAll();
		}

		$scope.selectedModel.splice(0, $scope.selectedModel.length);
		if (!dontSendEvent) {
			$scope.externalEvents.onSelectionChanged();
		}
		$scope.selectedGroup = null;
	}

	function setSelectedItem(option, dontRemove = false, fireSelectionChange) {
		let exists;
		let indexOfOption;
		if (angular.isDefined(settings.idProperty)) {
			exists = getIndexByProperty($scope.selectedModel, option, settings.idProperty) !== -1;
			indexOfOption = getIndexByProperty($scope.selectedModel, option, settings.idProperty);
		} else {
			exists = $scope.selectedModel.indexOf(option) !== -1;
			indexOfOption = $scope.selectedModel.indexOf(option);
		}

		$scope.mode = Mode.normal;
		$scope.input.searchFilter = exists ? '' : option.name;

		if (!dontRemove && exists) {
			$scope.selectedModel.splice(indexOfOption, 1);
			$scope.externalEvents.onItemDeselect(option);
			if ($scope.settings.closeOnDeselect) {
				$scope.close();
			}
		} else if (!exists && ($scope.settings.selectionLimit === 0 || $scope.selectedModel.length < $scope.settings.selectionLimit)) {
			$scope.selectedModel.push(option);
			if (fireSelectionChange) {
				$scope.externalEvents.onItemSelect(option);
			}
			if ($scope.settings.closeOnSelect) {
				$scope.close();
			}
			if ($scope.settings.selectionLimit > 0 && $scope.selectedModel.length === $scope.settings.selectionLimit) {
				$scope.externalEvents.onMaxSelectionReached();
			}
		} else if ($scope.settings.selectionLimit === 1 && !exists && $scope.selectedModel.length === $scope.settings.selectionLimit) {
			$scope.selectedModel.splice(0, 1);
			$scope.selectedModel.push(option);
			if (fireSelectionChange) {
				$scope.externalEvents.onItemSelect(option);
			}
			if ($scope.settings.closeOnSelect) {
				$scope.close();
			}
		}
		if (fireSelectionChange) {
			$scope.externalEvents.onSelectionChanged();
		}
		$scope.selectedGroup = null;

		if (!$scope.settings.closeOnSelect && $scope.settings.forceFocusSearchField) {
			focusSearchField();
		}
	}

	function isChecked(option) {
		if (angular.isDefined(settings.idProperty)) {
			return getIndexByProperty($scope.selectedModel, option, settings.idProperty) !== -1;
		}
		return $scope.selectedModel.indexOf(option) !== -1;
	}

	function keyDownLink(event) {
		const sourceScope = angular.element(event.target).scope();
		let nextOption;
		let parent = event.target.parentNode;
		if (!$scope.settings.keyboardControls) {
			return;
		}
		if (event.keyCode === 13 || event.keyCode === 32) { // enter
			event.preventDefault();
			if (sourceScope.option) {
				$scope.setSelectedItem(sourceScope.option, false, true);
			} else if (event.target.id === 'deselectAll') {
				$scope.deselectAll();
			} else if (event.target.id === 'selectAll') {
				$scope.selectAll();
			}
		} else if (event.keyCode === 38) { // up arrow
			event.preventDefault();
			if (parent.previousElementSibling) {
				nextOption = parent.previousElementSibling.querySelector('a') || parent.previousElementSibling.querySelector('input');
			}
			while (!nextOption && !!parent) {
				parent = parent.previousElementSibling;
				if (parent) {
					nextOption = parent.querySelector('a') || parent.querySelector('input');
				}
			}
			if (nextOption) {
				nextOption.focus();
			}
		} else if (event.keyCode === 40) { // down arrow
			event.preventDefault();
			if (parent.nextElementSibling) {
				nextOption = parent.nextElementSibling.querySelector('a') || parent.nextElementSibling.querySelector('input');
			}
			while (!nextOption && !!parent) {
				parent = parent.nextElementSibling;
				if (parent) {
					nextOption = parent.querySelector('a') || parent.querySelector('input');
				}
			}
			if (nextOption) {
				nextOption.focus();
			}
		} else if (event.keyCode === 27) {
			event.preventDefault();

			$scope.toggleDropdown();
		}
	}

	function keyDownSearchDefault(event) {
		let parent = event.target.parentNode.parentNode;
		let nextOption;
		if (!$scope.settings.keyboardControls) {
			return;
		}
		if (event.keyCode === 9) { // tab
			event.preventDefault();
			if ($scope.settings.closeOnTab) {
				$scope.toggleDropdown();
				const tabindex = parseInt($element.find('button.dropdown-toggle').attr('tabindex'), 10);
				angular.element(`[tabindex=${tabindex + 1}]`).focus();
			} else {
				focusFirstOption();
			}
		} else if (event.keyCode === 40) { // down
			event.preventDefault();
			focusFirstOption();
		} else if (event.keyCode === 38) { // up
			event.preventDefault();
			if (parent.previousElementSibling) {
				nextOption = parent.previousElementSibling.querySelector('a') || parent.previousElementSibling.querySelector('input');
			}
			while (!nextOption && !!parent) {
				parent = parent.previousElementSibling;
				if (parent) {
					nextOption = parent.querySelector('a') || parent.querySelector('input');
				}
			}
			if (nextOption) {
				nextOption.focus();
			}
		} else if (event.keyCode === 27) { // esc
			event.preventDefault();

			$scope.toggleDropdown();
		}
	}

	function keyDownSearch(event, searchFilter) {
		let searchResult;
		if (!$scope.settings.keyboardControls) {
			return;
		}
		if (event.keyCode === 13) {
			if ($scope.settings.selectionLimit === 1 && $scope.settings.enableSearch) {
				searchResult = $filter('filter')($scope.options, $scope.getFilter(searchFilter));
				if (searchResult.length === 1) {
					$scope.setSelectedItem(searchResult[0], false, true);
				}
			} else if ($scope.settings.enableSearch && $scope.settings.enterSelectAll) {
				$scope.selectAll();
			}
			$scope.finishEdit();
			$scope.customFilteredItem = [];
		}
	}

	function finishEdit() {
		if ($scope.mode !== Mode.edit) {
			return;
		}
		$scope.externalEvents.onOptionUpdate($scope.editModel, $scope.input.searchFilter);
		$scope.mode = Mode.normal;
		$scope.editModel = undefined;
		$scope.close();
	}

	function getFilter(searchFilter) {
		const filter = {};
		filter[$scope.settings.searchField] = searchFilter;
		return filter;
	}

	function toggleSearch($event) {
		if ($event) {
			$event.stopPropagation();
		}
		$scope.settings.enableSearch = !$scope.settings.enableSearch;
		if (!$scope.settings.enableSearch) {
			$scope.input.searchFilter = '';
		}
	}

	function keyDownToggleSearch() {
		if (!$scope.settings.keyboardControls) {
			return;
		}
		if (event.keyCode === 13) {
			$scope.toggleSearch();
			if ($scope.settings.enableSearch) {
				focusSearchField();
			} else {
				focusFirstOption();
			}
		}
	}

	function tryCustomFilter() {
		$scope.mode = Mode.edit;
		if ($scope.settings.customFilter !== null) {
			$scope.unSelectedItem = $filter('filter')($scope.options, $scope.getFilter($scope.input.searchFilter))
				.filter(v => !$scope.isChecked(v) && !v.editable && v.visible);
			$scope.customFilteredItem = $scope.settings.customFilter($scope.input.searchFilter, $scope.options);
		}
	}

	function isEditMode() {
		return $scope.mode === Mode.edit;
	}

	function tryShowAmount(items) {
		if ($scope.settings.showAmount) {
			return `(${items.length})`;
		}
		return '';
	}

	function orderFunction(object1, object2) {
		if (angular.isUndefined(object2)) {
			return -1;
		}
		if (angular.isUndefined(object1)) {
			return 1;
		}
		if (object1.type !== 'object' || object2.type !== 'object') {
			return (object1.index < object2.index) ? -1 : 1;
		}
		const v1 = object1.value;
		const v2 = object2.value;
		// first order by group
		if ($scope.settings.groupBy) {
			if (v1[$scope.settings.groupBy] !== v2[$scope.settings.groupBy]) {
				if (v1[$scope.settings.groupBy] < v2[$scope.settings.groupBy]) {
					return 1;
				}
				return -1;
			}
		}
		if (!$scope.settings.selectedToTop) {
			return $scope.options.indexOf(v1) < $scope.options.indexOf(v2) ? -1 : 1;
		}
		// then order selected to top
		if ((!$scope.isChecked(v1) && !$scope.isChecked(v2)) ||
			($scope.isChecked(v1) && $scope.isChecked(v2))) {
			return $scope.options.indexOf(v1) < $scope.options.indexOf(v2) ? -1 : 1;
		}
		if ($scope.isChecked(v1)) {
			return -1;
		}
		return 1;
	}

	function enterEditMode(option) {
		$scope.input.searchFilter = option.name;
		if (option.editable) {
			$scope.editModel = option;
		} else {
			$scope.editModel = undefined;
		}
		focusSearchField();
	}
}
