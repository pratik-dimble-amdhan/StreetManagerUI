sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";

	/**
	 * @class
	 * @desc Base object from which all other utility objects inherit
	 * @extends sap/ui/base/Object
	 * @author Manuel Navarro Ruiz
	 * @constructor
	 * @public
	 * @module SAP/UKPN/UI/PermitApplication/base/BaseObject
	 */
	return Object.extend("project1.controller.base.BaseObject", /** @lends module:SAP/UKPN/UI/PermitApplication/base/BaseObject# */ {
		/**
		 * Return a reference to the owner component
		 *
		 * @return {sap.ui.core.Component} Owner component
		 * @public
		 */
		getOwnerComponent: function () {
			return this._oOwnerComponent;
		},

		/**
		 * Register owner component to the created object
		 *
		 * @param  {sap.ui.core.Component} oOwnerComponent Owner component for current object
		 * @return {undefined}
		 * @public
		 */
		setOwnerComponent: function (oOwnerComponent) {
			this._oOwnerComponent = oOwnerComponent;
		},

		/**
		 * Return a reference to the event bus
		 *
		 * @return {sap.ui.core.EventBus} Owner component
		 * @public
		 */
		getEventBus: function () {
			return this._oEventBus;
		},

		/**
		 * Register event bus to the created object
		 *
		 * @param  {sap.ui.core.Component} oEventBus Event bus associatted
		 * @return {undefined}
		 * @public
		 */
		setEventBus: function (oEventBus) {
			this._oEventBus = oEventBus;
		}
	});
});