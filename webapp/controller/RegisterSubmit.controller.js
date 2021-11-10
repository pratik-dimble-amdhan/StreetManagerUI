sap.ui.define([
	"project1/controller/base/BaseController",
], function (BaseController) {
	"use strict";

	return BaseController.extend("SAP.UKPN.UI.PermitApplication.controller.RegisterSubmit", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.RegisterSubmit
		 */
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("RegisterSubmit").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function () {

		},

		onBackHome: function () {
			this.oRouter.navTo("RouteHome");
		},

		onSearchPermit: function () {
			this.doNavTo("Search");
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.RegisterSubmit
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.RegisterSubmit
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.RegisterSubmit
		 */
		//	onExit: function() {
		//
		//	}

	});

});