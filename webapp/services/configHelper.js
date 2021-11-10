sap.ui.define(
	[
		"project1/controller/base/BaseObject"
	],
	function (BaseObject) {
		"use strict";

		var oInstance;
		/**
		 * Module for extracting configuration values from the config.json file
		 * @extends project1/controller/base/BaseObject
		 * @author Manuel Navarro Ruiz
		 * @constructor
		 * @public
		 * @module project1/services/configHelper
		 */
		var ConfigHelper = BaseObject.extend(
			"project1.services.configHelper", /** @lends module:SAP/UKPN/UI/PermitApplication/services/configHelper# */ {
				/* =========================================================== */
				/* begin: public methods                                       */
				/* =========================================================== */

				init: function () {
					//Load config from manifest
					this._oConfigData = this.getOwnerComponent()
						.getMetadata()
						.getConfig();
				},
		getOwnerComponent: function () {
			return this._oOwnerComponent;
		},

				/**
				 * Get specific url path and mehod call
				 * @public
				 * @param {string} sApiPath The API path
				 * @param {string} sApiMethod The HTTP Method
				 * @return {object} Get API Method specific context path and http method
				 */
				getCallData: function (sApiPath, sApiMethod, aUrlParams) {
					var sContextPath = "";
					sContextPath = this._oConfigData.urls[sApiPath].path;

					//If there are given parameters then apply it on url
					if (aUrlParams) {
						for (var i in aUrlParams) {
							if (aUrlParams.hasOwnProperty(i)) {
								sContextPath =
									sContextPath.split(/\$(.+)/)[0] +
									aUrlParams[i] +
									sContextPath.split(/\$(.+)/)[1];
							}
						}
					}
					//Delete possible unnecesary param placeHolders
					if (sContextPath.indexOf("$") !== -1) {
						sContextPath = sContextPath.split("$")[0];
					}

					var sMethod = "";
					sMethod = this._oConfigData.urls[sApiPath][sApiMethod].method;
					return {
						method: sMethod,
						url: sContextPath
					};
				},
				getTimeout: function (sTimeoutDuration) {
					return this._oConfigData.timeout[sTimeoutDuration];
				},

				getStatusArray: function () {
					return this._oConfigData.appData.statusArray;
				},

				/* =========================================================== */
				/* begin: internal methods                                     */
				/* =========================================================== */

				/**
				 * Get common url path and local auth for app
				 * @private
				 * @return {object} Get common context path and local auth
				 */
				_getCommonPath: function () {
					return this._oConfigData.urls.path;
				}
			}
		);

		return /** @lends module:SAP/UKPN/UI/PermitApplication/services/configHelper */ {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @return {SAP.UKPN.UI.PermitApplication.services.ConfigHelper} ConfigHelp singleton instance
			 */
			getInstance: function () {
				if (!oInstance) {
					oInstance = new ConfigHelper();
				}
				return oInstance;
			}
		};
	}
);