sap.ui.define(
	[
		"project1/controller/base/BaseObject",
		"project1/services/configHelper"
	],
	function (BaseObject, ConfigHelper) {
		"use strict";

		var oInstance;
		/**
		 * Module for executing the calls of the controllers to the backend server
		 * @extends SAP/UKPN/UI/PermitApplication/base/BaseObject
		 * @author Manuel Navarro Ruiz
		 * @constructor
		 * @public
		 * @module SAP/UKPN/UI/PermitApplication/services/ajaxCaller
		 */
		var AjaxCaller = BaseObject.extend(
			"project1.services.ajaxCaller", /** @lends module:SAP/UKPN/UI/PermitApplication/services/ajaxCaller# */ {
				_sEtag: null,

				/**
				 * Public method to perform an AJAX call with given parameters
				 * @public
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST/PUT/MERGE case
				 * @param  {object} oUrlParams                Data to send in as URL parameters
				 * @param  {string} eTag					  ETag for resource locking	
				 * @return {promise}                          Promise generated from ajax call
				 */
				requestAjax: function (
					sMethod,
					sUrl,
					oValues,
					oUrlParams,
					eTag
				) {
					return this._doAjaxCall(
						sMethod.toLowerCase(),
						sUrl,
						oValues,
						oUrlParams,
						eTag
					);
				},
				requestRestAjax: function (
					sMethod,
					sUrl,
					oValues,
					sTimeoutDuration,
					sDataType,
					aParamResponseHttpHeaders,
					sAuth,
					eTagHeader
				) {
					return this._doRestAjaxCall(
						sMethod.toUpperCase(),
						sUrl,
						oValues,
						sTimeoutDuration,
						sDataType,
						aParamResponseHttpHeaders,
						sAuth,
						eTagHeader
					);
				},

				/* =========================================================== */
				/* begin: internal methods                                     */
				/* =========================================================== */

				/**
				 * Private method to perform an AJAX call with given parameters
				 * @private
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST/PUT/MERGE case
				 * @param  {object} oUrlParams                Data to send in as URL parameters
				 * @param  {string} eTag					  ETag for resource locking	
				 * @return {promise}                          Promise generated from ajax call
				 */
				_doAjaxCall: function (
					sMethod,
					sUrl,
					oValues,
					oUrlParams,
					eTag
				) {
					oValues = oValues || "";
					oUrlParams = oUrlParams || {};

					return new Promise(function (resolve, reject) {
						if (!window["navigator"].onLine) {
							//Send NO NETWORK available
							reject({
								id: "NO_NETWORK",
								error: {}
							});
						} else {
							var aCallParams = [sUrl, {
								success: function (oResponse) {
									//Send response
									resolve(oResponse);
								},
								error: function (oError) {
									//Send complete error to evaluate what to do
									reject({
										id: "HTTP_ERROR",
										error: oError
									});
								},
								urlParameters: oUrlParams,
								eTag: eTag
							}];

							if (sMethod === "create" || sMethod === "update") {
								aCallParams.splice(1, 0, oValues);
							}

							this.getOwnerComponent().getModel()[sMethod].apply(this.getOwnerComponent().getModel(), aCallParams);
						}
					}.bind(this));
				},
				_doRestAjaxCall: function (
					sMethod,
					sUrl,
					oValues,
					sTimeoutDuration,
					sDataType,
					aParamResponseHttpHeaders,
					sAuth,
					eTagHeader
				) {
					sDataType = sDataType || "json";
					oValues = oValues || "";
					sTimeoutDuration = sTimeoutDuration || "long";
					/**if(oValues !== ""){
						oValues = this._changeDatesToGMT(oValues);
					}**/
					var sContentType = "";
					if (sDataType === "json") {
						sContentType = "application/json; charset=UTF-8";
					} else if (sDataType === "xml") {
						sContentType = "application/xml; charset=UTF-8";
					}

					var oFormattedValues;
					if (oValues instanceof Blob || !oValues) {
						oFormattedValues = oValues;
					} else if (typeof oValues === "string" || sDataType === "form") {
						oFormattedValues = oValues;
					} else {
						oFormattedValues = JSON.stringify(oValues);
					}

					var oHeaders = {};

					if (sDataType && sDataType !== "form") {
						oHeaders["Content-Type"] = sContentType;
					}

					if (sAuth) {
						oHeaders.Authorization = "Basic " + sAuth;
					}
					if (sMethod !== "GET") {
						oHeaders["x-csrf-token"] = this.getOwnerComponent().CSRFToken;
					}

					if (eTagHeader) {
						oHeaders[eTagHeader] = this._sEtag;
					}

					var component = this.getOwnerComponent();
					if ( sMethod === "GET") {
						oHeaders["x-csrf-token"] = "Fetch";
					}
					return new Promise(function (resolve, reject) {
						if (!window["navigator"].onLine) {
							//Send NO NETWORK available
							reject({
								id: "NO_NETWORK",
								error: {}
							});
						} else {
							jQuery.ajax({
								cache: false,
								crossDomain: false,
								timeout: ConfigHelper.getInstance().getTimeout(
									sTimeoutDuration
								),
								type: sMethod,
								url: sUrl,
								headers: oHeaders,
								contentType: sDataType === "form" ? false : "multipart/form-data; charset=UTF-8",
								dataType: sDataType !== "raw" ? "json" : "text",
								processData: false,
								data: oFormattedValues,
								success: function (response, textStatus, jqXHR) {
									if (jqXHR.getResponseHeader("com.sap.cloud.security.login")) {
										// publish message in the event manager
										var oEventBus = sap.ui.getCore().getEventBus();
										oEventBus.publish("xpr:ajaxCaller", "sessionTimeout", {});
										//Generation of an orphaned promise
										return;
									}

									//Only takes into account if service wants to receive some HTTP Response Header
									if (aParamResponseHttpHeaders) {
										var oParamValueReponseHttpHeaders = {};

										//Add http response header in a special attribute of retrieved data
										aParamResponseHttpHeaders.forEach(function (
											sParamResponseHttpHeader
										) {
											var sValueResponseHeader = jqXHR.getResponseHeader(
												sParamResponseHttpHeader
											);
											if (sValueResponseHeader) {
												oParamValueReponseHttpHeaders[
													sParamResponseHttpHeader
												] = sValueResponseHeader;
											}
										});

										if (oParamValueReponseHttpHeaders) {
											response.responseHttpHeaders = oParamValueReponseHttpHeaders;
										}
									}
									//Send response
									resolve(response);
								},
								error: function (jqXHR, textStatus) {
									if (textStatus === "timeout") {
										//Send TIMEOUT obtained
										reject({
											id: "TIMEOUT",
											error: {}
										});
									} else {
										//Send complete error to evaluate what to do
										reject({
											id: "HTTP_ERROR",
											error: jqXHR
										});
									}
								},
								complete: function (xhr) {
									if (component.CSRFToken === null) {
										component.CSRFToken = xhr.getResponseHeader("X-CSRF-Token");
										component.getModel("oModel").setProperty("/CSRFToken", xhr.getResponseHeader("X-CSRF-Token"));
									}
									if (xhr.getResponseHeader('ETag') && xhr.getResponseHeader('ETag') !== "") {
										this._sEtag = xhr.getResponseHeader('ETag');
									}
								}.bind(this)
							});
						}
					}.bind(this));
				},

				_changeDatesToGMT: function (oData) {
					var changeDateToGMT = function (dDate) {
						if (dDate instanceof Date) {
							return new Date(dDate.getTime() + (dDate.getTimezoneOffset() * 60 * 1000));
						}
						return null;
					};
					for (var property in oData) {
						if (oData.hasOwnProperty(property)) {
							if (oData[property] instanceof Date) {
								oData[property] = changeDateToGMT(oData[property]);
							} else if (moment(oData[property], "YYYY-MM-DDTHH:mm:ssZ", true).isValid()) {
								oData[property] = changeDateToGMT(new Date(oData[property].split("Z")[0]));
							} else if (moment(oData[property], "YYYY-MM-DDTHH:mm:ss", true).isValid()) {
								oData[property] = changeDateToGMT(new Date(oData[property]));
							} else if (typeof oData[property] === "object") {
								oData[property] = this._changeDatesToGMT(oData[property]);
							}
						}
					}
					return oData;
				}
			}

		);

		return /** @lends module:SAP/UKPN/UI/PermitApplication/services/ajaxCaller */ {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @return {SAP.UKPN.UI.PermitApplication.services.ajaxCaller} The AjaxCaller instance
			 */
			getInstance: function () {
				if (!oInstance) {
					oInstance = new AjaxCaller();
				}
				return oInstance;
			}
		};
	}
);